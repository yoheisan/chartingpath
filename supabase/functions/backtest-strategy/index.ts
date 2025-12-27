import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// REGIME ANALYTICS (Research-Grade)
// ============================================

type TrendRegime = 'UP' | 'DOWN' | 'FLAT';
type VolatilityRegime = 'LOW' | 'MED' | 'HIGH';

interface RegimeLabel {
  trend: TrendRegime;
  volatility: VolatilityRegime;
  key: string;
}

interface RegimeConfig {
  version: 1;
  trend: {
    indicator: 'SMA' | 'EMA';
    period: number;
    thresholdPercent: number;
  };
  volatility: {
    atrPeriod: number;
    lookbackBars: number;
  };
}

const DEFAULT_REGIME_CONFIG: RegimeConfig = {
  version: 1,
  trend: { indicator: 'EMA', period: 50, thresholdPercent: 0.5 },
  volatility: { atrPeriod: 14, lookbackBars: 100 },
};

/**
 * Compute regime label for a specific bar (bar-close semantics)
 */
function computeRegimeLabelAtBar(
  bars: Array<{ open: number; high: number; low: number; close: number }>,
  barIndex: number,
  config: RegimeConfig = DEFAULT_REGIME_CONFIG
): RegimeLabel {
  // Use only data up to and including barIndex (no lookahead)
  const barsToUse = bars.slice(0, barIndex + 1);
  
  if (barsToUse.length < Math.max(config.trend.period, config.volatility.lookbackBars)) {
    // Insufficient data - return neutral
    return { trend: 'FLAT', volatility: 'MED', key: 'FLAT_MED' };
  }
  
  const closes = barsToUse.map(b => b.close);
  const currentClose = closes[closes.length - 1];
  
  // Compute trend regime
  let ma: number;
  if (config.trend.indicator === 'EMA') {
    ma = calculateEMAForRegime(closes, config.trend.period);
  } else {
    ma = calculateSMAForRegime(closes, config.trend.period);
  }
  
  const priceVsMa = ((currentClose - ma) / ma) * 100;
  let trend: TrendRegime;
  if (priceVsMa > config.trend.thresholdPercent) {
    trend = 'UP';
  } else if (priceVsMa < -config.trend.thresholdPercent) {
    trend = 'DOWN';
  } else {
    trend = 'FLAT';
  }
  
  // Compute volatility regime using ATR percentile
  const atrValues = computeATRSeries(barsToUse, config.volatility.atrPeriod);
  const lookbackAtrs = atrValues.slice(-config.volatility.lookbackBars);
  const currentAtr = lookbackAtrs[lookbackAtrs.length - 1];
  
  // Sort to find percentile
  const sortedAtrs = [...lookbackAtrs].sort((a, b) => a - b);
  const percentileIndex = sortedAtrs.findIndex(v => v >= currentAtr);
  const percentile = (percentileIndex / sortedAtrs.length) * 100;
  
  let volatility: VolatilityRegime;
  if (percentile < 33) {
    volatility = 'LOW';
  } else if (percentile < 67) {
    volatility = 'MED';
  } else {
    volatility = 'HIGH';
  }
  
  return { trend, volatility, key: `${trend}_${volatility}` };
}

function calculateSMAForRegime(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  return prices.slice(-period).reduce((sum, p) => sum + p, 0) / period;
}

function calculateEMAForRegime(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

function computeATRSeries(
  bars: Array<{ open: number; high: number; low: number; close: number }>,
  period: number
): number[] {
  if (bars.length < 2) return [0];
  
  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const highLow = bars[i].high - bars[i].low;
    const highPrevClose = Math.abs(bars[i].high - bars[i - 1].close);
    const lowPrevClose = Math.abs(bars[i].low - bars[i - 1].close);
    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }
  
  // Compute running ATR
  const atrSeries: number[] = [];
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period - 1) {
      atrSeries.push(trueRanges.slice(0, i + 1).reduce((s, v) => s + v, 0) / (i + 1));
    } else {
      atrSeries.push(trueRanges.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0) / period);
    }
  }
  
  return atrSeries;
}

// ============================================
// TRADE LEDGER ENTRY (Canonical Research Record)
// ============================================

interface TradeLedgerEntry {
  id: string;
  runId: string;
  strategyId?: string;
  symbol: string;
  timeframe: string;
  patternId: string;
  patternName: string;
  patternDirection: 'long' | 'short';
  entryTime: string;
  exitTime: string;
  entryBarIndex: number;
  exitBarIndex: number;
  holdingBars: number;
  entryPrice: number;
  exitPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  riskAmount: number;
  rewardPotential: number;
  plannedRR: number;
  actualRMultiple: number;
  mfe: number;
  mae: number;
  mfeRMultiple: number;
  maeRMultiple: number;
  exitReason: 'target' | 'stop-loss' | 'timeout' | 'manual';
  pnlPercent: number;
  pnlAbsolute: number;
  isWin: boolean;
  regimeAtEntry: RegimeLabel;
  disciplineValidation: {
    passed: boolean;
    filtersApplied: string[];
    rejectionReasons: string[];
  };
  createdAt: string;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// DISCIPLINE FILTERS (Bloomberg-Grade)
// ============================================

interface DisciplineFilters {
  trendAlignmentEnabled: boolean;
  trendTimeframe: '4h' | 'daily' | 'weekly';
  trendIndicator: 'ema50' | 'ema200' | 'sma50' | 'sma200';
  minRiskRewardEnabled: boolean;
  minRiskReward: number;
  volumeConfirmationEnabled: boolean;
  volumeMultiplier: number;
  maxPatternsEnabled: boolean;
  maxPatterns: number;
  maxConcurrentTradesEnabled: boolean;
  maxConcurrentTrades: number;
  timeFilterEnabled: boolean;
  avoidLowLiquidity: boolean;
  avoidNewsEvents: boolean;
  atrStopValidationEnabled: boolean;
  minAtrMultiplier: number;
  cooldownEnabled: boolean;
  cooldownBars: number;
}

interface DisciplineValidation {
  allowed: boolean;
  rejectionReasons: string[];
}

interface DisciplineStats {
  totalSignals: number;
  allowedTrades: number;
  rejectedTrades: number;
  rejectionRate: number;
  rejectionsByFilter: Record<string, number>;
}

// Default filters are LENIENT to ensure trades execute - user can tighten
const DEFAULT_DISCIPLINE_FILTERS: DisciplineFilters = {
  trendAlignmentEnabled: false,  // Disabled by default - patterns work in any trend
  trendTimeframe: 'daily',
  trendIndicator: 'ema50',
  minRiskRewardEnabled: false,   // Disabled - let pattern define R:R
  minRiskReward: 1.5,
  volumeConfirmationEnabled: false, // Disabled - volume data often incomplete
  volumeMultiplier: 1.2,
  maxPatternsEnabled: false,
  maxPatterns: 5,
  maxConcurrentTradesEnabled: false,
  maxConcurrentTrades: 3,
  timeFilterEnabled: false,      // Disabled by default
  avoidLowLiquidity: false,
  avoidNewsEvents: false,
  atrStopValidationEnabled: false,
  minAtrMultiplier: 0.5,
  cooldownEnabled: false,
  cooldownBars: 3,
};

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

function calculateATR(bars: any[], period: number = 14): number {
  if (bars.length < 2) return 0;
  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const highLow = bars[i].high - bars[i].low;
    const highPrevClose = Math.abs(bars[i].high - bars[i - 1].close);
    const lowPrevClose = Math.abs(bars[i].low - bars[i - 1].close);
    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }
  if (trueRanges.length < period) {
    return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
  }
  return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
}

