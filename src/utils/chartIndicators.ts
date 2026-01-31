/**
 * Chart Indicator Calculations
 * Pure functions for calculating technical indicators from OHLCV bar data
 */

import { CompressedBar } from '@/types/VisualSpec';

export interface IndicatorPoint {
  time: number; // Unix timestamp in seconds
  value: number;
}

export interface BollingerBandsPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

export interface MACDPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(bars: CompressedBar[], period: number): IndicatorPoint[] {
  if (bars.length < period) return [];
  
  const result: IndicatorPoint[] = [];
  
  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += bars[i - j].c;
    }
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      value: sum / period,
    });
  }
  
  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(bars: CompressedBar[], period: number): IndicatorPoint[] {
  if (bars.length < period) return [];
  
  const result: IndicatorPoint[] = [];
  const multiplier = 2 / (period + 1);
  
  // Calculate initial SMA for the first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += bars[i].c;
  }
  let ema = sum / period;
  
  result.push({
    time: Math.floor(new Date(bars[period - 1].t).getTime() / 1000),
    value: ema,
  });
  
  // Calculate EMA for remaining bars
  for (let i = period; i < bars.length; i++) {
    ema = (bars[i].c - ema) * multiplier + ema;
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      value: ema,
    });
  }
  
  return result;
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(bars: CompressedBar[], period: number = 14): IndicatorPoint[] {
  if (bars.length < period + 1) return [];
  
  const result: IndicatorPoint[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < bars.length; i++) {
    const change = bars[i].c - bars[i - 1].c;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain/loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  // First RSI value
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({
    time: Math.floor(new Date(bars[period].t).getTime() / 1000),
    value: 100 - (100 / (1 + rs)),
  });
  
  // Calculate remaining RSI values using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    
    const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    result.push({
      time: Math.floor(new Date(bars[i + 1].t).getTime() / 1000),
      value: rsi,
    });
  }
  
  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  bars: CompressedBar[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDPoint[] {
  if (bars.length < slowPeriod + signalPeriod) return [];
  
  const fastEMA = calculateEMA(bars, fastPeriod);
  const slowEMA = calculateEMA(bars, slowPeriod);
  
  // Align EMAs by time
  const slowTimeSet = new Set(slowEMA.map(p => p.time));
  const alignedFast = fastEMA.filter(p => slowTimeSet.has(p.time));
  
  // Calculate MACD line
  const macdLine: IndicatorPoint[] = [];
  for (let i = 0; i < slowEMA.length; i++) {
    const fastPoint = alignedFast.find(p => p.time === slowEMA[i].time);
    if (fastPoint) {
      macdLine.push({
        time: slowEMA[i].time,
        value: fastPoint.value - slowEMA[i].value,
      });
    }
  }
  
  if (macdLine.length < signalPeriod) return [];
  
  // Calculate signal line (EMA of MACD)
  const signalLine: IndicatorPoint[] = [];
  const multiplier = 2 / (signalPeriod + 1);
  
  let signalEMA = macdLine.slice(0, signalPeriod).reduce((a, b) => a + b.value, 0) / signalPeriod;
  signalLine.push({ time: macdLine[signalPeriod - 1].time, value: signalEMA });
  
  for (let i = signalPeriod; i < macdLine.length; i++) {
    signalEMA = (macdLine[i].value - signalEMA) * multiplier + signalEMA;
    signalLine.push({ time: macdLine[i].time, value: signalEMA });
  }
  
  // Combine into MACD result
  const result: MACDPoint[] = [];
  const signalTimeMap = new Map(signalLine.map(p => [p.time, p.value]));
  
  for (const point of macdLine) {
    const signal = signalTimeMap.get(point.time);
    if (signal !== undefined) {
      result.push({
        time: point.time,
        macd: point.value,
        signal,
        histogram: point.value - signal,
      });
    }
  }
  
  return result;
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  bars: CompressedBar[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsPoint[] {
  if (bars.length < period) return [];
  
  const result: BollingerBandsPoint[] = [];
  
  for (let i = period - 1; i < bars.length; i++) {
    const slice = bars.slice(i - period + 1, i + 1);
    const closes = slice.map(b => b.c);
    
    // Calculate SMA (middle band)
    const sma = closes.reduce((a, b) => a + b, 0) / period;
    
    // Calculate standard deviation
    const squaredDiffs = closes.map(c => Math.pow(c - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(variance);
    
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      upper: sma + stdDev * std,
      middle: sma,
      lower: sma - stdDev * std,
    });
  }
  
  return result;
}

/**
 * Volume Weighted Average Price (VWAP)
 * Note: Traditional VWAP resets daily, but for simplicity we calculate rolling VWAP
 */
export function calculateVWAP(bars: CompressedBar[]): IndicatorPoint[] {
  if (bars.length === 0) return [];
  
  const result: IndicatorPoint[] = [];
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;
  
  for (const bar of bars) {
    const typicalPrice = (bar.h + bar.l + bar.c) / 3;
    const volume = bar.v || 0;
    
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
    
    const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;
    
    result.push({
      time: Math.floor(new Date(bar.t).getTime() / 1000),
      value: vwap,
    });
  }
  
  return result;
}

/**
 * Volume SMA
 */
export function calculateVolumeSMA(bars: CompressedBar[], period: number = 20): IndicatorPoint[] {
  if (bars.length < period) return [];
  
  const result: IndicatorPoint[] = [];
  
  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += bars[i - j].v || 0;
    }
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      value: sum / period,
    });
  }
  
  return result;
}

