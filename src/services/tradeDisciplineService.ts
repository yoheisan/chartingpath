/**
 * Trade Discipline Service
 * Professional-grade trade filtering logic (Bloomberg-level)
 * 
 * This service validates potential trades against discipline filters
 * before execution, preventing common trading mistakes.
 */

import { DisciplineFilters } from '@/components/chartingpath/TradeDisciplineFilters';

export interface PriceBar {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TradeSignal {
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: number;
  date: string;
  barIndex: number;
}

export interface OpenPosition {
  id: string;
  patternId: string;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  entryBar: number;
  entryDate: string;
}

export interface DisciplineValidation {
  allowed: boolean;
  rejectionReasons: string[];
  appliedFilters: string[];
  metrics: {
    trendDirection?: 'bullish' | 'bearish' | 'neutral';
    riskRewardRatio?: number;
    volumeRatio?: number;
    atrValue?: number;
    stopDistanceAtr?: number;
    concurrentTrades?: number;
    barsSinceLastTrade?: number;
    activePatterns?: number;
  };
}

export interface TrendAnalysis {
  direction: 'bullish' | 'bearish' | 'neutral';
  maValue: number;
  priceVsMa: number;
}

export interface VolatilityMetrics {
  atr: number;
  atrPercent: number;
}

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const slice = prices.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(bars: PriceBar[], period: number = 14): number {
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

/**
 * Calculate average volume over period
 */
export function calculateAverageVolume(bars: PriceBar[], period: number = 20): number {
  const volumeBars = bars.filter(b => b.volume != null && b.volume > 0);
  if (volumeBars.length === 0) return 0;
  
  const recentBars = volumeBars.slice(-period);
  return recentBars.reduce((sum, b) => sum + (b.volume || 0), 0) / recentBars.length;
}

/**
 * Analyze trend using moving average
 */
export function analyzeTrend(
  bars: PriceBar[], 
  indicator: 'ema50' | 'ema200' | 'sma50' | 'sma200'
): TrendAnalysis {
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
  
  // Trend is bullish if price is above MA, bearish if below
  // Use 0.5% threshold for neutral zone
  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (priceVsMa > 0.5) direction = 'bullish';
  else if (priceVsMa < -0.5) direction = 'bearish';
  
  return { direction, maValue, priceVsMa };
}

/**
 * Calculate risk/reward ratio
 */
export function calculateRiskReward(
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  direction: 'long' | 'short'
): number {
  let risk: number;
  let reward: number;
  
  if (direction === 'long') {
    risk = entryPrice - stopLoss;
    reward = takeProfit - entryPrice;
  } else {
    risk = stopLoss - entryPrice;
    reward = entryPrice - takeProfit;
  }
  
  if (risk <= 0) return 0;
  return reward / risk;
}

/**
 * Check if current time is in low-liquidity period
 * Based on forex market sessions
 */
export function isLowLiquidityPeriod(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const utcHour = d.getUTCHours();
  const utcDay = d.getUTCDay();
  
  // Weekend - markets closed
  if (utcDay === 0 || utcDay === 6) return true;
  
  // Sydney-Tokyo gap (21:00-23:00 UTC) - lower liquidity
  if (utcHour >= 21 && utcHour <= 23) return true;
  
  // Tokyo-London gap (05:00-07:00 UTC for non-summer) - moderate
  // This is a borderline case, being conservative
  if (utcHour >= 5 && utcHour <= 6) return true;
  
  // After NY close, before Tokyo open (21:00-00:00 UTC)
  if (utcHour >= 21) return true;
  
  return false;
}

/**
 * Check if time is near major news events
 * This is a simplified check - in production would use economic calendar API
 */
export function isNearNewsEvent(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const utcHour = d.getUTCHours();
  const utcMinutes = d.getUTCMinutes();
  const utcDay = d.getUTCDay();
  
  // Skip weekends
  if (utcDay === 0 || utcDay === 6) return false;
  
  // Major news typically released at:
  // - 08:30 UTC (US data)
  // - 12:30 UTC (US data)
  // - 13:00 UTC (US data)
  // - 14:00 UTC (FOMC, etc.)
  // - 07:00 UTC (European data)
  
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
    // Avoid trading 30 minutes before or after major news times
    if (minutesFromNews <= 30) return true;
  }
  
  return false;
}

/**
 * Count unique active patterns from open positions
 */
export function countActivePatterns(positions: OpenPosition[]): number {
  const uniquePatterns = new Set(positions.map(p => p.patternId));
  return uniquePatterns.size;
}

/**
 * Main Trade Discipline Validation Function
 * 
 * This is the core Bloomberg-level validation that checks all discipline filters
 * before allowing a trade to be taken.
 */
export function validateTradeDiscipline(
  signal: TradeSignal,
  historicalBars: PriceBar[],
  openPositions: OpenPosition[],
  filters: DisciplineFilters,
  lastTradeExitBar: number | null,
  activePatternCount: number
): DisciplineValidation {
  const rejectionReasons: string[] = [];
  const appliedFilters: string[] = [];
  const metrics: DisciplineValidation['metrics'] = {};
  
  const currentBar = historicalBars[historicalBars.length - 1];
  
  // 1. TREND ALIGNMENT FILTER
  if (filters.trendAlignmentEnabled) {
    appliedFilters.push('Trend Alignment');
    const trend = analyzeTrend(historicalBars, filters.trendIndicator);
    metrics.trendDirection = trend.direction;
    
    const isTrendAligned = 
      (signal.direction === 'long' && trend.direction === 'bullish') ||
      (signal.direction === 'short' && trend.direction === 'bearish');
    
    if (!isTrendAligned && trend.direction !== 'neutral') {
      rejectionReasons.push(
        `Trend not aligned: ${signal.direction.toUpperCase()} signal in ${trend.direction.toUpperCase()} trend (${filters.trendIndicator.toUpperCase()})`
      );
    }
  }
  
  // 2. MINIMUM RISK/REWARD FILTER
  if (filters.minRiskRewardEnabled) {
    appliedFilters.push('Min R:R Ratio');
    const rr = calculateRiskReward(
      signal.entryPrice,
      signal.stopLoss,
      signal.takeProfit,
      signal.direction
    );
    metrics.riskRewardRatio = parseFloat(rr.toFixed(2));
    
    if (rr < filters.minRiskReward) {
      rejectionReasons.push(
        `R:R too low: ${rr.toFixed(2)}:1 (minimum ${filters.minRiskReward}:1 required)`
      );
    }
  }
  
  // 3. VOLUME CONFIRMATION FILTER
  if (filters.volumeConfirmationEnabled && currentBar.volume != null) {
    appliedFilters.push('Volume Confirmation');
    const avgVolume = calculateAverageVolume(historicalBars, 20);
    const volumeRatio = currentBar.volume / avgVolume;
    metrics.volumeRatio = parseFloat(volumeRatio.toFixed(2));
    
    if (volumeRatio < filters.volumeMultiplier) {
      rejectionReasons.push(
        `Insufficient volume: ${volumeRatio.toFixed(2)}x average (minimum ${filters.volumeMultiplier}x required)`
      );
    }
  }
  
  // 4. PATTERN LIMIT FILTER
  if (filters.maxPatternsEnabled) {
    appliedFilters.push('Pattern Specialization');
    metrics.activePatterns = activePatternCount;
    
    // Check if adding this pattern would exceed the limit
    const existingPatterns = new Set(openPositions.map(p => p.patternId));
    if (!existingPatterns.has(signal.patternId)) {
      if (existingPatterns.size >= filters.maxPatterns) {
        rejectionReasons.push(
          `Pattern limit reached: ${existingPatterns.size}/${filters.maxPatterns} patterns active. Cannot add new pattern type.`
        );
      }
    }
  }
  
  // 5. MAX CONCURRENT TRADES FILTER
  if (filters.maxConcurrentTradesEnabled) {
    appliedFilters.push('Position Limits');
    metrics.concurrentTrades = openPositions.length;
    
    if (openPositions.length >= filters.maxConcurrentTrades) {
      rejectionReasons.push(
        `Max positions reached: ${openPositions.length}/${filters.maxConcurrentTrades} trades open`
      );
    }
  }
  
  // 6. TIME FILTERS
  if (filters.timeFilterEnabled) {
    appliedFilters.push('Time Filters');
    
    if (filters.avoidLowLiquidity && isLowLiquidityPeriod(signal.date)) {
      rejectionReasons.push('Low liquidity period detected - trade avoided');
    }
    
    if (filters.avoidNewsEvents && isNearNewsEvent(signal.date)) {
      rejectionReasons.push('Near major news event - trade avoided');
    }
  }
  
  // 7. ATR STOP VALIDATION FILTER
  if (filters.atrStopValidationEnabled) {
    appliedFilters.push('Volatility-Adjusted Stops');
    const atr = calculateATR(historicalBars, 14);
    metrics.atrValue = parseFloat(atr.toFixed(5));
    
    const stopDistance = Math.abs(signal.entryPrice - signal.stopLoss);
    const stopDistanceAtr = stopDistance / atr;
    metrics.stopDistanceAtr = parseFloat(stopDistanceAtr.toFixed(2));
    
    if (stopDistanceAtr < filters.minAtrMultiplier) {
      rejectionReasons.push(
        `Stop too tight: ${stopDistanceAtr.toFixed(2)} ATR (minimum ${filters.minAtrMultiplier} ATR required)`
      );
    }
  }
  
  // 8. COOLDOWN PERIOD FILTER
  if (filters.cooldownEnabled && lastTradeExitBar !== null) {
    appliedFilters.push('Trade Cooldown');
    const barsSinceLastTrade = signal.barIndex - lastTradeExitBar;
    metrics.barsSinceLastTrade = barsSinceLastTrade;
    
    if (barsSinceLastTrade < filters.cooldownBars) {
      rejectionReasons.push(
        `Cooldown active: ${barsSinceLastTrade}/${filters.cooldownBars} bars since last trade exit`
      );
    }
  }
  
  return {
    allowed: rejectionReasons.length === 0,
    rejectionReasons,
    appliedFilters,
    metrics
  };
}

/**
 * Summary statistics for discipline filter performance
 */
export interface DisciplineStats {
  totalSignals: number;
  allowedTrades: number;
  rejectedTrades: number;
  rejectionRate: number;
  rejectionsByFilter: Record<string, number>;
}

/**
 * Track and aggregate discipline filter statistics
 */
export class DisciplineTracker {
  private stats: DisciplineStats = {
    totalSignals: 0,
    allowedTrades: 0,
    rejectedTrades: 0,
    rejectionRate: 0,
    rejectionsByFilter: {}
  };
  
