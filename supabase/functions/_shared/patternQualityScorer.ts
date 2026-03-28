/**
 * Pattern Quality Scorer v2.0.0 (Edge Function Version)
 * 
 * A production-grade quality scoring system for chart patterns.
 * This is the server-side implementation for use in edge functions.
 * 
 * v2.0 enhancements:
 * - ADX trend strength integration
 * - Relative volume (20-day) analysis
 * - Historical win rate per pattern/symbol
 * - Volatility regime assessment
 */

export interface OHLCBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ZigZagPivot {
  index: number;
  price: number;
  type: 'high' | 'low';
  timestamp: string;
}

export interface QualityFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  passed: boolean;
}

export interface PatternQualityResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: number;
  factors: QualityFactor[];
  pivots: ZigZagPivot[];
  summary: string;
  tradeable: boolean;
  warnings: string[];
}

export interface TrendIndicatorsInput {
  adx_strength?: 'weak' | 'moderate' | 'strong';
  adx_value?: number;
  adx_direction?: 'bullish' | 'bearish' | 'neutral';
  ema_trend?: 'bullish' | 'bearish' | 'neutral';
  rsi_zone?: 'oversold' | 'neutral' | 'overbought';
  macd_signal?: 'bullish' | 'bearish' | 'neutral';
}

export interface HistoricalPerformanceInput {
  winRate?: number;
  avgRMultiple?: number;
  sampleSize?: number;
}

// ============= ZIGZAG PIVOT DETECTION =============

export function calculateZigZagPivots(
  bars: OHLCBar[],
  threshold: number = 5
): ZigZagPivot[] {
  if (bars.length < 5) return [];
  
  const pivots: ZigZagPivot[] = [];
  let lastPivotType: 'high' | 'low' | null = null;
  let lastPivotPrice = bars[0].close;
  
  const firstHigh = bars[0].high;
  const firstLow = bars[0].low;
  
  for (let i = 1; i < bars.length; i++) {
    const currentHigh = bars[i].high;
    const currentLow = bars[i].low;
    
    if (lastPivotType === null) {
      if ((currentHigh - firstLow) / firstLow * 100 >= threshold) {
        pivots.push({ index: 0, price: firstLow, type: 'low', timestamp: bars[0].date });
        lastPivotType = 'low';
        lastPivotPrice = firstLow;
      } else if ((firstHigh - currentLow) / currentLow * 100 >= threshold) {
        pivots.push({ index: 0, price: firstHigh, type: 'high', timestamp: bars[0].date });
        lastPivotType = 'high';
        lastPivotPrice = firstHigh;
      }
    } else if (lastPivotType === 'low') {
      if ((currentHigh - lastPivotPrice) / lastPivotPrice * 100 >= threshold) {
        pivots.push({ index: i, price: currentHigh, type: 'high', timestamp: bars[i].date });
        lastPivotType = 'high';
        lastPivotPrice = currentHigh;
      } else if (currentLow < lastPivotPrice) {
        pivots[pivots.length - 1] = { index: i, price: currentLow, type: 'low', timestamp: bars[i].date };
        lastPivotPrice = currentLow;
      }
    } else {
      if ((lastPivotPrice - currentLow) / lastPivotPrice * 100 >= threshold) {
        pivots.push({ index: i, price: currentLow, type: 'low', timestamp: bars[i].date });
        lastPivotType = 'low';
        lastPivotPrice = currentLow;
      } else if (currentHigh > lastPivotPrice) {
        pivots[pivots.length - 1] = { index: i, price: currentHigh, type: 'high', timestamp: bars[i].date };
        lastPivotPrice = currentHigh;
      }
    }
  }
  
  return pivots;
}

// ============= HELPER FUNCTIONS =============

function calculateAverageVolume(bars: OHLCBar[], period: number = 20): number {
  const volumeBars = bars.filter(b => b.volume != null && b.volume > 0);
  if (volumeBars.length === 0) return 0;
  const recentBars = volumeBars.slice(-period);
  return recentBars.reduce((sum, b) => sum + (b.volume || 0), 0) / recentBars.length;
}

