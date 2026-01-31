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
