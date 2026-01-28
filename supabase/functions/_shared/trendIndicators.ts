/**
 * Trend Confirmation Indicators Module
 * 
 * Provides MACD, EMA, RSI, and ADX calculations for trend alignment analysis.
 * Used to determine if a pattern-based trade aligns with the larger market trend.
 */

export interface OHLCBar {
  date?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TrendIndicators {
  macd_signal: 'bullish' | 'bearish' | 'neutral';
  ema_trend: 'bullish' | 'bearish' | 'neutral';
  rsi_zone: 'oversold' | 'neutral' | 'overbought';
  adx_strength: 'weak' | 'moderate' | 'strong';
  adx_direction: 'bullish' | 'bearish' | 'neutral'; // Based on +DI vs -DI
  // Individual values for detailed display
  macd_value?: number;
  macd_signal_line?: number;
  macd_histogram?: number;
  ema_50?: number;
  ema_200?: number;
  rsi_value?: number;
  adx_value?: number;
  plus_di?: number;
  minus_di?: number;
}

export type TrendAlignment = 'with_trend' | 'counter_trend' | 'neutral';

// ============= EMA Calculation =============
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  
  const multiplier = 2 / (period + 1);
  const ema: number[] = [];
  
  // Initialize with SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(sum / period);
  
  // Calculate EMA for remaining values
  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
    ema.push(currentEMA);
  }
  
  return ema;
}

// Get last EMA value
export function getLastEMA(prices: number[], period: number): number | null {
  const emaValues = calculateEMA(prices, period);
  return emaValues.length > 0 ? emaValues[emaValues.length - 1] : null;
}

// ============= MACD Calculation =============
export interface MACDResult {
  macdLine: number;
  signalLine: number;
  histogram: number;
  signal: 'bullish' | 'bearish' | 'neutral';
}

export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult | null {
  if (prices.length < slowPeriod + signalPeriod) return null;
  
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  if (fastEMA.length === 0 || slowEMA.length === 0) return null;
  
  // Calculate MACD line (fast EMA - slow EMA)
  // Align the arrays - slowEMA starts later
  const offset = fastPeriod < slowPeriod ? slowPeriod - fastPeriod : 0;
  const macdLine: number[] = [];
  
  for (let i = 0; i < slowEMA.length; i++) {
    const fastIdx = i + offset;
    if (fastIdx < fastEMA.length) {
      macdLine.push(fastEMA[fastIdx] - slowEMA[i]);
    }
  }
  
  if (macdLine.length < signalPeriod) return null;
  
  // Calculate signal line (EMA of MACD line)
  const signalLineArray = calculateEMA(macdLine, signalPeriod);
  
  if (signalLineArray.length === 0) return null;
  
  const lastMACD = macdLine[macdLine.length - 1];
  const lastSignal = signalLineArray[signalLineArray.length - 1];
  const histogram = lastMACD - lastSignal;
  
  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  
  // Check for crossover
  if (macdLine.length >= 2 && signalLineArray.length >= 2) {
    const prevMACD = macdLine[macdLine.length - 2];
    const signalOffset = signalLineArray.length - macdLine.length + signalPeriod - 1;
    const prevSignalIdx = signalLineArray.length - 2;
    
    if (prevSignalIdx >= 0) {
      const prevSignal = signalLineArray[prevSignalIdx];
      
      // Bullish: MACD crosses above signal
      if (lastMACD > lastSignal && prevMACD <= prevSignal) {
        signal = 'bullish';
      }
      // Bearish: MACD crosses below signal
      else if (lastMACD < lastSignal && prevMACD >= prevSignal) {
        signal = 'bearish';
      }
      // Otherwise, use histogram direction
      else if (histogram > 0 && lastMACD > 0) {
        signal = 'bullish';
      } else if (histogram < 0 && lastMACD < 0) {
        signal = 'bearish';
      }
    }
  }
  
  return {
    macdLine: lastMACD,
    signalLine: lastSignal,
    histogram,
    signal
  };
}

// ============= RSI Calculation =============
export interface RSIResult {
  value: number;
  zone: 'oversold' | 'neutral' | 'overbought';
}