function calculateHistoricalATR(bars: OHLCBar[], period: number = 14): number[] {
  const atrValues: number[] = [];
  if (bars.length < period + 1) return atrValues;
  
  for (let i = period; i < bars.length; i++) {
    let atrSum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const high = bars[j].high;
      const low = bars[j].low;
      const prevClose = bars[j - 1].close;
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      atrSum += tr;
    }
    atrValues.push(atrSum / period);
  }
  return atrValues;
}

// ============= ORIGINAL ANALYSIS FUNCTIONS =============

function analyzeVolumeConfirmation(
  bars: OHLCBar[],
  patternStartIndex: number,
  patternEndIndex: number
): { score: number; description: string; confirmed: boolean } {
  if (!bars[0]?.volume || bars.every(b => !b.volume || b.volume === 0)) {
    return { score: 5, description: 'Volume data unavailable', confirmed: false };
  }
  
  const patternBars = bars.slice(patternStartIndex, patternEndIndex + 1);
  const priorBars = bars.slice(Math.max(0, patternStartIndex - 20), patternStartIndex);
  
  if (patternBars.length < 3 || priorBars.length < 5) {
    return { score: 5, description: 'Insufficient bars', confirmed: false };
  }
  
  const patternAvgVolume = patternBars.reduce((s, b) => s + (b.volume || 0), 0) / patternBars.length;
  const priorAvgVolume = priorBars.reduce((s, b) => s + (b.volume || 0), 0) / priorBars.length;
  
  const volumeContraction = priorAvgVolume > 0 ? patternAvgVolume / priorAvgVolume : 1;
  const breakoutBar = bars[patternEndIndex];
  const breakoutVolumeRatio = priorAvgVolume > 0 ? (breakoutBar.volume || 0) / priorAvgVolume : 1;
  
  let score = 5;
  const descriptions: string[] = [];
  
  if (volumeContraction >= 0.5 && volumeContraction <= 0.8) {
    score += 2;
    descriptions.push('Healthy volume contraction');
  } else if (volumeContraction < 0.3) {
    score -= 1;
    descriptions.push('Excessive volume decline');
  }
  
  if (breakoutVolumeRatio >= 2.0) {
    score += 3;
    descriptions.push('Strong breakout volume (2x+)');
  } else if (breakoutVolumeRatio >= 1.5) {
    score += 2;
    descriptions.push('Good breakout volume (1.5x+)');
  } else if (breakoutVolumeRatio < 0.8) {
    score -= 2;
    descriptions.push('Weak breakout volume');
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Normal volume pattern',
    confirmed: score >= 7
  };
}

function analyzeTrendAlignment(
  bars: OHLCBar[],
  direction: 'long' | 'short'
): { score: number; description: string; aligned: boolean } {
  if (bars.length < 50) {
    return { score: 5, description: 'Insufficient data', aligned: false };
  }
  
  const recentBars = bars.slice(-20);
  const extendedBars = bars.slice(-50);
  
  const sma20 = recentBars.reduce((s, b) => s + b.close, 0) / recentBars.length;
  const sma50 = extendedBars.reduce((s, b) => s + b.close, 0) / extendedBars.length;
  const currentPrice = bars[bars.length - 1].close;
  
  const uptrend = currentPrice > sma20 && sma20 > sma50;
  const downtrend = currentPrice < sma20 && sma20 < sma50;
  
  let score = 5;
  let description = '';
  let aligned = false;
  
  if (direction === 'long') {
    if (uptrend) {
      score = 9;
      description = 'Long signal in uptrend';
      aligned = true;
    } else if (downtrend) {
      score = 3;
      description = 'Counter-trend: Long in downtrend';
    } else {
      score = 6;
      description = 'Neutral trend';
    }
  } else {
    if (downtrend) {
      score = 9;
      description = 'Short signal in downtrend';
      aligned = true;
    } else if (uptrend) {
      score = 3;
      description = 'Counter-trend: Short in uptrend';
    } else {
      score = 6;
      description = 'Neutral trend';
    }
  }
  
  return { score, description, aligned };
}