function calculateAverageVolume(bars: any[], period: number = 20): number {
  const volumeBars = bars.filter(b => b.volume != null && b.volume > 0);
  if (volumeBars.length === 0) return 0;
  const recentBars = volumeBars.slice(-period);
  return recentBars.reduce((sum, b) => sum + (b.volume || 0), 0) / recentBars.length;
}

function analyzeTrend(bars: any[], indicator: string): { direction: string; maValue: number } {
  const closes = bars.map(b => b.close);
  const currentPrice = closes[closes.length - 1];
  
  let period = 50;
  let useEma = true;
  
  switch (indicator) {
    case 'ema50': period = 50; useEma = true; break;
    case 'ema200': period = 200; useEma = true; break;
    case 'sma50': period = 50; useEma = false; break;
    case 'sma200': period = 200; useEma = false; break;
  }
  
  const maValue = useEma ? calculateEMA(closes, period) : calculateSMA(closes, period);
  const priceVsMa = ((currentPrice - maValue) / maValue) * 100;
  
  let direction = 'neutral';
  if (priceVsMa > 0.5) direction = 'bullish';
  else if (priceVsMa < -0.5) direction = 'bearish';
  
  return { direction, maValue };
}

function isLowLiquidityPeriod(dateStr: string): boolean {
  const d = new Date(dateStr);
  const utcHour = d.getUTCHours();
  const utcDay = d.getUTCDay();
  if (utcDay === 0 || utcDay === 6) return true;
  if (utcHour >= 21) return true;
  if (utcHour >= 5 && utcHour <= 6) return true;
  return false;
}

function isNearNewsEvent(dateStr: string): boolean {
  const d = new Date(dateStr);
  const utcHour = d.getUTCHours();
  const utcMinutes = d.getUTCMinutes();
  const utcDay = d.getUTCDay();
  if (utcDay === 0 || utcDay === 6) return false;
  
  const newsHours = [
    { hour: 7, minute: 0 },
    { hour: 8, minute: 30 },
    { hour: 12, minute: 30 },
    { hour: 13, minute: 0 },
    { hour: 14, minute: 0 },
  ];
  
  for (const news of newsHours) {
    const minutesFromNews = Math.abs(
      (utcHour * 60 + utcMinutes) - (news.hour * 60 + news.minute)
    );
    if (minutesFromNews <= 30) return true;
  }
  return false;
}

function validateTradeDiscipline(
  signal: any,
  historicalBars: any[],
  openPositions: any[],
  filters: DisciplineFilters,
  lastTradeExitBar: number | null,
  activePatternTypes: Set<string>,
  stats: DisciplineStats
): DisciplineValidation {
  const rejectionReasons: string[] = [];
  const currentBar = historicalBars[signal.index];
  
  // Determine if pattern is bullish or bearish
  const isBullishPattern = ['double-bottom', 'ascending-triangle', 'cup-handle', 'bull-flag']
    .some(p => signal.patternId.includes(p));
  const signalDirection = isBullishPattern ? 'long' : 'short';

  // 1. TREND ALIGNMENT
  if (filters.trendAlignmentEnabled) {
    const trend = analyzeTrend(historicalBars.slice(0, signal.index), filters.trendIndicator);
    const isTrendAligned = 
      (signalDirection === 'long' && trend.direction === 'bullish') ||
      (signalDirection === 'short' && trend.direction === 'bearish');
    
    if (!isTrendAligned && trend.direction !== 'neutral') {
      rejectionReasons.push(`Trend not aligned: ${signalDirection} in ${trend.direction} trend`);
      stats.rejectionsByFilter['Trend'] = (stats.rejectionsByFilter['Trend'] || 0) + 1;
    }
  }
  
  // 2. MINIMUM RISK/REWARD
  if (filters.minRiskRewardEnabled && signal.targetPercent && signal.stopPercent) {
    const rr = signal.targetPercent / signal.stopPercent;
    if (rr < filters.minRiskReward) {
      rejectionReasons.push(`R:R ${rr.toFixed(2)}:1 below ${filters.minRiskReward}:1 minimum`);
      stats.rejectionsByFilter['R:R'] = (stats.rejectionsByFilter['R:R'] || 0) + 1;
    }
  }
  
  // 3. VOLUME CONFIRMATION
  if (filters.volumeConfirmationEnabled && currentBar?.volume) {
    const avgVolume = calculateAverageVolume(historicalBars.slice(0, signal.index), 20);
    const volumeRatio = currentBar.volume / avgVolume;
    if (volumeRatio < filters.volumeMultiplier) {
      rejectionReasons.push(`Volume ${volumeRatio.toFixed(2)}x below ${filters.volumeMultiplier}x`);
      stats.rejectionsByFilter['Volume'] = (stats.rejectionsByFilter['Volume'] || 0) + 1;
    }
  }
  
  // 4. PATTERN LIMIT
  if (filters.maxPatternsEnabled) {
    if (!activePatternTypes.has(signal.patternId) && activePatternTypes.size >= filters.maxPatterns) {
      rejectionReasons.push(`Pattern limit: ${activePatternTypes.size}/${filters.maxPatterns}`);
      stats.rejectionsByFilter['Pattern'] = (stats.rejectionsByFilter['Pattern'] || 0) + 1;
    }
  }
  
  // 5. MAX CONCURRENT TRADES
  if (filters.maxConcurrentTradesEnabled) {
    if (openPositions.length >= filters.maxConcurrentTrades) {
      rejectionReasons.push(`Max positions: ${openPositions.length}/${filters.maxConcurrentTrades}`);
      stats.rejectionsByFilter['Max positions'] = (stats.rejectionsByFilter['Max positions'] || 0) + 1;
    }
  }
  
  // 6. TIME FILTERS
  if (filters.timeFilterEnabled && currentBar?.date) {
    if (filters.avoidLowLiquidity && isLowLiquidityPeriod(currentBar.date)) {
      rejectionReasons.push('Low liquidity period');
      stats.rejectionsByFilter['liquidity'] = (stats.rejectionsByFilter['liquidity'] || 0) + 1;
    }
    if (filters.avoidNewsEvents && isNearNewsEvent(currentBar.date)) {
      rejectionReasons.push('Near news event');
      stats.rejectionsByFilter['news'] = (stats.rejectionsByFilter['news'] || 0) + 1;
    }
  }
  
  // 7. ATR STOP VALIDATION
  if (filters.atrStopValidationEnabled && signal.stopPercent) {
    const atr = calculateATR(historicalBars.slice(0, signal.index), 14);
    const entryPrice = currentBar?.close || signal.entryPrice;
    const stopDistance = entryPrice * (signal.stopPercent / 100);
    const stopDistanceAtr = stopDistance / atr;
    
    if (stopDistanceAtr < filters.minAtrMultiplier) {
      rejectionReasons.push(`Stop ${stopDistanceAtr.toFixed(2)} ATR < ${filters.minAtrMultiplier} ATR`);
      stats.rejectionsByFilter['Stop'] = (stats.rejectionsByFilter['Stop'] || 0) + 1;
    }
  }
  
  // 8. COOLDOWN
  if (filters.cooldownEnabled && lastTradeExitBar !== null) {
    const barsSinceLastTrade = signal.index - lastTradeExitBar;
    if (barsSinceLastTrade < filters.cooldownBars) {
      rejectionReasons.push(`Cooldown: ${barsSinceLastTrade}/${filters.cooldownBars} bars`);
      stats.rejectionsByFilter['Cooldown'] = (stats.rejectionsByFilter['Cooldown'] || 0) + 1;
    }
  }
  
  return {
    allowed: rejectionReasons.length === 0,
    rejectionReasons
  };
}

// ============================================
// MAIN HANDLER
// ============================================

// Cache version to invalidate old metric semantics when changed
const CACHE_VERSION = 4;