export function calculateRSI(prices: number[], period: number = 14): RSIResult | null {
  if (prices.length < period + 1) return null;
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  if (gains.length < period) return null;
  
  // Calculate initial averages
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  // Smooth with Wilder's method
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
  }
  
  if (avgLoss === 0) {
    return { value: 100, zone: 'overbought' };
  }
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  // Determine zone
  let zone: 'oversold' | 'neutral' | 'overbought' = 'neutral';
  if (rsi <= 30) zone = 'oversold';
  else if (rsi >= 70) zone = 'overbought';
  
  return { value: rsi, zone };
}

// ============= ADX Calculation =============
export interface ADXResult {
  value: number;
  strength: 'weak' | 'moderate' | 'strong';
  plusDI: number;
  minusDI: number;
}

export function calculateADX(bars: OHLCBar[], period: number = 14): ADXResult | null {
  if (bars.length < period * 2) return null;
  
  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];
  
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    const prevHigh = bars[i - 1].high;
    const prevLow = bars[i - 1].low;
    
    // True Range
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
    
    // Directional Movement
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    
    const plusDM = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDM = downMove > upMove && downMove > 0 ? downMove : 0;
    
    plusDMs.push(plusDM);
    minusDMs.push(minusDM);
  }
  
  if (trueRanges.length < period) return null;
  
  // Calculate smoothed values using Wilder's method
  let smoothedTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  
  const dxValues: number[] = [];
  
  for (let i = period; i < trueRanges.length; i++) {
    smoothedTR = smoothedTR - (smoothedTR / period) + trueRanges[i];
    smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDMs[i];
    smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDMs[i];
    
    const plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
    const minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;
    
    const diDiff = Math.abs(plusDI - minusDI);
    const diSum = plusDI + minusDI;
    
    const dx = diSum > 0 ? (diDiff / diSum) * 100 : 0;
    dxValues.push(dx);
  }
  
  if (dxValues.length < period) return null;
  
  // Calculate ADX (smoothed DX)
  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < dxValues.length; i++) {
    adx = ((adx * (period - 1)) + dxValues[i]) / period;
  }
  
  // Calculate final +DI and -DI
  const finalPlusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
  const finalMinusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;
  
  // Determine strength
  let strength: 'weak' | 'moderate' | 'strong' = 'weak';
  if (adx >= 25 && adx < 50) strength = 'moderate';
  else if (adx >= 50) strength = 'strong';
  
  return {
    value: adx,
    strength,
    plusDI: finalPlusDI,
    minusDI: finalMinusDI
  };
}

// ============= Combined Trend Analysis =============
export function analyzeTrendIndicators(bars: OHLCBar[]): TrendIndicators | null {
  if (bars.length < 200) return null; // Need enough data for 200 EMA
  
  const closes = bars.map(b => b.close);
  const currentPrice = closes[closes.length - 1];
  
  // Calculate all indicators
  const ema50 = getLastEMA(closes, 50);
  const ema200 = getLastEMA(closes, 200);
  const macd = calculateMACD(closes);
  const rsi = calculateRSI(closes);
  const adx = calculateADX(bars);
  
  // Determine EMA trend
  let emaTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (ema50 && ema200) {
    if (currentPrice > ema50 && ema50 > ema200) {
      emaTrend = 'bullish';
    } else if (currentPrice < ema50 && ema50 < ema200) {
      emaTrend = 'bearish';
    }
  }
  
  // Determine ADX direction based on +DI vs -DI
  let adxDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (adx) {
    const diDiff = adx.plusDI - adx.minusDI;
    // Require meaningful difference (>5 points) to declare direction
    if (diDiff > 5) {
      adxDirection = 'bullish';
    } else if (diDiff < -5) {
      adxDirection = 'bearish';
    }
  }
  
  return {
    macd_signal: macd?.signal || 'neutral',
    ema_trend: emaTrend,
    rsi_zone: rsi?.zone || 'neutral',
    adx_strength: adx?.strength || 'weak',
    adx_direction: adxDirection,
    macd_value: macd?.macdLine,
    macd_signal_line: macd?.signalLine,
    macd_histogram: macd?.histogram,
    ema_50: ema50 || undefined,
    ema_200: ema200 || undefined,
    rsi_value: rsi?.value,
    adx_value: adx?.value,
    plus_di: adx?.plusDI,
    minus_di: adx?.minusDI
  };
}