function analyzePatternSymmetry(
  pivots: ZigZagPivot[],
  patternType: string
): { score: number; description: string } {
  if (pivots.length < 3) {
    return { score: 5, description: 'Insufficient pivots' };
  }
  
  let score = 5;
  const descriptions: string[] = [];
  
  const pivotDistances: number[] = [];
  for (let i = 1; i < pivots.length; i++) {
    pivotDistances.push(pivots[i].index - pivots[i - 1].index);
  }
  
  if (pivotDistances.length >= 2) {
    const avgDistance = pivotDistances.reduce((a, b) => a + b, 0) / pivotDistances.length;
    const maxDeviation = Math.max(...pivotDistances.map(d => Math.abs(d - avgDistance) / avgDistance));
    
    if (maxDeviation < 0.3) {
      score += 2;
      descriptions.push('Excellent pivot spacing');
    } else if (maxDeviation < 0.5) {
      score += 1;
      descriptions.push('Good pivot spacing');
    } else if (maxDeviation > 0.8) {
      score -= 1;
      descriptions.push('Irregular pivot spacing');
    }
  }
  
  if (patternType.includes('double') || patternType.includes('head')) {
    const highs = pivots.filter(p => p.type === 'high');
    const lows = pivots.filter(p => p.type === 'low');
    
    if (highs.length >= 2) {
      const highDiff = Math.abs(highs[0].price - highs[1].price) / highs[0].price;
      if (highDiff < 0.02) {
        score += 2;
        descriptions.push('Near-equal resistance levels');
      }
    }
    
    if (lows.length >= 2) {
      const lowDiff = Math.abs(lows[0].price - lows[1].price) / lows[0].price;
      if (lowDiff < 0.02) {
        score += 1;
        descriptions.push('Near-equal support levels');
      }
    }
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Standard structure'
  };
}

function analyzePriceActionClarity(
  bars: OHLCBar[],
  patternStartIndex: number,
  patternEndIndex: number
): { score: number; description: string } {
  const patternBars = bars.slice(patternStartIndex, patternEndIndex + 1);
  
  if (patternBars.length < 5) {
    return { score: 5, description: 'Insufficient bars' };
  }
  
  let score = 5;
  const descriptions: string[] = [];
  
  const avgRange = patternBars.reduce((s, b) => s + (b.high - b.low), 0) / patternBars.length;
  const avgBody = patternBars.reduce((s, b) => s + Math.abs(b.close - b.open), 0) / patternBars.length;
  const bodyToRangeRatio = avgRange > 0 ? avgBody / avgRange : 0;
  
  if (bodyToRangeRatio > 0.6) {
    score += 2;
    descriptions.push('Strong candle bodies');
  } else if (bodyToRangeRatio < 0.3) {
    score -= 1;
    descriptions.push('Many indecision candles');
  }
  
  const excessiveWicks = patternBars.filter(b => {
    const upperWick = b.high - Math.max(b.open, b.close);
    const lowerWick = Math.min(b.open, b.close) - b.low;
    const body = Math.abs(b.close - b.open);
    return (upperWick > body * 2 || lowerWick > body * 2);
  }).length;
  
  if (excessiveWicks / patternBars.length < 0.2) {
    score += 1;
    descriptions.push('Clean price action');
  } else if (excessiveWicks / patternBars.length > 0.5) {
    score -= 2;
    descriptions.push('Noisy price action');
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Normal price action'
  };
}