// Generate cache key from strategy parameters
function generateCacheKey(strategy: any): string {
  const params = {
    version: CACHE_VERSION,
    instrument: strategy.market?.instrument || strategy.instrument,
    startDate: strategy.backtestPeriod?.startDate || strategy.startDate,
    endDate: strategy.backtestPeriod?.endDate || strategy.endDate,
    timeframe: strategy.market?.timeframes?.[0] || strategy.timeframe || '1d',
    patterns: (strategy.patterns || [])
      .filter((p: any) => p.enabled)
      .map((p: any) => p.id)
      .sort()
      .join(','),
    stopLoss: strategy.stopLossPercent || 1,
    takeProfit: strategy.targetGainPercent || 2
  };
  // Simple hash for cache key
  const str = JSON.stringify(params);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `bt_${Math.abs(hash).toString(36)}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { strategy, userId, wedgeEnabled } = await req.json();
    
    const instrument = strategy.market?.instrument || strategy.instrument;
    const instrumentCategory = strategy.market?.instrumentCategory || strategy.instrumentCategory || 'stocks';
    const startDate = strategy.backtestPeriod?.startDate || strategy.startDate;
    const endDate = strategy.backtestPeriod?.endDate || strategy.endDate;
    const timeframe = strategy.market?.timeframes?.[0] || strategy.timeframe || '1d';
    
    // ============================================
    // WEDGE MODE SERVER-SIDE ENFORCEMENT
    // ============================================
    // When wedgeEnabled=true, only crypto + 1h is allowed
    if (wedgeEnabled === true) {
      const normalizedTimeframe = timeframe?.toLowerCase()?.replace(/\s/g, '');
      const isValidWedgeTimeframe = normalizedTimeframe === '1h' || normalizedTimeframe === '1hour';
      const isValidWedgeCategory = instrumentCategory === 'crypto';
      
      if (!isValidWedgeCategory || !isValidWedgeTimeframe) {
        console.log(`[WEDGE GUARD] Rejected non-wedge request: category=${instrumentCategory}, timeframe=${timeframe}`);
        return new Response(JSON.stringify({ 
          error: 'In crypto wedge mode, only crypto instruments with 1H timeframe are allowed.',
          wedgeViolation: true,
          received: { instrumentCategory, timeframe }
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.log(`[WEDGE GUARD] Passed: crypto + 1h`);
    }
    
    // ============================================
    // USAGE LIMIT CHECK
    // ============================================
    if (userId) {
      const { data: limitCheck } = await supabase.rpc('check_backtest_limit', { p_user_id: userId });
      if (limitCheck && !limitCheck.allowed) {
        console.log(`User ${userId} exceeded daily limit: ${limitCheck.current_usage}/${limitCheck.max_daily_runs}`);
        return new Response(JSON.stringify({ 
          error: `Daily backtest limit reached (${limitCheck.max_daily_runs}/day). Upgrade your plan for more.`,
          limitExceeded: true,
          usage: limitCheck
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ============================================
    // RESULT CACHE CHECK
    // ============================================
    const cacheKey = generateCacheKey(strategy);
    console.log(`Cache key: ${cacheKey}`);

    const { data: cachedResult } = await supabase
      .from('backtest_result_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedResult) {
      console.log(`✅ CACHE HIT for ${cacheKey} - returning cached result`);
      
      // Increment hit count in background
      supabase
        .from('backtest_result_cache')
        .update({ hit_count: cachedResult.hit_count + 1 })
        .eq('id', cachedResult.id)
        .then(() => {});

      // Still increment usage for the user
      if (userId) {
        await supabase.rpc('increment_backtester_v2_usage', { p_user_id: userId });
      }

      return new Response(JSON.stringify({
        success: true,
        cached: true,
        results: cachedResult.results,
        trades: cachedResult.trades,
        dataPoints: cachedResult.data_points
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`❌ CACHE MISS for ${cacheKey} - running backtest`);

    // Get discipline filters from strategy or use defaults
    const disciplineFilters: DisciplineFilters = strategy.disciplineFilters || DEFAULT_DISCIPLINE_FILTERS;
    
    console.log('Starting backtest with discipline filters:', {
      instrument,
      instrumentCategory,
      startDate,
      endDate,
      timeframe,
      patterns: strategy.patterns?.filter((p: any) => p.enabled).map((p: any) => p.name),
      filtersEnabled: Object.entries(disciplineFilters)
        .filter(([k, v]) => k.includes('Enabled') && v === true)
        .map(([k]) => k.replace('Enabled', ''))
    });

    if (!instrument) {
      throw new Error('Instrument is required');
    }
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }

    const historicalData = await fetchHistoricalData(
      instrument,
      instrumentCategory,
      startDate,
      endDate,
      timeframe
    );

    if (!historicalData || historicalData.length === 0) {
      throw new Error('No historical data available for the selected period');
    }

    console.log(`Fetched ${historicalData.length} data points for backtesting`);

    // CRITICAL: Limit data points to prevent CPU timeout (edge functions have ~50s limit)
    const MAX_DATA_POINTS = 3000;
    let processedData = historicalData;
    if (historicalData.length > MAX_DATA_POINTS) {
      console.log(`⚠️ Data too large (${historicalData.length}), trimming to last ${MAX_DATA_POINTS} points`);
      processedData = historicalData.slice(-MAX_DATA_POINTS);
    }

    const patternSignals = detectPatternsInData(
      processedData,
      strategy.patterns?.filter((p: any) => p.enabled) || [],
      strategy
    );

    console.log(`Detected ${patternSignals.length} raw pattern signals`);

    // Apply discipline filters and simulate trades (with regime analytics)
    const runId = generateUUID();
    const { trades, tradeLedger, disciplineStats } = simulateTradesWithDiscipline(
      processedData,
      patternSignals,
      strategy,
      disciplineFilters,
      runId,
      instrument,
      timeframe
    );

    console.log(`After discipline filtering: ${trades.length} trades from ${patternSignals.length} signals`);
    console.log(`Rejection rate: ${disciplineStats.rejectionRate.toFixed(1)}%`);

    const performanceMetrics = calculateMetrics(trades, strategy);

    console.log('Backtest complete:', {
      totalTrades: trades.length,
      rawSignals: patternSignals.length,
      rejectedTrades: disciplineStats.rejectedTrades,
      winRate: performanceMetrics.winRate,
      totalReturn: performanceMetrics.totalReturn
    });

    // ============================================
    // REGIME-CONDITIONED ANALYTICS
    // ============================================
    const regimeAnalytics = computeRegimeAnalytics(tradeLedger);

    // ============================================
    // CACHE THE RESULT
    // ============================================
    const resultToCache = {
      ...performanceMetrics,
      rawSignals: patternSignals.length,
      disciplineStats,
      regimeAnalytics: regimeAnalytics.summary
    };

    // Cache in background (don't await)
    supabase
      .from('backtest_result_cache')
      .upsert({
        cache_key: cacheKey,
        parameters_hash: cacheKey,
        instrument,
        timeframe,
        results: resultToCache,
        trades: trades.slice(0, 100), // Limit trades stored to save space
        data_points: historicalData.length,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }, { onConflict: 'cache_key' })
      .then(({ error }) => {
        if (error) console.error('Cache insert error:', error);
        else console.log(`✅ Cached result for ${cacheKey}`);
      });

    // Increment usage for user
    if (userId) {
      await supabase.rpc('increment_backtester_v2_usage', { p_user_id: userId });
    }

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      runId,
      results: resultToCache,
      trades,
      tradeLedger: tradeLedger.slice(0, 500), // Limit for payload size
      dataPoints: historicalData.length,
      disciplineStats,
      regimeAnalytics
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Backtest error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to complete backtest'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================
// DATA FETCHING
// ============================================

async function fetchHistoricalData(
  symbol: string,
  category: string,
  startDate: string,
  endDate: string,
  timeframe: string
): Promise<any[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: cachedData, error: cacheError } = await supabase
    .from('historical_prices')
    .select('*')
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (!cacheError && cachedData && cachedData.length > 0) {
    console.log(`✅ Cache HIT: ${symbol} ${timeframe} (${cachedData.length} records)`);
    return cachedData.map((row: any) => ({
      timestamp: new Date(row.date).getTime(),
      date: row.date,
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      volume: row.volume ? parseInt(row.volume) : 0
    }));
  }

  console.log(`❌ Cache MISS: Fetching ${symbol} from Yahoo Finance...`);

  const intervalMap: Record<string, string> = {
    '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1wk',
  };
  const interval = intervalMap[timeframe] || '1d';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const limits: Record<string, number> = {
    '1m': 7, '5m': 60, '15m': 60, '1h': 730, '4h': 730, '1d': 36500, '1wk': 36500
  };
  
  const maxDays = limits[interval] || 730;
  if (daysDiff > maxDays) {
    throw new Error(`Date range too large for ${interval} timeframe. Maximum ${maxDays} days allowed, got ${daysDiff} days.`);
  }
  
  const period1 = Math.floor(start.getTime() / 1000);
  const period2 = Math.floor(end.getTime() / 1000);

  let yahooSymbol = symbol;
  if (category === 'forex') {
    yahooSymbol = symbol.replace('/', '') + '=X';
  } else if (category === 'crypto') {
    // Transform crypto symbols to Yahoo Finance format (e.g., BTCUSDT -> BTC-USD, ETHUSDT -> ETH-USD)
    // Handle various input formats: BTCUSDT, BTC/USD, BTC, BTC-USD
    if (symbol.endsWith('USDT')) {
      yahooSymbol = symbol.replace('USDT', '-USD');
    } else if (symbol.includes('/')) {
      yahooSymbol = symbol.replace('/', '-');
    } else if (!symbol.includes('-') && !symbol.includes('USD')) {
      // Bare symbol like BTC -> BTC-USD
      yahooSymbol = `${symbol}-USD`;
    }
    // If already in correct format (BTC-USD), leave as is
  }

  console.log(`[SYMBOL TRANSFORM] Original: ${symbol}, Yahoo: ${yahooSymbol}, Category: ${category}`);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=${interval}`;
  console.log(`Fetching Yahoo Finance: ${url}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Yahoo Finance error ${response.status}:`, errorText);
    throw new Error(`Yahoo Finance API error: ${response.status}. Symbol: ${yahooSymbol}`);
  }

  const data = await response.json();
  
  if (!data.chart?.result?.[0]) {
    throw new Error('No data returned from Yahoo Finance');
  }

  const result = data.chart.result[0];
  const timestamps = result.timestamp || [];
  const quotes = result.indicators.quote[0];
  
  const historicalData = timestamps.map((timestamp: number, index: number) => ({
    timestamp: timestamp * 1000,
    date: new Date(timestamp * 1000).toISOString(),
    open: quotes.open[index],
    high: quotes.high[index],
    low: quotes.low[index],
    close: quotes.close[index],
    volume: quotes.volume[index]
  })).filter((bar: any) => 
    bar.open !== null && bar.high !== null && bar.low !== null && bar.close !== null
  );

  if (historicalData.length > 0) {
    const cacheRecords = historicalData.map((d: any) => ({
      symbol,
      instrument_type: category,
      timeframe,
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume
    }));

    const { error: insertError } = await supabase
      .from('historical_prices')
      .upsert(cacheRecords, { onConflict: 'symbol,timeframe,date', ignoreDuplicates: true });

    if (!insertError) {
      console.log(`✅ Cached ${cacheRecords.length} records for ${symbol}`);
    }
  }

  return historicalData;
}