export interface DonchianChannelPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

/**
 * Donchian Channels (Turtle Trading System)
 * Upper = Highest High over period
 * Lower = Lowest Low over period
 * Middle = (Upper + Lower) / 2
 */
export function calculateDonchianChannels(
  bars: CompressedBar[],
  period: number = 20
): DonchianChannelPoint[] {
  if (bars.length < period) return [];
  
  const result: DonchianChannelPoint[] = [];
  
  for (let i = period - 1; i < bars.length; i++) {
    const slice = bars.slice(i - period + 1, i + 1);
    
    const highestHigh = Math.max(...slice.map(b => b.h));
    const lowestLow = Math.min(...slice.map(b => b.l));
    const middle = (highestHigh + lowestLow) / 2;
    
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      upper: highestHigh,
      middle,
      lower: lowestLow,
    });
  }
  
  return result;
}

export interface IchimokuPoint {
  time: number;
  tenkan: number;      // Conversion Line (9-period)
  kijun: number;       // Base Line (26-period)
  senkouA: number;     // Leading Span A
  senkouB: number;     // Leading Span B
  chikou: number;      // Lagging Span
}

/**
 * Ichimoku Cloud (Ichimoku Kinko Hyo)
 * 
 * Components:
 * - Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
 * - Kijun-sen (Base Line): (26-period high + 26-period low) / 2
 * - Senkou Span A (Leading Span A): (Tenkan + Kijun) / 2, plotted 26 periods ahead
 * - Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2, plotted 26 periods ahead
 * - Chikou Span (Lagging Span): Close plotted 26 periods behind
 */