function analyzeTargetValidity(
  atr: number,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): { score: number; description: string } {
  const stopDistance = Math.abs(entryPrice - stopLoss);
  const targetDistance = Math.abs(takeProfit - entryPrice);
  const riskReward = targetDistance / stopDistance;
  
  let score = 5;
  const descriptions: string[] = [];
  
  const stopATRs = stopDistance / atr;
  if (stopATRs >= 1 && stopATRs <= 3) {
    score += 2;
    descriptions.push(`Stop at ${stopATRs.toFixed(1)} ATR (optimal)`);
  } else if (stopATRs < 0.5) {
    score -= 2;
    descriptions.push('Stop too tight');
  } else if (stopATRs > 5) {
    score -= 1;
    descriptions.push('Stop too wide');
  }
  
  if (riskReward >= 2) {
    score += 2;
    descriptions.push(`Excellent R:R (${riskReward.toFixed(2)})`);
  } else if (riskReward >= 1.5) {
    score += 1;
    descriptions.push(`Good R:R (${riskReward.toFixed(2)})`);
  } else if (riskReward < 1) {
    score -= 2;
    descriptions.push(`Poor R:R (${riskReward.toFixed(2)})`);
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Standard targets'
  };
}

// ============= NEW PHASE 1 FACTORS =============

/**
 * Factor: ADX Trend Strength
 * Measures trend conviction using ADX values from trendIndicators
 */
function analyzeADXStrength(
  trendIndicators?: TrendIndicatorsInput,
  direction?: 'long' | 'short'
): { score: number; description: string; passed: boolean } {
  if (!trendIndicators?.adx_strength) {
    return { score: 5, description: 'ADX data unavailable', passed: false };
  }
  
  const { adx_strength, adx_value, adx_direction } = trendIndicators;
  let score = 5;
  const descriptions: string[] = [];
  
  // Score based on ADX strength
  if (adx_strength === 'strong') {
    score += 3;
    descriptions.push(`Strong trend (ADX ${adx_value?.toFixed(1) || '>50'})`);
  } else if (adx_strength === 'moderate') {
    score += 1.5;
    descriptions.push(`Moderate trend (ADX ${adx_value?.toFixed(1) || '25-50'})`);
  } else {
    score -= 1;
    descriptions.push(`Weak trend (ADX ${adx_value?.toFixed(1) || '<25'})`);
  }
  
  // Bonus if ADX direction aligns with trade direction
  if (direction && adx_direction) {
    const aligned = (direction === 'long' && adx_direction === 'bullish') ||
                    (direction === 'short' && adx_direction === 'bearish');
    if (aligned) {
      score += 1;
      descriptions.push('ADX direction confirms');
    } else if (adx_direction !== 'neutral') {
      score -= 0.5;
      descriptions.push('ADX direction opposes');
    }
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Standard trend strength',
    passed: score >= 6
  };
}

/**
 * Factor: Relative Volume (20-day)
 * Compares current volume to 20-day average
 */
function analyzeRelativeVolume(
  bars: OHLCBar[],
  patternEndIndex: number
): { score: number; description: string; passed: boolean } {
  if (!bars[0]?.volume || bars.every(b => !b.volume || b.volume === 0)) {
    return { score: 5, description: 'Volume data unavailable', passed: false };
  }
  
  // Calculate 20-day average volume (excluding the pattern end bar)
  const lookbackBars = bars.slice(Math.max(0, patternEndIndex - 21), patternEndIndex);
  const avg20Volume = calculateAverageVolume(lookbackBars, 20);
  
  if (avg20Volume <= 0) {
    return { score: 5, description: 'No volume history', passed: false };
  }
  
  const currentVolume = bars[patternEndIndex]?.volume || 0;
  const relativeVolume = currentVolume / avg20Volume;
  
  let score = 5;
  const descriptions: string[] = [];
  
  if (relativeVolume >= 2.5) {
    score += 3;
    descriptions.push(`Very high RVOL (${relativeVolume.toFixed(1)}x)`);
  } else if (relativeVolume >= 1.5) {
    score += 2;
    descriptions.push(`Elevated RVOL (${relativeVolume.toFixed(1)}x)`);
  } else if (relativeVolume >= 1.0) {
    score += 0.5;
    descriptions.push(`Normal RVOL (${relativeVolume.toFixed(1)}x)`);
  } else if (relativeVolume >= 0.5) {
    score -= 1;
    descriptions.push(`Below-average RVOL (${relativeVolume.toFixed(1)}x)`);
  } else {
    score -= 2;
    descriptions.push(`Very low RVOL (${relativeVolume.toFixed(1)}x)`);
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Standard volume',
    passed: score >= 6
  };
}