// ============================================
// PATTERN DETECTION
// ============================================

function detectPatternsInData(data: any[], patterns: any[], strategy: any): any[] {
  const signals: any[] = [];
  
  // Use sensible defaults if strategy values are 0 or missing
  const globalTarget = (strategy.targetGainPercent && strategy.targetGainPercent > 0) 
    ? strategy.targetGainPercent 
    : 2; // Default 2% target
  const globalStopLoss = (strategy.stopLossPercent && strategy.stopLossPercent > 0) 
    ? strategy.stopLossPercent 
    : 1; // Default 1% stop loss
  
  console.log('Pattern detection - Strategy settings:', {
    targetGainPercent: strategy.targetGainPercent,
    stopLossPercent: strategy.stopLossPercent,
    effectiveTarget: globalTarget,
    effectiveStopLoss: globalStopLoss,
    patterns: patterns.map(p => ({ id: p.id, enabled: p.enabled, customTarget: p.customTarget, customStopLoss: p.customStopLoss }))
  });
  
  // Build pattern settings map
  const patternSettings = new Map<string, { target: number; stopLoss: number }>();
  for (const pattern of patterns) {
    if (pattern.enabled) {
      // Use pattern-specific settings if defined and > 0, otherwise use global defaults
      const target = (pattern.customTarget && pattern.customTarget > 0) ? pattern.customTarget : globalTarget;
      const stopLoss = (pattern.customStopLoss && pattern.customStopLoss > 0) ? pattern.customStopLoss : globalStopLoss;
      patternSettings.set(pattern.id, { target, stopLoss });
      patternSettings.set(pattern.name, { target, stopLoss });
      patternSettings.set(pattern.patternType, { target, stopLoss });
      console.log(`Pattern ${pattern.name} (${pattern.id}): target=${target}%, stopLoss=${stopLoss}%`);
    }
  }
  
  // Check patterns every bar for daily timeframe (252 bars/year is manageable)
  // Only optimize for intraday timeframes with lots of bars
  const STEP_SIZE = data.length > 1000 ? Math.max(1, Math.floor(data.length / 1000)) : 1;
  console.log(`Pattern detection step size: ${STEP_SIZE} (${Math.ceil(data.length / STEP_SIZE)} iterations for ${data.length} bars)`);

  for (const pattern of patterns) {
    if (!pattern.enabled) continue;
    
    const patternType = pattern.patternType || pattern.id;
    const windowSize = getPatternWindowSize(patternType);
    const settings = patternSettings.get(pattern.id) || patternSettings.get(patternType) || { target: globalTarget, stopLoss: globalStopLoss };
    
    let patternSignalCount = 0;
    for (let i = windowSize; i < data.length; i += STEP_SIZE) {
      const window = data.slice(i - windowSize, i + 1); // Include current bar
      const isPattern = checkPattern(patternType, window);
      
      if (isPattern) {
        patternSignalCount++;
        signals.push({
          patternId: pattern.id,
          patternName: pattern.name,
          patternType: patternType,
          index: i,
          timestamp: data[i].timestamp,
          entryPrice: data[i].close,
          targetPercent: settings.target,
          stopPercent: settings.stopLoss,
          confidence: 0.75
        });
      }
    }
    console.log(`Pattern ${pattern.name}: ${patternSignalCount} signals detected`);
  }
  
  console.log(`Generated ${signals.length} total signals with TP/SL: target=${globalTarget}%, stop=${globalStopLoss}%`);
  return signals;
}