export function calculateIchimoku(
  bars: CompressedBar[],
  tenkanPeriod: number = 9,
  kijunPeriod: number = 26,
  senkouBPeriod: number = 52,
  displacement: number = 26
): { current: IchimokuPoint[], cloud: { time: number; senkouA: number; senkouB: number }[] } {
  if (bars.length < senkouBPeriod) return { current: [], cloud: [] };
  
  const current: IchimokuPoint[] = [];
  const cloud: { time: number; senkouA: number; senkouB: number }[] = [];
  
  // Helper to get highest high and lowest low over a period
  const getHighLow = (endIndex: number, period: number) => {
    const start = Math.max(0, endIndex - period + 1);
    const slice = bars.slice(start, endIndex + 1);
    return {
      high: Math.max(...slice.map(b => b.h)),
      low: Math.min(...slice.map(b => b.l)),
    };
  };
  
  for (let i = senkouBPeriod - 1; i < bars.length; i++) {
    const tenkanHL = getHighLow(i, tenkanPeriod);
    const kijunHL = getHighLow(i, kijunPeriod);
    const senkouBHL = getHighLow(i, senkouBPeriod);
    
    const tenkan = (tenkanHL.high + tenkanHL.low) / 2;
    const kijun = (kijunHL.high + kijunHL.low) / 2;
    const senkouA = (tenkan + kijun) / 2;
    const senkouB = (senkouBHL.high + senkouBHL.low) / 2;
    
    // Chikou is current close (will be plotted displaced back)
    const chikou = bars[i].c;
    
    const time = Math.floor(new Date(bars[i].t).getTime() / 1000);
    
    current.push({
      time,
      tenkan,
      kijun,
      senkouA,
      senkouB,
      chikou,
    });
    
    // Cloud data (displaced forward by 26 periods)
    // We store it with the future time for rendering
    const futureTime = time + (displacement * 24 * 60 * 60); // Approximate daily displacement
    cloud.push({
      time: futureTime,
      senkouA,
      senkouB,
    });
  }
  
  return { current, cloud };
}

// ============================================================
// ADDITIONAL INDICATORS FOR COMPREHENSIVE TECHNICAL ANALYSIS
// ============================================================

export interface StochasticPoint {
  time: number;
  k: number;  // %K (fast)
  d: number;  // %D (slow, signal line)
}

/**
 * Stochastic Oscillator
 * %K = (Current Close - Lowest Low) / (Highest High - Lowest Low) * 100
 * %D = 3-period SMA of %K
 */
export function calculateStochastic(
  bars: CompressedBar[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticPoint[] {
  if (bars.length < kPeriod + dPeriod) return [];
  
  const kValues: IndicatorPoint[] = [];
  
  // Calculate %K values
  for (let i = kPeriod - 1; i < bars.length; i++) {
    const slice = bars.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...slice.map(b => b.h));
    const lowestLow = Math.min(...slice.map(b => b.l));
    const range = highestHigh - lowestLow;
    
    const k = range === 0 ? 50 : ((bars[i].c - lowestLow) / range) * 100;
    kValues.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      value: k,
    });
  }
  
  // Calculate %D (SMA of %K)
  const result: StochasticPoint[] = [];
  for (let i = dPeriod - 1; i < kValues.length; i++) {
    let dSum = 0;
    for (let j = 0; j < dPeriod; j++) {
      dSum += kValues[i - j].value;
    }
    result.push({
      time: kValues[i].time,
      k: kValues[i].value,
      d: dSum / dPeriod,
    });
  }
  
  return result;
}

/**
 * Williams %R
 * %R = (Highest High - Close) / (Highest High - Lowest Low) * -100
 * Ranges from -100 (oversold) to 0 (overbought)
 */
export function calculateWilliamsR(
  bars: CompressedBar[],
  period: number = 14
): IndicatorPoint[] {
  if (bars.length < period) return [];
  
  const result: IndicatorPoint[] = [];
  
  for (let i = period - 1; i < bars.length; i++) {
    const slice = bars.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...slice.map(b => b.h));
    const lowestLow = Math.min(...slice.map(b => b.l));
    const range = highestHigh - lowestLow;
    
    const williamsR = range === 0 ? -50 : ((highestHigh - bars[i].c) / range) * -100;
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      value: williamsR,
    });
  }
  
  return result;
}

/**
 * Commodity Channel Index (CCI)
 * CCI = (Typical Price - SMA) / (0.015 * Mean Deviation)
 */