/**
 * Factor: Historical Win Rate
 * Uses actual win rate from this pattern on this symbol
 */
function analyzeHistoricalWinRate(
  historicalPerformance?: HistoricalPerformanceInput
): { score: number; description: string; passed: boolean } {
  if (!historicalPerformance?.winRate || !historicalPerformance?.sampleSize) {
    return { score: 5, description: 'No historical data', passed: false };
  }
  
  const { winRate, avgRMultiple, sampleSize } = historicalPerformance;
  let score = 5;
  const descriptions: string[] = [];
  
  // Sample size confidence adjustment
  let confidenceMultiplier = 1.0;
  if (sampleSize < 10) {
    confidenceMultiplier = 0.6;
    descriptions.push(`Low sample (n=${sampleSize})`);
  } else if (sampleSize < 30) {
    confidenceMultiplier = 0.8;
  } else if (sampleSize >= 50) {
    confidenceMultiplier = 1.1;
    descriptions.push(`High confidence (n=${sampleSize})`);
  }
  
  // Score based on win rate
  if (winRate >= 65) {
    score += 3 * confidenceMultiplier;
    descriptions.push(`Strong win rate (${winRate.toFixed(1)}%)`);
  } else if (winRate >= 55) {
    score += 2 * confidenceMultiplier;
    descriptions.push(`Above-average win rate (${winRate.toFixed(1)}%)`);
  } else if (winRate >= 45) {
    score += 0.5;
    descriptions.push(`Average win rate (${winRate.toFixed(1)}%)`);
  } else {
    score -= 1.5 * confidenceMultiplier;
    descriptions.push(`Below-average win rate (${winRate.toFixed(1)}%)`);
  }
  
  // Bonus for positive expectancy (avgRMultiple)
  if (avgRMultiple && avgRMultiple > 0.3) {
    score += 1;
    descriptions.push(`Positive expectancy (${avgRMultiple.toFixed(2)}R)`);
  } else if (avgRMultiple && avgRMultiple < -0.2) {
    score -= 1;
    descriptions.push(`Negative expectancy (${avgRMultiple.toFixed(2)}R)`);
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Standard history',
    passed: score >= 6
  };
}

/**
 * Factor: Volatility Regime
 * Compares current ATR to historical ATR average
 */
function analyzeVolatilityRegime(
  bars: OHLCBar[],
  currentATR: number
): { score: number; description: string; passed: boolean } {
  if (bars.length < 60 || !currentATR) {
    return { score: 5, description: 'Insufficient volatility data', passed: false };
  }
  
  // Calculate historical ATR values
  const historicalATRs = calculateHistoricalATR(bars.slice(0, -10), 14); // Exclude recent bars
  
  if (historicalATRs.length < 20) {
    return { score: 5, description: 'Insufficient ATR history', passed: false };
  }
  
  // Get average ATR over last 50 periods
  const recentATRs = historicalATRs.slice(-50);
  const avgATR = recentATRs.reduce((a, b) => a + b, 0) / recentATRs.length;
  
  if (avgATR <= 0) {
    return { score: 5, description: 'Invalid ATR', passed: false };
  }
  
  const volatilityRatio = currentATR / avgATR;
  
  let score = 5;
  const descriptions: string[] = [];
  let regime: 'low' | 'normal' | 'high' | 'extreme' = 'normal';
  
  if (volatilityRatio >= 2.0) {
    regime = 'extreme';
    score -= 1;
    descriptions.push(`Extreme volatility (${volatilityRatio.toFixed(1)}x avg)`);
  } else if (volatilityRatio >= 1.3) {
    regime = 'high';
    score += 1;
    descriptions.push(`Elevated volatility (${volatilityRatio.toFixed(1)}x avg)`);
  } else if (volatilityRatio >= 0.7) {
    regime = 'normal';
    score += 2;
    descriptions.push(`Normal volatility regime`);
  } else {
    regime = 'low';
    score += 0.5;
    descriptions.push(`Low volatility (${volatilityRatio.toFixed(1)}x avg)`);
  }
  
  // Breakouts work better in consolidation (low vol) about to expand
  // Trend patterns work better in moderate volatility
  if (regime === 'low') {
    descriptions.push('Breakout potential');
  } else if (regime === 'normal') {
    descriptions.push('Optimal for trend patterns');
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Standard volatility',
    passed: score >= 6
  };
}