function getPatternWindowSize(patternId: string): number {
  const sizeMap: Record<string, number> = {
    'head-shoulders': 30, 'inverted-head-shoulders': 30,
    'double-top': 20, 'double-bottom': 20,
    'triple-top': 25, 'triple-bottom': 25,
    'cup-handle': 40, 
    'ascending-triangle': 25, 'descending-triangle': 25, 'symmetrical-triangle': 25,
    'bull-flag': 15, 'bear-flag': 15,
    'rising-wedge': 20, 'falling-wedge': 20,
    'bullish-rectangle': 15, 'bearish-rectangle': 15,
    'rounding-bottom': 30, 'rounding-top': 30,
  };
  return sizeMap[patternId] || 20;
}

function checkPattern(patternId: string, window: any[]): boolean {
  if (window.length < 10) return false;
  
  const highs = window.map(d => d.high);
  const lows = window.map(d => d.low);
  const closes = window.map(d => d.close);
  
  // Normalize pattern ID - handle both underscore and hyphen formats
  const normalizedId = patternId.toLowerCase().replace(/_/g, '-');
  
  switch (normalizedId) {
    case 'head-shoulders': 
    case 'head-and-shoulders':
      return detectHeadAndShoulders(highs, lows);
    case 'inverted-head-shoulders': 
    case 'inverse-head-shoulders':
    case 'inverse-head-and-shoulders':
      return detectInvertedHeadAndShoulders(highs, lows);
    case 'double-top': return detectDoubleTop(highs);
    case 'double-bottom': return detectDoubleBottom(lows);
    case 'triple-top': return detectTripleTop(highs);
    case 'triple-bottom': return detectTripleBottom(lows);
    case 'ascending-triangle': return detectAscendingTriangle(highs, lows);
    case 'descending-triangle': return detectDescendingTriangle(highs, lows);
    case 'symmetrical-triangle': return detectSymmetricalTriangle(highs, lows);
    case 'cup-handle': 
    case 'cup-and-handle':
      return detectCupAndHandle(closes);
    case 'bull-flag': return detectBullFlag(highs, lows, closes);
    case 'bear-flag': return detectBearFlag(highs, lows, closes);
    case 'rising-wedge': return detectRisingWedge(highs, lows);
    case 'falling-wedge': return detectFallingWedge(highs, lows);
    case 'bullish-rectangle': return detectBullishRectangle(highs, lows, closes);
    case 'bearish-rectangle': return detectBearishRectangle(highs, lows, closes);
    case 'rounding-bottom': return detectRoundingBottom(lows);
    case 'rounding-top': return detectRoundingTop(highs);
    // Candlestick patterns
    case 'hammer': return detectHammer(window);
    case 'shooting-star': return detectShootingStar(window);
    case 'bullish-engulfing': return detectBullishEngulfing(window);
    case 'bearish-engulfing': return detectBearishEngulfing(window);
    case 'morning-star': return detectMorningStar(window);
    case 'evening-star': return detectEveningStar(window);
    case 'doji': return detectDoji(window);
    default: 
      console.log(`Unknown pattern: ${patternId} (normalized: ${normalizedId})`);
      return detectSimpleBreakout(highs, lows, closes);
  }
}

// Candlestick pattern detection functions
function detectHammer(window: any[]): boolean {
  if (window.length < 3) return false;
  const bar = window[window.length - 1];
  const prevBar = window[window.length - 2];
  const bodySize = Math.abs(bar.close - bar.open);
  const range = bar.high - bar.low;
  if (range === 0) return false;
  const lowerWick = Math.min(bar.open, bar.close) - bar.low;
  const upperWick = bar.high - Math.max(bar.open, bar.close);
  // Hammer: small body at top, long lower wick (2x body), tiny upper wick
  return bodySize / range < 0.35 && lowerWick > bodySize * 2 && upperWick < bodySize * 0.5 && prevBar.close > bar.close;
}

function detectShootingStar(window: any[]): boolean {
  if (window.length < 3) return false;
  const bar = window[window.length - 1];
  const prevBar = window[window.length - 2];
  const bodySize = Math.abs(bar.close - bar.open);
  const range = bar.high - bar.low;
  if (range === 0) return false;
  const lowerWick = Math.min(bar.open, bar.close) - bar.low;
  const upperWick = bar.high - Math.max(bar.open, bar.close);
  // Shooting star: small body at bottom, long upper wick (2x body), tiny lower wick
  return bodySize / range < 0.35 && upperWick > bodySize * 2 && lowerWick < bodySize * 0.5 && prevBar.close < bar.close;
}

function detectBullishEngulfing(window: any[]): boolean {
  if (window.length < 2) return false;
  const curr = window[window.length - 1];
  const prev = window[window.length - 2];
  // Previous bar bearish, current bar bullish and engulfs previous
  return prev.close < prev.open && curr.close > curr.open && 
         curr.open < prev.close && curr.close > prev.open;
}

function detectBearishEngulfing(window: any[]): boolean {
  if (window.length < 2) return false;
  const curr = window[window.length - 1];
  const prev = window[window.length - 2];
  // Previous bar bullish, current bar bearish and engulfs previous
  return prev.close > prev.open && curr.close < curr.open && 
         curr.open > prev.close && curr.close < prev.open;
}

function detectMorningStar(window: any[]): boolean {
  if (window.length < 3) return false;
  const first = window[window.length - 3];
  const star = window[window.length - 2];
  const third = window[window.length - 1];
  const starBody = Math.abs(star.close - star.open);
  const starRange = star.high - star.low;
  // First: bearish, Star: small body with gap down, Third: bullish closing above first's midpoint
  return first.close < first.open && 
         starBody < starRange * 0.3 &&
         third.close > third.open && 
         third.close > (first.open + first.close) / 2;
}

function detectEveningStar(window: any[]): boolean {
  if (window.length < 3) return false;
  const first = window[window.length - 3];
  const star = window[window.length - 2];
  const third = window[window.length - 1];
  const starBody = Math.abs(star.close - star.open);
  const starRange = star.high - star.low;
  // First: bullish, Star: small body with gap up, Third: bearish closing below first's midpoint
  return first.close > first.open && 
         starBody < starRange * 0.3 &&
         third.close < third.open && 
         third.close < (first.open + first.close) / 2;
}

function detectDoji(window: any[]): boolean {
  if (window.length < 1) return false;
  const bar = window[window.length - 1];
  const bodySize = Math.abs(bar.close - bar.open);
  const range = bar.high - bar.low;
  if (range === 0) return false;
  // Doji: very small body relative to range
  return bodySize / range < 0.1;
}

function detectHeadAndShoulders(highs: number[], lows: number[]): boolean {
  if (highs.length < 20) return false;
  const peaks = findPeaks(highs);
  if (peaks.length < 3) return false;
  const lastThreePeaks = peaks.slice(-3);
  if (lastThreePeaks.length === 3) {
    const [left, head, right] = lastThreePeaks.map(i => highs[i]);
    return head > left && head > right && Math.abs(left - right) / left < 0.05;
  }
  return false;
}

function detectDoubleTop(highs: number[]): boolean {
  const peaks = findPeaks(highs);
  if (peaks.length < 2) return false;
  const lastTwoPeaks = peaks.slice(-2).map(i => highs[i]);
  return Math.abs(lastTwoPeaks[0] - lastTwoPeaks[1]) / lastTwoPeaks[0] < 0.02;
}

function detectDoubleBottom(lows: number[]): boolean {
  const troughs = findTroughs(lows);
  if (troughs.length < 2) return false;
  const lastTwoTroughs = troughs.slice(-2).map(i => lows[i]);
  return Math.abs(lastTwoTroughs[0] - lastTwoTroughs[1]) / lastTwoTroughs[0] < 0.02;
}

function detectAscendingTriangle(highs: number[], lows: number[]): boolean {
  if (lows.length < 15) return false;
  const recentLows = lows.slice(-15);
  const trend = calculateTrend(recentLows);
  const highVolatility = Math.max(...highs.slice(-15)) / Math.min(...highs.slice(-15));
  return trend > 0 && highVolatility < 1.05;
}