export function calculateCCI(
  bars: CompressedBar[],
  period: number = 20
): IndicatorPoint[] {
  if (bars.length < period) return [];
  
  const result: IndicatorPoint[] = [];
  const typicalPrices = bars.map(b => (b.h + b.l + b.c) / 3);
  
  for (let i = period - 1; i < bars.length; i++) {
    const slice = typicalPrices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    
    // Mean deviation
    const meanDeviation = slice.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
    
    const cci = meanDeviation === 0 ? 0 : (typicalPrices[i] - sma) / (0.015 * meanDeviation);
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      value: cci,
    });
  }
  
  return result;
}

export interface ADXPoint {
  time: number;
  adx: number;
  plusDI: number;
  minusDI: number;
}

/**
 * Average Directional Index (ADX)
 * Measures trend strength regardless of direction
 * ADX > 25 indicates strong trend, < 20 indicates weak/no trend
 */
export function calculateADX(
  bars: CompressedBar[],
  period: number = 14
): ADXPoint[] {
  if (bars.length < period * 2) return [];
  
  const trueRanges: number[] = [];
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];
  
  // Calculate True Range, +DM, -DM
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].h;
    const low = bars[i].l;
    const prevClose = bars[i - 1].c;
    const prevHigh = bars[i - 1].h;
    const prevLow = bars[i - 1].l;
    
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
    
    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  
  // Smooth the values using Wilder's smoothing
  const smoothedTR: number[] = [];
  const smoothedPlusDM: number[] = [];
  const smoothedMinusDM: number[] = [];
  
  // First smoothed value is sum of first 'period' values
  let sumTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
  let sumPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let sumMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  
  smoothedTR.push(sumTR);
  smoothedPlusDM.push(sumPlusDM);
  smoothedMinusDM.push(sumMinusDM);
  
  // Subsequent values use Wilder's smoothing
  for (let i = period; i < trueRanges.length; i++) {
    sumTR = sumTR - (sumTR / period) + trueRanges[i];
    sumPlusDM = sumPlusDM - (sumPlusDM / period) + plusDMs[i];
    sumMinusDM = sumMinusDM - (sumMinusDM / period) + minusDMs[i];
    
    smoothedTR.push(sumTR);
    smoothedPlusDM.push(sumPlusDM);
    smoothedMinusDM.push(sumMinusDM);
  }
  
  // Calculate +DI, -DI, DX
  const dxValues: number[] = [];
  const plusDIValues: number[] = [];
  const minusDIValues: number[] = [];
  
  for (let i = 0; i < smoothedTR.length; i++) {
    const plusDI = smoothedTR[i] === 0 ? 0 : (smoothedPlusDM[i] / smoothedTR[i]) * 100;
    const minusDI = smoothedTR[i] === 0 ? 0 : (smoothedMinusDM[i] / smoothedTR[i]) * 100;
    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
    
    plusDIValues.push(plusDI);
    minusDIValues.push(minusDI);
    dxValues.push(dx);
  }
  
  // Calculate ADX (smoothed DX)
  const result: ADXPoint[] = [];
  
  if (dxValues.length < period) return [];
  
  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period - 1; i < dxValues.length; i++) {
    if (i > period - 1) {
      adx = ((adx * (period - 1)) + dxValues[i]) / period;
    }
    
    const barIndex = i + period; // Offset to match original bar index
    if (barIndex < bars.length) {
      result.push({
        time: Math.floor(new Date(bars[barIndex].t).getTime() / 1000),
        adx,
        plusDI: plusDIValues[i],
        minusDI: minusDIValues[i],
      });
    }
  }
  
  return result;
}

/**
 * Average True Range (ATR)
 * Measures market volatility
 */
export function calculateATR(
  bars: CompressedBar[],
  period: number = 14
): IndicatorPoint[] {
  if (bars.length < period + 1) return [];
  
  const trueRanges: number[] = [];
  
  // Calculate True Range for each bar
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].h;
    const low = bars[i].l;
    const prevClose = bars[i - 1].c;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  // Calculate ATR using Wilder's smoothing
  const result: IndicatorPoint[] = [];
  
  // First ATR is simple average
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push({
    time: Math.floor(new Date(bars[period].t).getTime() / 1000),
    value: atr,
  });
  
  // Subsequent values use smoothing
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
    result.push({
      time: Math.floor(new Date(bars[i + 1].t).getTime() / 1000),
      value: atr,
    });
  }
  
  return result;
}