// ============= MAIN SCORING FUNCTION =============

/**
 * Repeatability proof requirements for grade eligibility.
 * Patterns without sufficient historical evidence are capped.
 */
export interface RepeatabilityProof {
  sampleSize: number;    // number of historical occurrences
  winRate: number;       // win rate as percentage (0-100)
  expectancyR: number;   // expectancy in R-multiples
}

/**
 * Cup & Handle handle depth bonus/penalty.
 * Rewards shallow handles (Bulkowski: shallower handles have higher breakout success).
 */
function getCupHandleHandleBonus(patternType: string, handleDepth?: number): number {
  if (!['cup-and-handle', 'inverse-cup-and-handle'].includes(patternType)) return 0;
  if (handleDepth === undefined || handleDepth === null) return 0;
  
  if (handleDepth <= 0.15) return 1.0;   // very shallow — strong signal
  if (handleDepth <= 0.25) return 0.5;   // shallow — good signal
  if (handleDepth <= 0.33) return 0;     // normal — no bonus
  return -0.5;                            // deep handle — slight penalty
}


  bars: OHLCBar[];
  patternType: string;
  patternStartIndex: number;
  patternEndIndex: number;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  atr: number;
  // New v2.0 inputs
  trendIndicators?: TrendIndicatorsInput;
  historicalPerformance?: HistoricalPerformanceInput;
  // Repeatability gate (from Edge Atlas)
  repeatabilityProof?: RepeatabilityProof;
  // Cup & Handle handle depth (ratio 0-1 of cup depth)
  handleDepth?: number;
}