function detectCupAndHandle(closes: number[]): boolean {
  if (closes.length < 30) return false;
  const cupBottom = Math.min(...closes.slice(10, 20));
  const cupRims = [closes[0], closes[29]];
  return cupBottom < Math.min(...cupRims) * 0.95;
}

// Additional pattern detection functions
function detectInvertedHeadAndShoulders(highs: number[], lows: number[]): boolean {
  if (lows.length < 20) return false;
  const troughs = findTroughs(lows);
  if (troughs.length < 3) return false;
  const lastThreeTroughs = troughs.slice(-3);
  if (lastThreeTroughs.length === 3) {
    const [left, head, right] = lastThreeTroughs.map(i => lows[i]);
    return head < left && head < right && Math.abs(left - right) / left < 0.05;
  }
  return false;
}

function detectTripleTop(highs: number[]): boolean {
  const peaks = findPeaks(highs);
  if (peaks.length < 3) return false;
  const lastThreePeaks = peaks.slice(-3).map(i => highs[i]);
  const avg = lastThreePeaks.reduce((a, b) => a + b, 0) / 3;
  return lastThreePeaks.every(p => Math.abs(p - avg) / avg < 0.03);
}

function detectTripleBottom(lows: number[]): boolean {
  const troughs = findTroughs(lows);
  if (troughs.length < 3) return false;
  const lastThreeTroughs = troughs.slice(-3).map(i => lows[i]);
  const avg = lastThreeTroughs.reduce((a, b) => a + b, 0) / 3;
  return lastThreeTroughs.every(t => Math.abs(t - avg) / avg < 0.03);
}

function detectDescendingTriangle(highs: number[], lows: number[]): boolean {
  if (highs.length < 15) return false;
  const recentHighs = highs.slice(-15);
  const recentLows = lows.slice(-15);
  const highTrend = calculateTrend(recentHighs);
  const lowFlatness = Math.max(...recentLows) / Math.min(...recentLows);
  return highTrend < -0.01 && lowFlatness < 1.03;
}

function detectSymmetricalTriangle(highs: number[], lows: number[]): boolean {
  if (highs.length < 15) return false;
  const recentHighs = highs.slice(-15);
  const recentLows = lows.slice(-15);
  const highTrend = calculateTrend(recentHighs);
  const lowTrend = calculateTrend(recentLows);
  return highTrend < -0.005 && lowTrend > 0.005;
}

function detectBullFlag(highs: number[], lows: number[], closes: number[]): boolean {
  if (closes.length < 15) return false;
  // Strong uptrend in first half, consolidation in second half
  const firstHalf = closes.slice(0, 7);
  const secondHalf = closes.slice(7);
  const firstTrend = calculateTrend(firstHalf);
  const secondRange = (Math.max(...secondHalf) - Math.min(...secondHalf)) / Math.min(...secondHalf);
  return firstTrend > 0.03 && secondRange < 0.05;
}

function detectBearFlag(highs: number[], lows: number[], closes: number[]): boolean {
  if (closes.length < 15) return false;
  // Strong downtrend in first half, consolidation in second half
  const firstHalf = closes.slice(0, 7);
  const secondHalf = closes.slice(7);
  const firstTrend = calculateTrend(firstHalf);
  const secondRange = (Math.max(...secondHalf) - Math.min(...secondHalf)) / Math.min(...secondHalf);
  return firstTrend < -0.03 && secondRange < 0.05;
}

function detectRisingWedge(highs: number[], lows: number[]): boolean {
  if (highs.length < 15) return false;
  const highTrend = calculateTrend(highs.slice(-15));
  const lowTrend = calculateTrend(lows.slice(-15));
  // Both rising, but lows rising faster (converging)
  return highTrend > 0.01 && lowTrend > 0.01 && lowTrend > highTrend;
}

function detectFallingWedge(highs: number[], lows: number[]): boolean {
  if (highs.length < 15) return false;
  const highTrend = calculateTrend(highs.slice(-15));
  const lowTrend = calculateTrend(lows.slice(-15));
  // Both falling, but highs falling faster (converging)
  return highTrend < -0.01 && lowTrend < -0.01 && highTrend < lowTrend;
}

function detectBullishRectangle(highs: number[], lows: number[], closes: number[]): boolean {
  if (closes.length < 15) return false;
  const range = (Math.max(...highs) - Math.min(...lows)) / Math.min(...lows);
  const trend = calculateTrend(closes);
  return range < 0.05 && trend > 0;
}

function detectBearishRectangle(highs: number[], lows: number[], closes: number[]): boolean {
  if (closes.length < 15) return false;
  const range = (Math.max(...highs) - Math.min(...lows)) / Math.min(...lows);
  const trend = calculateTrend(closes);
  return range < 0.05 && trend < 0;
}

function detectRoundingBottom(lows: number[]): boolean {
  if (lows.length < 20) return false;
  const mid = Math.floor(lows.length / 2);
  const firstHalf = lows.slice(0, mid);
  const secondHalf = lows.slice(mid);
  const firstTrend = calculateTrend(firstHalf);
  const secondTrend = calculateTrend(secondHalf);
  return firstTrend < -0.02 && secondTrend > 0.02;
}

function detectRoundingTop(highs: number[]): boolean {
  if (highs.length < 20) return false;
  const mid = Math.floor(highs.length / 2);
  const firstHalf = highs.slice(0, mid);
  const secondHalf = highs.slice(mid);
  const firstTrend = calculateTrend(firstHalf);
  const secondTrend = calculateTrend(secondHalf);
  return firstTrend > 0.02 && secondTrend < -0.02;
}

function detectSimpleBreakout(highs: number[], lows: number[], closes: number[]): boolean {
  if (closes.length < 10) return false;
  const recentHigh = Math.max(...highs.slice(-10, -1));
  const recentLow = Math.min(...lows.slice(-10, -1));
  const currentClose = closes[closes.length - 1];
  // Breakout above recent high or below recent low
  return currentClose > recentHigh * 1.01 || currentClose < recentLow * 0.99;
}

function findPeaks(data: number[]): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1]) peaks.push(i);
  }
  return peaks;
}

function findTroughs(data: number[]): number[] {
  const troughs: number[] = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] < data[i - 1] && data[i] < data[i + 1]) troughs.push(i);
  }
  return troughs;
}

function calculateTrend(data: number[]): number {
  if (data.length < 2) return 0;
  return (data[data.length - 1] - data[0]) / data[0];
}

// ============================================
// TRADE SIMULATION WITH DISCIPLINE + LEDGER
// ============================================

interface SimulationResult {
  trades: any[];
  tradeLedger: TradeLedgerEntry[];
  disciplineStats: DisciplineStats;
}