/**
 * On-Balance Volume (OBV)
 * Cumulative volume based on price direction
 */
export function calculateOBV(bars: CompressedBar[]): IndicatorPoint[] {
  if (bars.length < 2) return [];
  
  const result: IndicatorPoint[] = [];
  let obv = 0;
  
  result.push({
    time: Math.floor(new Date(bars[0].t).getTime() / 1000),
    value: obv,
  });
  
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].c > bars[i - 1].c) {
      obv += bars[i].v || 0;
    } else if (bars[i].c < bars[i - 1].c) {
      obv -= bars[i].v || 0;
    }
    // If close equals previous close, OBV stays the same
    
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      value: obv,
    });
  }
  
  return result;
}

/**
 * Money Flow Index (MFI)
 * Volume-weighted RSI - measures buying/selling pressure
 */
export function calculateMFI(
  bars: CompressedBar[],
  period: number = 14
): IndicatorPoint[] {
  if (bars.length < period + 1) return [];
  
  const typicalPrices = bars.map(b => (b.h + b.l + b.c) / 3);
  const rawMoneyFlows = typicalPrices.map((tp, i) => tp * (bars[i].v || 0));
  
  const result: IndicatorPoint[] = [];
  
  for (let i = period; i < bars.length; i++) {
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let j = i - period + 1; j <= i; j++) {
      if (typicalPrices[j] > typicalPrices[j - 1]) {
        positiveFlow += rawMoneyFlows[j];
      } else if (typicalPrices[j] < typicalPrices[j - 1]) {
        negativeFlow += rawMoneyFlows[j];
      }
    }
    
    const moneyRatio = negativeFlow === 0 ? 100 : positiveFlow / negativeFlow;
    const mfi = negativeFlow === 0 ? 100 : 100 - (100 / (1 + moneyRatio));
    
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      value: mfi,
    });
  }
  
  return result;
}

/**
 * Rate of Change (ROC)
 * Percentage change from n periods ago
 */
export function calculateROC(
  bars: CompressedBar[],
  period: number = 12
): IndicatorPoint[] {
  if (bars.length <= period) return [];
  
  const result: IndicatorPoint[] = [];
  
  for (let i = period; i < bars.length; i++) {
    const prevClose = bars[i - period].c;
    const roc = prevClose === 0 ? 0 : ((bars[i].c - prevClose) / prevClose) * 100;
    
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      value: roc,
    });
  }
  
  return result;
}

export interface ParabolicSARPoint {
  time: number;
  sar: number;
  isUptrend: boolean;
}

/**
 * Parabolic SAR
 * Stop and Reverse indicator for trend following
 */