  recordValidation(validation: DisciplineValidation): void {
    this.stats.totalSignals++;
    
    if (validation.allowed) {
      this.stats.allowedTrades++;
    } else {
      this.stats.rejectedTrades++;
      
      // Track which filters caused rejections
      for (const reason of validation.rejectionReasons) {
        // Extract filter name from reason
        const filterNames = [
          'Trend', 'R:R', 'Volume', 'Pattern', 'Max positions', 
          'liquidity', 'news', 'Stop', 'Cooldown'
        ];
        for (const name of filterNames) {
          if (reason.toLowerCase().includes(name.toLowerCase())) {
            this.stats.rejectionsByFilter[name] = 
              (this.stats.rejectionsByFilter[name] || 0) + 1;
            break;
          }
        }
      }
    }
    
    this.stats.rejectionRate = 
      this.stats.totalSignals > 0 
        ? (this.stats.rejectedTrades / this.stats.totalSignals) * 100 
        : 0;
  }
  
  getStats(): DisciplineStats {
    return { ...this.stats };
  }
  
  reset(): void {
    this.stats = {
      totalSignals: 0,
      allowedTrades: 0,
      rejectedTrades: 0,
      rejectionRate: 0,
      rejectionsByFilter: {}
    };
  }
}

/**
 * Helper to convert higher timeframe reference to bar multiplier
 * Used when checking trend on higher timeframe
 */
export function getTimeframeMultiplier(
  signalTimeframe: string,
  referenceTimeframe: '4h' | 'daily' | 'weekly'
): number {
  const tfMinutes: Record<string, number> = {
    '1m': 1, '5m': 5, '15m': 15, '30m': 30,
    '1h': 60, '4h': 240, '1d': 1440, '1w': 10080,
    'daily': 1440, 'weekly': 10080
  };
  
  const signalMins = tfMinutes[signalTimeframe] || 60;
  const refMins = tfMinutes[referenceTimeframe] || 1440;
  
  return Math.max(1, Math.floor(refMins / signalMins));
}