function simulateTradesWithDiscipline(
  data: any[],
  signals: any[],
  strategy: any,
  filters: DisciplineFilters,
  runId: string = generateUUID(),
  symbol: string = 'UNKNOWN',
  timeframe: string = '1D'
): SimulationResult {
  const trades: any[] = [];
  const tradeLedger: TradeLedgerEntry[] = [];
  const openPositions: any[] = [];
  let balance = 10000;
  let lastTradeExitBar: number | null = null;
  const activePatternTypes = new Set<string>();
  
  const disciplineStats: DisciplineStats = {
    totalSignals: signals.length,
    allowedTrades: 0,
    rejectedTrades: 0,
    rejectionRate: 0,
    rejectionsByFilter: {}
  };

  for (const signal of signals) {
    const entryIndex = signal.index;
    if (entryIndex >= data.length - 1) continue;
    
    // Validate against discipline filters
    const validation = validateTradeDiscipline(
      signal,
      data,
      openPositions,
      filters,
      lastTradeExitBar,
      activePatternTypes,
      disciplineStats
    );
    
    if (!validation.allowed) {
      disciplineStats.rejectedTrades++;
      console.log(`Signal rejected at bar ${entryIndex}: ${validation.rejectionReasons.join(', ')}`);
      continue;
    }
    
    disciplineStats.allowedTrades++;
    
    const entryPrice = data[entryIndex].close;
    const positionSize = balance * (strategy.positionSizing?.riskPerTrade || 2) / 100;
    const targetPercent = signal.targetPercent || 3;
    const stopPercent = signal.stopPercent || 1.5;
    
    // Calculate absolute stop and target prices
    const isBullishPattern = ['double-bottom', 'ascending-triangle', 'cup-handle', 'bull-flag']
      .some(p => signal.patternId?.includes(p) || signal.patternName?.toLowerCase().includes(p));
    const patternDirection: 'long' | 'short' = isBullishPattern ? 'long' : 'short';
    
    const stopLossPrice = patternDirection === 'long' 
      ? entryPrice * (1 - stopPercent / 100)
      : entryPrice * (1 + stopPercent / 100);
    const takeProfitPrice = patternDirection === 'long'
      ? entryPrice * (1 + targetPercent / 100)
      : entryPrice * (1 - targetPercent / 100);
    
    // Risk and reward in absolute terms
    const riskAmount = Math.abs(entryPrice - stopLossPrice);
    const rewardPotential = Math.abs(takeProfitPrice - entryPrice);
    const plannedRR = riskAmount > 0 ? rewardPotential / riskAmount : 0;
    
    // Compute regime at entry (bar-close semantics - no lookahead)
    const regimeAtEntry = computeRegimeLabelAtBar(data, entryIndex);
    
    // Add to tracking
    activePatternTypes.add(signal.patternId);
    openPositions.push({ patternId: signal.patternId, entryIndex });
    
    let exitIndex = entryIndex + 1;
    let exitPrice = data[exitIndex].close;
    let exitReason: 'target' | 'stop-loss' | 'timeout' = 'timeout';
    
    // Track MFE (Max Favorable Excursion) and MAE (Max Adverse Excursion)
    let mfe = 0; // Best unrealized profit
    let mae = 0; // Worst unrealized loss
    
    // Calculate max bars to hold based on timeframe (fewer bars for intraday)
    const maxHoldingBars = Math.min(100, data.length - entryIndex - 1);
    
    console.log(`Trade entry at bar ${entryIndex}: price=${entryPrice}, target=${targetPercent}%, stop=${stopPercent}%`);
    
    for (let i = entryIndex + 1; i < entryIndex + maxHoldingBars; i++) {
      if (i >= data.length) break;
      
      const bar = data[i];
      
      // Track excursions using high/low for intrabar movement
      const highExcursion = patternDirection === 'long' 
        ? (bar.high - entryPrice) / entryPrice * 100
        : (entryPrice - bar.low) / entryPrice * 100;
      const lowExcursion = patternDirection === 'long'
        ? (bar.low - entryPrice) / entryPrice * 100
        : (entryPrice - bar.high) / entryPrice * 100;
      
      mfe = Math.max(mfe, highExcursion);
      mae = Math.min(mae, lowExcursion);
      
      const currentPrice = bar.close;
      const priceChange = patternDirection === 'long'
        ? (currentPrice - entryPrice) / entryPrice * 100
        : (entryPrice - currentPrice) / entryPrice * 100;
      
      // Check stop loss first (adverse move exceeds stop threshold)
      if (priceChange <= -stopPercent) {
        exitIndex = i;
        exitPrice = currentPrice;
        exitReason = 'stop-loss';
        console.log(`Stop-loss hit at bar ${i}: change=${priceChange.toFixed(3)}%`);
        break;
      }
      
      // Check target (favorable move exceeds target threshold)
      if (priceChange >= targetPercent) {
        exitIndex = i;
        exitPrice = currentPrice;
        exitReason = 'target';
        console.log(`Target hit at bar ${i}: change=${priceChange.toFixed(3)}%`);
        break;
      }
    }
    
    if (exitReason === 'timeout') {
      exitIndex = Math.min(entryIndex + maxHoldingBars - 1, data.length - 1);
      exitPrice = data[exitIndex].close;
      const finalChange = ((exitPrice - entryPrice) / entryPrice * 100).toFixed(3);
      console.log(`Timeout exit at bar ${exitIndex}: final change=${finalChange}%`);
    }
    
    // Update tracking
    lastTradeExitBar = exitIndex;
    const posIndex = openPositions.findIndex(p => p.entryIndex === entryIndex);
    if (posIndex >= 0) openPositions.splice(posIndex, 1);
    
    // Calculate PnL
    const pnlPercent = patternDirection === 'long'
      ? ((exitPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - exitPrice) / entryPrice) * 100;
    const pnlAbsolute = (pnlPercent / 100) * positionSize;
    const actualRMultiple = riskAmount > 0 ? (pnlPercent / 100 * entryPrice) / riskAmount : 0;
    const mfeRMultiple = riskAmount > 0 ? (mfe / 100 * entryPrice) / riskAmount : 0;
    const maeRMultiple = riskAmount > 0 ? (mae / 100 * entryPrice) / riskAmount : 0;
    
    balance += pnlAbsolute;
    
    // Legacy trade format (for backward compatibility)
    trades.push({
      patternName: signal.patternName,
      entryDate: data[entryIndex].date,
      entryPrice,
      exitDate: data[exitIndex].date,
      exitPrice,
      exitReason,
      pnl: pnlAbsolute,
      pnlPercent,
      holdingBars: exitIndex - entryIndex,
      targetPercent,
      stopPercent,
      disciplineApproved: true,
      regimeAtEntry: regimeAtEntry.key,
      actualRMultiple,
      mfe,
      mae
    });
    
    // Full TradeLedgerEntry (research-grade)
    tradeLedger.push({
      id: generateUUID(),
      runId,
      strategyId: strategy.id,
      symbol,
      timeframe,
      patternId: signal.patternId || 'unknown',
      patternName: signal.patternName,
      patternDirection,
      entryTime: data[entryIndex].date,
      exitTime: data[exitIndex].date,
      entryBarIndex: entryIndex,
      exitBarIndex: exitIndex,
      holdingBars: exitIndex - entryIndex,
      entryPrice,
      exitPrice,
      stopLossPrice,
      takeProfitPrice,
      riskAmount,
      rewardPotential,
      plannedRR,
      actualRMultiple,
      mfe,
      mae,
      mfeRMultiple,
      maeRMultiple,
      exitReason,
      pnlPercent,
      pnlAbsolute,
      isWin: pnlPercent > 0,
      regimeAtEntry,
      disciplineValidation: {
        passed: true,
        filtersApplied: Object.keys(filters).filter(k => (filters as any)[k] === true),
        rejectionReasons: []
      },
      createdAt: new Date().toISOString()
    });
  }
  
  disciplineStats.rejectionRate = disciplineStats.totalSignals > 0
    ? (disciplineStats.rejectedTrades / disciplineStats.totalSignals) * 100
    : 0;

  return { trades, tradeLedger, disciplineStats };
}

// ============================================
// METRICS CALCULATION
// ============================================