// ============= Trend Alignment Determination =============
export function determineTrendAlignment(
  direction: 'long' | 'short' | 'bullish' | 'bearish',
  indicators: TrendIndicators
): TrendAlignment {
  const isLong = direction === 'long' || direction === 'bullish';
  
  // Count bullish vs bearish signals with weighted scoring
  let bullishScore = 0;
  let bearishScore = 0;
  
  // MACD signal (weight: 1.0) - momentum direction
  if (indicators.macd_signal === 'bullish') bullishScore += 1.0;
  else if (indicators.macd_signal === 'bearish') bearishScore += 1.0;
  
  // EMA trend (weight: 1.0) - primary trend direction
  if (indicators.ema_trend === 'bullish') bullishScore += 1.0;
  else if (indicators.ema_trend === 'bearish') bearishScore += 1.0;
  
  // ADX direction (weight: 1.0) - directional movement (+DI vs -DI)
  // This is crucial for short trades: -DI > +DI indicates bearish pressure
  if (indicators.adx_direction === 'bullish') bullishScore += 1.0;
  else if (indicators.adx_direction === 'bearish') bearishScore += 1.0;
  
  // RSI zone (weight: 0.5) - momentum confirmation
  // For trend-following: 
  // - In uptrend, RSI 50-70 confirms bullish momentum
  // - In downtrend, RSI 30-50 confirms bearish momentum
  // - Extreme zones (oversold/overbought) may signal exhaustion
  if (indicators.rsi_zone === 'neutral' && indicators.rsi_value !== undefined) {
    // RSI in healthy trend range (40-60 is neutral territory)
    if (indicators.rsi_value > 50 && indicators.rsi_value < 70) {
      bullishScore += 0.5; // Bullish momentum
    } else if (indicators.rsi_value < 50 && indicators.rsi_value > 30) {
      bearishScore += 0.5; // Bearish momentum
    }
  } else if (indicators.rsi_zone === 'overbought') {
    // Overbought can mean strong bullish OR potential reversal
    // For trend-following, we treat this as bullish confirmation
    bullishScore += 0.25;
  } else if (indicators.rsi_zone === 'oversold') {
    // Oversold can mean strong bearish OR potential reversal
    // For trend-following, we treat this as bearish confirmation
    bearishScore += 0.25;
  }
  
  // ADX strength modifier: only count trend signals strongly if trend is moderate/strong
  const trendStrengthMod = indicators.adx_strength === 'weak' ? 0.6 : 
                           indicators.adx_strength === 'moderate' ? 0.85 : 1.0;
  
  // Apply strength modifier
  bullishScore *= trendStrengthMod;
  bearishScore *= trendStrengthMod;
  
  // Determine market bias with threshold to avoid noise
  const scoreDiff = Math.abs(bullishScore - bearishScore);
  const minThreshold = 0.3; // Require meaningful difference
  
  let marketBias: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (scoreDiff >= minThreshold) {
    marketBias = bullishScore > bearishScore ? 'bullish' : 'bearish';
  }
  
  if (marketBias === 'neutral') {
    return 'neutral';
  }
  
  // Check if trade direction matches market bias
  // For LONG trades: market should be bullish
  // For SHORT trades: market should be bearish
  if ((isLong && marketBias === 'bullish') || (!isLong && marketBias === 'bearish')) {
    return 'with_trend';
  } else {
    return 'counter_trend';
  }
}

// ============= Full Analysis for a Single Bar =============
export interface TrendAnalysisResult {
  alignment: TrendAlignment;
  indicators: TrendIndicators;
}

export function analyzePatternTrend(
  bars: OHLCBar[],
  direction: 'long' | 'short' | 'bullish' | 'bearish'
): TrendAnalysisResult | null {
  const indicators = analyzeTrendIndicators(bars);
  
  if (!indicators) return null;
  
  const alignment = determineTrendAlignment(direction, indicators);
  
  return { alignment, indicators };
}
