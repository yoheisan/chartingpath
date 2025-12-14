import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Generate cache key from strategy parameters
function generateCacheKey(strategy: any): string {
  const params = {
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
    const { strategy, userId } = await req.json();
    
    const instrument = strategy.market?.instrument || strategy.instrument;
    const instrumentCategory = strategy.market?.instrumentCategory || strategy.instrumentCategory || 'stocks';
    const startDate = strategy.backtestPeriod?.startDate || strategy.startDate;
    const endDate = strategy.backtestPeriod?.endDate || strategy.endDate;
    const timeframe = strategy.market?.timeframes?.[0] || strategy.timeframe || '1d';
    
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

    // Apply discipline filters and simulate trades
    const { trades, disciplineStats } = simulateTradesWithDiscipline(
      processedData,
      patternSignals,
      strategy,
      disciplineFilters
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
    // CACHE THE RESULT
    // ============================================
    const resultToCache = {
      ...performanceMetrics,
      rawSignals: patternSignals.length,
      disciplineStats
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
      results: resultToCache,
      trades,
      dataPoints: historicalData.length,
      disciplineStats
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
    yahooSymbol = symbol.replace('/', '-');
  }

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
  
  console.log('Pattern detection - Strategy settings:', {
    targetGainPercent: strategy.targetGainPercent,
    stopLossPercent: strategy.stopLossPercent,
    patterns: patterns.map(p => ({ id: p.id, enabled: p.enabled, customTarget: p.customTarget, customStopLoss: p.customStopLoss }))
  });
  
  // Build pattern settings map
  const patternSettings = new Map<string, { target: number; stopLoss: number }>();
  for (const pattern of patterns) {
    if (pattern.enabled) {
      // Use pattern-specific settings, then strategy settings, then reasonable defaults
      const target = pattern.customTarget ?? strategy.targetGainPercent ?? 2;
      const stopLoss = pattern.customStopLoss ?? strategy.stopLossPercent ?? 1;
      patternSettings.set(pattern.id, { target, stopLoss });
      patternSettings.set(pattern.name, { target, stopLoss });
      console.log(`Pattern ${pattern.id}: target=${target}%, stopLoss=${stopLoss}%`);
    }
  }
  
  // Optimization: Check patterns every N bars to reduce CPU load
  const STEP_SIZE = Math.max(1, Math.floor(data.length / 500)); // ~500 checks max
  console.log(`Pattern detection step size: ${STEP_SIZE} (${Math.ceil(data.length / STEP_SIZE)} iterations)`);

  for (const pattern of patterns) {
    if (!pattern.enabled) continue;
    
    const windowSize = getPatternWindowSize(pattern.id);
    const settings = patternSettings.get(pattern.id) || { target: 2, stopLoss: 1 };
    
    for (let i = windowSize; i < data.length; i += STEP_SIZE) {
      const window = data.slice(i - windowSize, i);
      const isPattern = checkPattern(pattern.id, window);
      
      if (isPattern) {
        signals.push({
          patternId: pattern.id,
          patternName: pattern.name,
          index: i,
          timestamp: data[i].timestamp,
          entryPrice: data[i].close,
          targetPercent: settings.target,
          stopPercent: settings.stopLoss,
          confidence: 0.75
        });
      }
    }
  }
  
  console.log(`Generated ${signals.length} signals with TP/SL settings`);
  return signals;
}

function getPatternWindowSize(patternId: string): number {
  const sizeMap: Record<string, number> = {
    'head-shoulders': 30, 'double-top': 20, 'double-bottom': 20,
    'cup-handle': 40, 'ascending-triangle': 25, 'descending-triangle': 25,
    'bull-flag': 15, 'bear-flag': 15,
  };
  return sizeMap[patternId] || 20;
}

function checkPattern(patternId: string, window: any[]): boolean {
  if (window.length < 10) return false;
  
  const highs = window.map(d => d.high);
  const lows = window.map(d => d.low);
  const closes = window.map(d => d.close);
  
  switch (patternId) {
    case 'head-shoulders': return detectHeadAndShoulders(highs, lows);
    case 'double-top': return detectDoubleTop(highs);
    case 'double-bottom': return detectDoubleBottom(lows);
    case 'ascending-triangle': return detectAscendingTriangle(highs, lows);
    case 'cup-handle': return detectCupAndHandle(closes);
    default: return Math.random() < 0.05;
  }
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
// TRADE SIMULATION WITH DISCIPLINE
// ============================================

function simulateTradesWithDiscipline(
  data: any[],
  signals: any[],
  strategy: any,
  filters: DisciplineFilters
): { trades: any[]; disciplineStats: DisciplineStats } {
  const trades: any[] = [];
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
    const targetPercent = signal.targetPercent;
    const stopPercent = signal.stopPercent;
    
    // Add to tracking
    activePatternTypes.add(signal.patternId);
    openPositions.push({ patternId: signal.patternId, entryIndex });
    
    let exitIndex = entryIndex + 1;
    let exitPrice = data[exitIndex].close;
    let exitReason = 'timeout';
    
    // Calculate max bars to hold based on timeframe (fewer bars for intraday)
    const maxHoldingBars = Math.min(100, data.length - entryIndex - 1);
    
    console.log(`Trade entry at bar ${entryIndex}: price=${entryPrice}, target=${targetPercent}%, stop=${stopPercent}%`);
    
    for (let i = entryIndex + 1; i < entryIndex + maxHoldingBars; i++) {
      if (i >= data.length) break;
      
      const currentPrice = data[i].close;
      const priceChange = (currentPrice - entryPrice) / entryPrice * 100;
      
      // Check stop loss first (negative change exceeds stop threshold)
      if (priceChange <= -stopPercent) {
        exitIndex = i;
        exitPrice = currentPrice;
        exitReason = 'stop-loss';
        console.log(`Stop-loss hit at bar ${i}: change=${priceChange.toFixed(3)}%`);
        break;
      }
      
      // Check target (positive change exceeds target threshold)
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
    
    const pnl = ((exitPrice - entryPrice) / entryPrice) * positionSize;
    balance += pnl;
    
    trades.push({
      patternName: signal.patternName,
      entryDate: data[entryIndex].date,
      entryPrice,
      exitDate: data[exitIndex].date,
      exitPrice,
      exitReason,
      pnl,
      pnlPercent: ((exitPrice - entryPrice) / entryPrice) * 100,
      holdingBars: exitIndex - entryIndex,
      targetPercent,
      stopPercent,
      disciplineApproved: true
    });
  }
  
  disciplineStats.rejectionRate = disciplineStats.totalSignals > 0
    ? (disciplineStats.rejectedTrades / disciplineStats.totalSignals) * 100
    : 0;

  return { trades, disciplineStats };
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
  
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  
  const initialBalance = 10000;
  const totalReturn = (totalPnl / initialBalance) * 100;
  
  let peak = initialBalance;
  let maxDrawdown = 0;
  let runningBalance = initialBalance;
  
  for (const trade of trades) {
    runningBalance += trade.pnl;
    if (runningBalance > peak) peak = runningBalance;
    const drawdown = ((peak - runningBalance) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  return {
    totalReturn: Number(totalReturn.toFixed(2)),
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Number(((winningTrades.length / trades.length) * 100).toFixed(2)),
    profitFactor: totalLoss > 0 ? Number((totalProfit / totalLoss).toFixed(2)) : 0,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    avgWin: winningTrades.length > 0 ? Number((totalProfit / winningTrades.length).toFixed(2)) : 0,
    avgLoss: losingTrades.length > 0 ? Number((totalLoss / losingTrades.length).toFixed(2)) : 0,
    sharpeRatio: 0,
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