function calculateMetrics(trades: any[], strategy: any): any {
  if (trades.length === 0) {
    return {
      totalReturn: 0, totalTrades: 0, winRate: 0, profitFactor: 0,
      maxDrawdown: 0, avgWin: 0, avgLoss: 0, sharpeRatio: 0
    };
  }
  
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);
  
  // Calculate total return as sum of pnlPercent (each trade's % return)
  const totalReturnPercent = trades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0);
  
  // Also track dollar PnL for reference
  const totalPnlDollars = trades.reduce((sum, t) => sum + t.pnl, 0);
  const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  // Average win/loss as percentages for clearer interpretation
  const avgWinPercent = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0) / winningTrades.length 
    : 0;
  const avgLossPercent = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnlPercent || 0), 0)) / losingTrades.length 
    : 0;
  
  // Calculate max drawdown based on cumulative returns
  let peak = 0;
  let maxDrawdown = 0;
  let cumulativeReturn = 0;
  
  for (const trade of trades) {
    cumulativeReturn += (trade.pnlPercent || 0);
    if (cumulativeReturn > peak) peak = cumulativeReturn;
    const drawdown = peak - cumulativeReturn;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  // Calculate Sharpe Ratio (simplified: avg return / std dev of returns)
  const returns = trades.map(t => t.pnlPercent || 0);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  
  return {
    totalReturn: Number(totalReturnPercent.toFixed(2)),
    totalPnlDollars: Number(totalPnlDollars.toFixed(2)),
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Number(((winningTrades.length / trades.length) * 100).toFixed(2)),
    profitFactor: totalLoss > 0 ? Number((totalProfit / totalLoss).toFixed(2)) : (totalProfit > 0 ? Infinity : 0),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    avgWin: Number(avgWinPercent.toFixed(2)),
    avgLoss: Number(avgLossPercent.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    avgHoldingPeriod: Number((trades.reduce((sum, t) => sum + t.holdingBars, 0) / trades.length).toFixed(1)),
    patternBreakdown: getPatternBreakdown(trades)
  };
}

function getPatternBreakdown(trades: any[]): any {
  const breakdown: Record<string, any> = {};
  for (const trade of trades) {
    if (!breakdown[trade.patternName]) {
      breakdown[trade.patternName] = { trades: 0, wins: 0, totalPnl: 0 };
    }
    breakdown[trade.patternName].trades++;
    if (trade.pnl > 0) breakdown[trade.patternName].wins++;
    breakdown[trade.patternName].totalPnl += trade.pnl;
  }
  return breakdown;
}

// ============================================
// REGIME-CONDITIONED ANALYTICS ENGINE
// ============================================

interface RegimeBucketStats {
  regimeKey: string;
  n: number;
  winRate: number;
  avgRMultiple: number;
  medianRMultiple: number;
  stdDevRMultiple: number;
  avgMAE: number;
  avgMFE: number;
}

interface RegimeAnalyticsResult {
  summary: {
    totalTrades: number;
    regimeCoverage: Record<string, number>;
    baselineAvgR: number;
    baselineWinRate: number;
  };
  byRegime: Record<string, RegimeBucketStats>;
  byPattern: Record<string, {
    patternId: string;
    baseline: RegimeBucketStats;
    regimes: Record<string, RegimeBucketStats>;
  }>;
}

function computeRegimeAnalytics(tradeLedger: TradeLedgerEntry[]): RegimeAnalyticsResult {
  if (tradeLedger.length === 0) {
    return {
      summary: {
        totalTrades: 0,
        regimeCoverage: {},
        baselineAvgR: 0,
        baselineWinRate: 0
      },
      byRegime: {},
      byPattern: {}
    };
  }

  // Compute baseline stats
  const allRMultiples = tradeLedger.map(t => t.actualRMultiple);
  const baselineAvgR = allRMultiples.reduce((a, b) => a + b, 0) / allRMultiples.length;
  const baselineWinRate = tradeLedger.filter(t => t.isWin).length / tradeLedger.length;

  // Group by regime
  const byRegime: Record<string, TradeLedgerEntry[]> = {};
  for (const trade of tradeLedger) {
    const key = trade.regimeAtEntry.key;
    if (!byRegime[key]) byRegime[key] = [];
    byRegime[key].push(trade);
  }

  // Compute regime bucket stats
  const regimeCoverage: Record<string, number> = {};
  const regimeStats: Record<string, RegimeBucketStats> = {};
  
  for (const [regimeKey, trades] of Object.entries(byRegime)) {
    regimeCoverage[regimeKey] = trades.length;
    regimeStats[regimeKey] = computeBucketStats(regimeKey, trades);
  }

  // Group by pattern
  const byPatternTrades: Record<string, TradeLedgerEntry[]> = {};
  for (const trade of tradeLedger) {
    const pid = trade.patternId;
    if (!byPatternTrades[pid]) byPatternTrades[pid] = [];
    byPatternTrades[pid].push(trade);
  }

  // Compute pattern-level analytics with regime conditioning
  const byPattern: Record<string, {
    patternId: string;
    baseline: RegimeBucketStats;
    regimes: Record<string, RegimeBucketStats>;
  }> = {};

  for (const [patternId, trades] of Object.entries(byPatternTrades)) {
    // Pattern baseline
    const patternBaseline = computeBucketStats(`${patternId}_baseline`, trades);
    
    // Pattern by regime
    const patternByRegime: Record<string, TradeLedgerEntry[]> = {};
    for (const trade of trades) {
      const key = trade.regimeAtEntry.key;
      if (!patternByRegime[key]) patternByRegime[key] = [];
      patternByRegime[key].push(trade);
    }
    
    const patternRegimeStats: Record<string, RegimeBucketStats> = {};
    for (const [regimeKey, regimeTrades] of Object.entries(patternByRegime)) {
      patternRegimeStats[regimeKey] = computeBucketStats(`${patternId}_${regimeKey}`, regimeTrades);
    }
    
    byPattern[patternId] = {
      patternId,
      baseline: patternBaseline,
      regimes: patternRegimeStats
    };
  }

  return {
    summary: {
      totalTrades: tradeLedger.length,
      regimeCoverage,
      baselineAvgR,
      baselineWinRate
    },
    byRegime: regimeStats,
    byPattern
  };
}

function computeBucketStats(bucketKey: string, trades: TradeLedgerEntry[]): RegimeBucketStats {
  if (trades.length === 0) {
    return {
      regimeKey: bucketKey,
      n: 0,
      winRate: 0,
      avgRMultiple: 0,
      medianRMultiple: 0,
      stdDevRMultiple: 0,
      avgMAE: 0,
      avgMFE: 0
    };
  }

  const rMultiples = trades.map(t => t.actualRMultiple);
  const n = trades.length;
  
  // Win rate
  const winRate = trades.filter(t => t.isWin).length / n;
  
  // Average R-multiple
  const avgRMultiple = rMultiples.reduce((a, b) => a + b, 0) / n;
  
  // Median R-multiple
  const sortedR = [...rMultiples].sort((a, b) => a - b);
  const medianRMultiple = n % 2 === 0
    ? (sortedR[n / 2 - 1] + sortedR[n / 2]) / 2
    : sortedR[Math.floor(n / 2)];
  
  // Standard deviation
  const variance = rMultiples.reduce((sum, r) => sum + Math.pow(r - avgRMultiple, 2), 0) / n;
  const stdDevRMultiple = Math.sqrt(variance);
  
  // Average MAE/MFE
  const avgMAE = trades.reduce((sum, t) => sum + t.mae, 0) / n;
  const avgMFE = trades.reduce((sum, t) => sum + t.mfe, 0) / n;

  return {
    regimeKey: bucketKey,
    n,
    winRate: Number(winRate.toFixed(4)),
    avgRMultiple: Number(avgRMultiple.toFixed(4)),
    medianRMultiple: Number(medianRMultiple.toFixed(4)),
    stdDevRMultiple: Number(stdDevRMultiple.toFixed(4)),
    avgMAE: Number(avgMAE.toFixed(4)),
    avgMFE: Number(avgMFE.toFixed(4))
  };
}