export function calculatePatternQualityScore(
  input: PatternQualityScorerInput
): PatternQualityResult {
  const {
    bars,
    patternType,
    patternStartIndex,
    patternEndIndex,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    atr,
    trendIndicators,
    historicalPerformance,
    repeatabilityProof,
    handleDepth
  } = input;
  
  const factors: QualityFactor[] = [];
  const warnings: string[] = [];
  
  const pivots = calculateZigZagPivots(bars.slice(patternStartIndex, patternEndIndex + 1), 3);
  
  // ============= ORIGINAL FACTORS (Adjusted weights for Phase 1) =============
  
  // Factor 1: Volume Confirmation (15% - reduced from 20%)
  const volumeAnalysis = analyzeVolumeConfirmation(bars, patternStartIndex, patternEndIndex);
  factors.push({
    name: 'Volume Confirmation',
    score: volumeAnalysis.score,
    weight: 0.15,
    description: volumeAnalysis.description,
    passed: volumeAnalysis.confirmed
  });
  if (volumeAnalysis.score < 5) warnings.push('Low volume confirmation');
  
  // Factor 2: Trend Alignment (20% - reduced from 25%)
  const trendAnalysis = analyzeTrendAlignment(bars, direction);
  factors.push({
    name: 'Trend Alignment',
    score: trendAnalysis.score,
    weight: 0.20,
    description: trendAnalysis.description,
    passed: trendAnalysis.aligned
  });
  if (trendAnalysis.score < 5) warnings.push('Counter-trend signal');
  
  // Factor 3: Pattern Symmetry (10% - reduced from 15%)
  const symmetryAnalysis = analyzePatternSymmetry(pivots, patternType);
  factors.push({
    name: 'Pattern Symmetry',
    score: symmetryAnalysis.score,
    weight: 0.10,
    description: symmetryAnalysis.description,
    passed: symmetryAnalysis.score >= 6
  });
  
  // Factor 4: Price Action Clarity (10% - reduced from 15%)
  const clarityAnalysis = analyzePriceActionClarity(bars, patternStartIndex, patternEndIndex);
  factors.push({
    name: 'Price Action Clarity',
    score: clarityAnalysis.score,
    weight: 0.10,
    description: clarityAnalysis.description,
    passed: clarityAnalysis.score >= 6
  });
  
  // Factor 5: Target Structure (15% - reduced from 25%)
  const targetAnalysis = analyzeTargetValidity(atr, entryPrice, stopLoss, takeProfit);
  factors.push({
    name: 'Target Structure',
    score: targetAnalysis.score,
    weight: 0.15,
    description: targetAnalysis.description,
    passed: targetAnalysis.score >= 6
  });
  
  // ============= NEW PHASE 1 FACTORS =============
  
  // Factor 6: ADX Trend Strength (10%)
  const adxAnalysis = analyzeADXStrength(trendIndicators, direction);
  factors.push({
    name: 'ADX Trend Strength',
    score: adxAnalysis.score,
    weight: 0.10,
    description: adxAnalysis.description,
    passed: adxAnalysis.passed
  });
  if (adxAnalysis.score < 4) warnings.push('Weak trend conviction');
  
  // Factor 7: Relative Volume (5%)
  const rvolAnalysis = analyzeRelativeVolume(bars, patternEndIndex);
  factors.push({
    name: 'Relative Volume',
    score: rvolAnalysis.score,
    weight: 0.05,
    description: rvolAnalysis.description,
    passed: rvolAnalysis.passed
  });
  
  // Factor 8: Historical Win Rate (10%)
  const histAnalysis = analyzeHistoricalWinRate(historicalPerformance);
  factors.push({
    name: 'Historical Win Rate',
    score: histAnalysis.score,
    weight: 0.10,
    description: histAnalysis.description,
    passed: histAnalysis.passed
  });
  if (histAnalysis.score < 4) warnings.push('Poor historical performance');
  
  // Factor 9: Volatility Regime (5%)
  const volRegimeAnalysis = analyzeVolatilityRegime(bars, atr);
  factors.push({
    name: 'Volatility Regime',
    score: volRegimeAnalysis.score,
    weight: 0.05,
    description: volRegimeAnalysis.description,
    passed: volRegimeAnalysis.passed
  });
  
  // ============= CALCULATE FINAL SCORE =============
  // Dynamic weight redistribution: when data is unavailable (score stuck at 5
  // with a telltale "unavailable"/"No historical"/"Insufficient" description),
  // redistribute that factor's weight proportionally to factors with real data.
  
  const DATA_UNAVAILABLE_KEYWORDS = ['unavailable', 'No historical', 'Insufficient', 'No volume history', 'Invalid ATR'];
  
  const hasRealData = (f: QualityFactor): boolean =>
    !DATA_UNAVAILABLE_KEYWORDS.some(kw => f.description.includes(kw));
  
  const realFactors = factors.filter(hasRealData);
  const missingFactors = factors.filter(f => !hasRealData(f));
  
  let weightedScore: number;
  
  if (missingFactors.length > 0 && realFactors.length > 0) {
    // Redistribute missing weight proportionally to real factors
    const missingWeight = missingFactors.reduce((sum, f) => sum + f.weight, 0);
    const realWeight = realFactors.reduce((sum, f) => sum + f.weight, 0);
    const redistributionMultiplier = (realWeight + missingWeight) / realWeight;
    
    weightedScore = realFactors.reduce(
      (sum, f) => sum + f.score * f.weight * redistributionMultiplier, 0
    );
  } else {
    weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  }
  
  // Cup & Handle handle depth bonus/penalty
  const handleBonus = getCupHandleHandleBonus(patternType, handleDepth);
  weightedScore += handleBonus;
  
  const finalScore = Math.max(0, Math.min(10, Math.round(weightedScore * 10) / 10));
  
  // Grade — recalibrated thresholds so A-grade is rare but achievable (~5-10%)
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (finalScore >= 7.5) grade = 'A';
  else if (finalScore >= 6.0) grade = 'B';
  else if (finalScore >= 4.5) grade = 'C';
  else if (finalScore >= 3.0) grade = 'D';
  else grade = 'F';
  
  // ============= REPEATABILITY GATE =============
  // Hard-cap grades for patterns without proven statistical edge.
  // A-grade: requires n≥30, win rate ≥50%, positive expectancy (>0R)
  // B-grade: requires n≥15, positive expectancy (>0R)
  // Unproven patterns cap at C-grade regardless of form score.
  
  let repeatabilityWarning: string | null = null;
  
  if (repeatabilityProof) {
    const { sampleSize, winRate, expectancyR } = repeatabilityProof;
    
    if (grade === 'A') {
      const meetsAGate = sampleSize >= 30 && winRate >= 50 && expectancyR > 0;
      if (!meetsAGate) {
        grade = 'B'; // Downgrade to B
        repeatabilityWarning = sampleSize < 30
          ? `Insufficient proof for A-grade (n=${sampleSize}, need ≥30)`
          : winRate < 50
            ? `Win rate too low for A-grade (${winRate.toFixed(1)}%, need ≥50%)`
            : `Negative expectancy blocks A-grade (${expectancyR.toFixed(2)}R)`;
        
        // Re-check if it meets B-grade gate
        const meetsBGate = sampleSize >= 15 && expectancyR > 0;
        if (!meetsBGate) {
          grade = 'C';
          repeatabilityWarning = `Unproven pattern capped at C-grade (n=${sampleSize}, exp=${expectancyR.toFixed(2)}R)`;
        }
      }
    } else if (grade === 'B') {
      const meetsBGate = sampleSize >= 15 && expectancyR > 0;
      if (!meetsBGate) {
        grade = 'C';
        repeatabilityWarning = sampleSize < 15
          ? `Insufficient proof for B-grade (n=${sampleSize}, need ≥15)`
          : `Negative expectancy blocks B-grade (${expectancyR.toFixed(2)}R)`;
      }
    }
  } else {
    // No repeatability data provided — cap at C-grade
    if (grade === 'A' || grade === 'B') {
      grade = 'C';
      repeatabilityWarning = 'No historical proof — capped at C-grade (Unproven)';
    }
  }
  
  if (repeatabilityWarning) {
    warnings.push(repeatabilityWarning);
  }
  
  // Confidence
  const passedFactors = factors.filter(f => f.passed).length;
  const confidence = Math.round((passedFactors / factors.length) * 100);
  
  // Tradeable
  const tradeable = finalScore >= 5 && warnings.length <= 2;
  
  // Summary
  const passedNames = factors.filter(f => f.passed).map(f => f.name);
  const summary = passedNames.length >= 4
    ? `Strong setup with ${passedNames.slice(0, 4).join(', ')}`
    : passedNames.length >= 2
      ? `Pattern detected with ${passedNames.slice(0, 3).join(', ')}`
      : `Pattern detected with ${passedFactors}/${factors.length} quality factors`;
  
  return {
    score: finalScore,
    grade,
    confidence,
    factors,
    pivots,
    summary,
    tradeable,
    warnings
  };
}

export function toArtifactQuality(result: PatternQualityResult): {
  score: number;
  grade: string;
  confidence: number;
  reasons: string[];
  warnings: string[];
  tradeable: boolean;
  factors?: QualityFactor[];
} {
  return {
    score: result.score,
    grade: result.grade,
    confidence: result.confidence,
    reasons: result.factors.filter(f => f.passed).map(f => f.description),
    warnings: result.warnings,
    tradeable: result.tradeable,
    factors: result.factors
  };
}