export function calculateParabolicSAR(
  bars: CompressedBar[],
  accelerationFactor: number = 0.02,
  maxAcceleration: number = 0.2
): ParabolicSARPoint[] {
  if (bars.length < 2) return [];
  
  const result: ParabolicSARPoint[] = [];
  
  let isUptrend = bars[1].c > bars[0].c;
  let sar = isUptrend ? bars[0].l : bars[0].h;
  let ep = isUptrend ? bars[1].h : bars[1].l; // Extreme Point
  let af = accelerationFactor;
  
  result.push({
    time: Math.floor(new Date(bars[0].t).getTime() / 1000),
    sar,
    isUptrend,
  });
  
  for (let i = 1; i < bars.length; i++) {
    const prevSAR = sar;
    
    // Calculate new SAR
    sar = prevSAR + af * (ep - prevSAR);
    
    // Adjust SAR based on prior bars' highs/lows
    if (isUptrend) {
      sar = Math.min(sar, bars[i - 1].l, i > 1 ? bars[i - 2].l : bars[i - 1].l);
    } else {
      sar = Math.max(sar, bars[i - 1].h, i > 1 ? bars[i - 2].h : bars[i - 1].h);
    }
    
    // Check for reversal
    let reversed = false;
    if (isUptrend && bars[i].l < sar) {
      isUptrend = false;
      sar = ep;
      ep = bars[i].l;
      af = accelerationFactor;
      reversed = true;
    } else if (!isUptrend && bars[i].h > sar) {
      isUptrend = true;
      sar = ep;
      ep = bars[i].h;
      af = accelerationFactor;
      reversed = true;
    }
    
    if (!reversed) {
      // Update extreme point and acceleration factor
      if (isUptrend) {
        if (bars[i].h > ep) {
          ep = bars[i].h;
          af = Math.min(af + accelerationFactor, maxAcceleration);
        }
      } else {
        if (bars[i].l < ep) {
          ep = bars[i].l;
          af = Math.min(af + accelerationFactor, maxAcceleration);
        }
      }
    }
    
    result.push({
      time: Math.floor(new Date(bars[i].t).getTime() / 1000),
      sar,
      isUptrend,
    });
  }
  
  return result;
}

export interface PivotPointsData {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

/**
 * Pivot Points (Standard/Floor Trader)
 * Calculates daily support/resistance levels
 */
export function calculatePivotPoints(
  high: number,
  low: number,
  close: number
): PivotPointsData {
  const pivot = (high + low + close) / 3;
  const range = high - low;
  
  return {
    pivot,
    r1: (2 * pivot) - low,
    r2: pivot + range,
    r3: pivot + (2 * range),
    s1: (2 * pivot) - high,
    s2: pivot - range,
    s3: pivot - (2 * range),
  };
}

/**
 * Generate synthetic demonstration OHLCV data for indicator visualization
 * Creates realistic-looking price data with natural price movements
 */
export function generateDemoBars(count: number = 200): CompressedBar[] {
  const bars: CompressedBar[] = [];
  let price = 150 + Math.random() * 50; // Start between 150-200
  const baseVolume = 1000000 + Math.random() * 500000;
  
  // Create some trending phases
  let trend = Math.random() > 0.5 ? 1 : -1;
  let trendStrength = 0.1 + Math.random() * 0.2;
  let trendDuration = Math.floor(20 + Math.random() * 30);
  let barsInTrend = 0;
  
  for (let i = 0; i < count; i++) {
    // Change trend occasionally
    barsInTrend++;
    if (barsInTrend > trendDuration) {
      trend = Math.random() > 0.5 ? 1 : -1;
      trendStrength = 0.1 + Math.random() * 0.2;
      trendDuration = Math.floor(20 + Math.random() * 30);
      barsInTrend = 0;
    }
    
    // Daily movement with trend bias
    const volatility = price * 0.02; // 2% typical daily volatility
    const trendMove = trend * trendStrength * volatility * (0.5 + Math.random());
    const randomMove = (Math.random() - 0.5) * volatility * 2;
    
    const open = price;
    const change = trendMove + randomMove;
    const close = Math.max(1, price + change);
    
    // High and low with realistic wicks
    const wickSize = volatility * (0.5 + Math.random());
    const high = Math.max(open, close) + wickSize * Math.random();
    const low = Math.min(open, close) - wickSize * Math.random();
    
    // Volume varies inversely with stability
    const volumeMultiplier = 0.5 + Math.random() + Math.abs(change) / volatility * 0.5;
    const volume = Math.floor(baseVolume * volumeMultiplier);
    
    const date = new Date();
    date.setDate(date.getDate() - (count - i));
    
    bars.push({
      t: date.toISOString(),
      o: Number(open.toFixed(2)),
      h: Number(high.toFixed(2)),
      l: Number(Math.max(0.01, low).toFixed(2)),
      c: Number(close.toFixed(2)),
      v: volume,
    });
    
    price = close;
  }
  
  return bars;
}
