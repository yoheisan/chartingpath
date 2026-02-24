import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// TECHNICAL INDICATOR CALCULATIONS
// Pure TypeScript implementations for Deno
// ============================================

interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
}

interface IndicatorPoint {
  time: number;
  value: number;
}

interface MACDPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

interface BollingerPoint {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

// Simple Moving Average
function calculateSMA(closes: number[], period: number): number[] {
  if (closes.length < period) return [];
  const result: number[] = [];
  for (let i = period - 1; i < closes.length; i++) {
    const sum = closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }
  return result;
}

// Exponential Moving Average
function calculateEMA(closes: number[], period: number): number[] {
  if (closes.length < period) return [];
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  return result;
}

// RSI
function calculateRSI(closes: number[], period: number = 14): number[] {
  if (closes.length < period + 1) return [];
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const result: number[] = [];
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push(100 - (100 / (1 + rs)));
  
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    result.push(rsi);
  }
  
  return result;
}

// MACD
function calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9): MACDPoint[] {
  if (closes.length < slow + signal) return [];
  
  const fastEMA = calculateEMA(closes, fast);
  const slowEMA = calculateEMA(closes, slow);
  
  // Align EMAs
  const offset = slow - fast;
  const macdLine: number[] = [];
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }
  
  // Signal line (EMA of MACD)
  const signalLine = calculateEMA(macdLine, signal);
  
  const result: MACDPoint[] = [];
  const signalOffset = macdLine.length - signalLine.length;
  
  for (let i = 0; i < signalLine.length; i++) {
    const macd = macdLine[i + signalOffset];
    const sig = signalLine[i];
    result.push({
      time: i,
      macd,
      signal: sig,
      histogram: macd - sig
    });
  }
  
  return result;
}

// Bollinger Bands
function calculateBollingerBands(closes: number[], period = 20, stdDev = 2): BollingerPoint[] {
  if (closes.length < period) return [];
  
  const result: BollingerPoint[] = [];
  
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = slice.map(c => Math.pow(c - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(variance);
    
    result.push({
      time: i,
      upper: sma + stdDev * std,
      middle: sma,
      lower: sma - stdDev * std
    });
  }
  
  return result;
}

// ATR
function calculateATR(bars: Bar[], period = 14): number[] {
  if (bars.length < period + 1) return [];
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < bars.length; i++) {
    const tr = Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - bars[i - 1].c),
      Math.abs(bars[i].l - bars[i - 1].c)
    );
    trueRanges.push(tr);
  }
  
  const result: number[] = [];
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(atr);
  
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
    result.push(atr);
  }
  
  return result;
}

// ADX
function calculateADX(bars: Bar[], period = 14): { adx: number; plusDI: number; minusDI: number } | null {
  if (bars.length < period * 2 + 1) return null;
  
  const plusDMs: number[] = [];
  const minusDMs: number[] = [];
  const trueRanges: number[] = [];
  
  for (let i = 1; i < bars.length; i++) {
    const upMove = bars[i].h - bars[i - 1].h;
    const downMove = bars[i - 1].l - bars[i].l;
    plusDMs.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDMs.push(downMove > upMove && downMove > 0 ? downMove : 0);
    
    const tr = Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - bars[i - 1].c),
      Math.abs(bars[i].l - bars[i - 1].c)
    );
    trueRanges.push(tr);
  }
  
  // Wilder's smoothing
  let smoothedTR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedPlusDM = plusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothedMinusDM = minusDMs.slice(0, period).reduce((a, b) => a + b, 0);
  
  const dxValues: number[] = [];
  
  for (let i = period; i < trueRanges.length; i++) {
    smoothedTR = smoothedTR - (smoothedTR / period) + trueRanges[i];
    smoothedPlusDM = smoothedPlusDM - (smoothedPlusDM / period) + plusDMs[i];
    smoothedMinusDM = smoothedMinusDM - (smoothedMinusDM / period) + minusDMs[i];
    
    const plusDI = smoothedTR === 0 ? 0 : (smoothedPlusDM / smoothedTR) * 100;
    const minusDI = smoothedTR === 0 ? 0 : (smoothedMinusDM / smoothedTR) * 100;
    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
    dxValues.push(dx);
  }
  
  if (dxValues.length < period) return null;
  
  let adx = dxValues.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < dxValues.length; i++) {
    adx = ((adx * (period - 1)) + dxValues[i]) / period;
  }
  
  const lastPlusDI = smoothedTR === 0 ? 0 : (smoothedPlusDM / smoothedTR) * 100;
  const lastMinusDI = smoothedTR === 0 ? 0 : (smoothedMinusDM / smoothedTR) * 100;
  
  return { adx, plusDI: lastPlusDI, minusDI: lastMinusDI };
}

// On-Balance Volume (OBV)
function calculateOBV(bars: Bar[]): number[] {
  const result: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    const vol = bars[i].v || 0;
    if (bars[i].c > bars[i - 1].c) result.push(result[result.length - 1] + vol);
    else if (bars[i].c < bars[i - 1].c) result.push(result[result.length - 1] - vol);
    else result.push(result[result.length - 1]);
  }
  return result;
}

// Volume Analysis (enhanced with OBV divergence)
function analyzeVolume(bars: Bar[]): { avgVolume: number; lastVolume: number; volumeRatio: number; volumeTrend: string; obvDivergence: string } {
  if (bars.length < 20) {
    return { avgVolume: 0, lastVolume: 0, volumeRatio: 1, volumeTrend: 'unknown', obvDivergence: 'none' };
  }
  
  const volumes = bars.map(b => b.v || 0).filter(v => v > 0);
  if (volumes.length === 0) {
    return { avgVolume: 0, lastVolume: 0, volumeRatio: 1, volumeTrend: 'unknown', obvDivergence: 'none' };
  }
  
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const lastVolume = volumes[volumes.length - 1];
  const volumeRatio = avgVolume > 0 ? lastVolume / avgVolume : 1;
  
  const recentAvg = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const volumeTrend = recentAvg > avgVolume * 1.2 ? 'increasing' : 
                      recentAvg < avgVolume * 0.8 ? 'decreasing' : 'stable';

  // OBV divergence: price making new highs but OBV isn't (or vice versa)
  let obvDivergence = 'none';
  if (bars.length >= 20) {
    const obv = calculateOBV(bars);
    const recentBars = bars.slice(-20);
    const recentOBV = obv.slice(-20);
    const midpoint = 10;
    
    const priceHigherHigh = Math.max(...recentBars.slice(midpoint).map(b => b.h)) > Math.max(...recentBars.slice(0, midpoint).map(b => b.h));
    const obvHigherHigh = Math.max(...recentOBV.slice(midpoint)) > Math.max(...recentOBV.slice(0, midpoint));
    const priceLowerLow = Math.min(...recentBars.slice(midpoint).map(b => b.l)) < Math.min(...recentBars.slice(0, midpoint).map(b => b.l));
    const obvLowerLow = Math.min(...recentOBV.slice(midpoint)) < Math.min(...recentOBV.slice(0, midpoint));
    
    if (priceHigherHigh && !obvHigherHigh) obvDivergence = 'bearish';
    else if (priceLowerLow && !obvLowerLow) obvDivergence = 'bullish';
  }
  
  return { avgVolume, lastVolume, volumeRatio, volumeTrend, obvDivergence };
}

// Price momentum and trend analysis
function analyzePriceTrend(bars: Bar[]): {
  priceChange: number;
  priceChangePercent: number;
  trend: string;
  trendStrength: string;
  support: number;
  resistance: number;
} {
  if (bars.length < 20) {
    return { priceChange: 0, priceChangePercent: 0, trend: 'unknown', trendStrength: 'weak', support: 0, resistance: 0 };
  }
  
  const closes = bars.map(b => b.c);
  const highs = bars.map(b => b.h);
  const lows = bars.map(b => b.l);
  
  const firstClose = closes[0];
  const lastClose = closes[closes.length - 1];
  const priceChange = lastClose - firstClose;
  const priceChangePercent = (priceChange / firstClose) * 100;
  
  // Simple trend detection using EMA
  const ema20 = calculateEMA(closes, Math.min(20, Math.floor(closes.length / 2)));
  const ema50 = calculateEMA(closes, Math.min(50, Math.floor(closes.length / 2)));
  
  let trend = 'sideways';
  if (ema20.length > 0 && ema50.length > 0) {
    const lastEma20 = ema20[ema20.length - 1];
    const lastEma50 = ema50[ema50.length - 1];
    if (lastClose > lastEma20 && lastEma20 > lastEma50) {
      trend = 'bullish';
    } else if (lastClose < lastEma20 && lastEma20 < lastEma50) {
      trend = 'bearish';
    }
  }
  
  // Trend strength based on price distance from EMAs
  const trendStrength = Math.abs(priceChangePercent) > 10 ? 'strong' :
                        Math.abs(priceChangePercent) > 5 ? 'moderate' : 'weak';
  
  // Pivot-cluster Support/Resistance: find swing lows/highs and cluster them
  const lookback = Math.min(bars.length, 60);
  const recentBars = bars.slice(-lookback);
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];
  const radius = Math.max(2, Math.floor(lookback / 15));
  
  for (let i = radius; i < recentBars.length - radius; i++) {
    let isHigh = true, isLow = true;
    for (let j = 1; j <= radius; j++) {
      if (recentBars[i].h <= recentBars[i - j].h || recentBars[i].h <= recentBars[i + j].h) isHigh = false;
      if (recentBars[i].l >= recentBars[i - j].l || recentBars[i].l >= recentBars[i + j].l) isLow = false;
    }
    if (isHigh) pivotHighs.push(recentBars[i].h);
    if (isLow) pivotLows.push(recentBars[i].l);
  }
  
  // Cluster pivots: group levels within 0.5% of each other, take the strongest
  function clusterLevels(levels: number[]): number {
    if (levels.length === 0) return 0;
    const threshold = lastClose * 0.005;
    const sorted = [...levels].sort((a, b) => a - b);
    let bestCluster: number[] = [sorted[0]];
    let currentCluster: number[] = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] < threshold) {
        currentCluster.push(sorted[i]);
      } else {
        if (currentCluster.length > bestCluster.length) bestCluster = currentCluster;
        currentCluster = [sorted[i]];
      }
    }
    if (currentCluster.length > bestCluster.length) bestCluster = currentCluster;
    return bestCluster.reduce((a, b) => a + b, 0) / bestCluster.length;
  }
  
  const support = pivotLows.length > 0 ? clusterLevels(pivotLows) : Math.min(...lows.slice(-20));
  const resistance = pivotHighs.length > 0 ? clusterLevels(pivotHighs) : Math.max(...highs.slice(-20));
  
  return { priceChange, priceChangePercent, trend, trendStrength, support, resistance };
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

interface ChartContext {
  symbol: string;
  timeframe: string;
  bars: Bar[];
  selectedRange?: { start: number; end: number };
}

interface AnalysisResult {
  symbol: string;
  timeframe: string;
  barCount: number;
  priceAnalysis: ReturnType<typeof analyzePriceTrend>;
  volumeAnalysis: ReturnType<typeof analyzeVolume>;
  indicators: {
    rsi: { current: number; interpretation: string };
    macd: { macd: number; signal: number; histogram: number; interpretation: string };
    bollingerBands: { upper: number; middle: number; lower: number; position: string };
    atr: { value: number; volatilityLevel: string };
    adx?: { adx: number; plusDI: number; minusDI: number; interpretation: string };
    ema20: number;
    ema50: number;
    sma200?: number;
  };
  patterns: any[];
  marketBreadth?: any;
  higherTimeframeContext?: any;
  tradingScenarios: {
    bullish: { probability: string; entry: number; stopLoss: number; takeProfit: number; riskReward: number };
    bearish: { probability: string; entry: number; stopLoss: number; takeProfit: number; riskReward: number };
    neutral: { description: string };
  };
  riskAssessment: {
    overallRisk: string;
    volatilityRisk: string;
    trendRisk: string;
    keyLevels: { level: number; type: string }[];
  };
  summary: string;
}

function generateAnalysis(bars: Bar[], symbol: string, timeframe: string): AnalysisResult {
  const closes = bars.map(b => b.c);
  const lastClose = closes[closes.length - 1];
  const lastBar = bars[bars.length - 1];
  
  // Calculate all indicators
  const priceAnalysis = analyzePriceTrend(bars);
  const volumeAnalysis = analyzeVolume(bars);
  
  // RSI
  const rsiValues = calculateRSI(closes);
  const currentRSI = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;
  const rsiInterpretation = currentRSI > 70 ? 'overbought' : currentRSI < 30 ? 'oversold' : 'neutral';
  
  // RSI Divergence detection
  let rsiDivergence = 'none';
  if (rsiValues.length >= 20) {
    const recentRSI = rsiValues.slice(-20);
    const recentCloses = closes.slice(-20);
    const mid = 10;
    const priceHH = Math.max(...recentCloses.slice(mid)) > Math.max(...recentCloses.slice(0, mid));
    const rsiHH = Math.max(...recentRSI.slice(mid)) > Math.max(...recentRSI.slice(0, mid));
    const priceLL = Math.min(...recentCloses.slice(mid)) < Math.min(...recentCloses.slice(0, mid));
    const rsiLL = Math.min(...recentRSI.slice(mid)) < Math.min(...recentRSI.slice(0, mid));
    if (priceHH && !rsiHH) rsiDivergence = 'bearish';
    else if (priceLL && !rsiLL) rsiDivergence = 'bullish';
  }
  
  // MACD
  const macdData = calculateMACD(closes);
  const lastMACD = macdData.length > 0 ? macdData[macdData.length - 1] : { macd: 0, signal: 0, histogram: 0 };
  const macdInterpretation = lastMACD.histogram > 0 ? 'bullish momentum' : 'bearish momentum';
  
  // MACD Divergence detection
  let macdDivergence = 'none';
  if (macdData.length >= 20) {
    const recentMACD = macdData.slice(-20);
    const recentCloses2 = closes.slice(-20);
    const mid = 10;
    const priceHH2 = Math.max(...recentCloses2.slice(mid)) > Math.max(...recentCloses2.slice(0, mid));
    const macdHH = Math.max(...recentMACD.slice(mid).map(m => m.macd)) > Math.max(...recentMACD.slice(0, mid).map(m => m.macd));
    const priceLL2 = Math.min(...recentCloses2.slice(mid)) < Math.min(...recentCloses2.slice(0, mid));
    const macdLL = Math.min(...recentMACD.slice(mid).map(m => m.macd)) < Math.min(...recentMACD.slice(0, mid).map(m => m.macd));
    if (priceHH2 && !macdHH) macdDivergence = 'bearish';
    else if (priceLL2 && !macdLL) macdDivergence = 'bullish';
  }
  
  // Bollinger Bands
  const bbData = calculateBollingerBands(closes);
  const lastBB = bbData.length > 0 ? bbData[bbData.length - 1] : { upper: lastClose * 1.02, middle: lastClose, lower: lastClose * 0.98 };
  const bbRange = lastBB.upper - lastBB.lower;
  const bbPosition = lastClose > lastBB.upper ? 'above upper band' :
                     lastClose < lastBB.lower ? 'below lower band' :
                     lastClose > lastBB.middle ? 'upper half' : 'lower half';
  
  // ATR
  const atrValues = calculateATR(bars);
  const currentATR = atrValues.length > 0 ? atrValues[atrValues.length - 1] : lastClose * 0.02;
  const atrPercent = (currentATR / lastClose) * 100;
  const volatilityLevel = atrPercent > 5 ? 'high' : atrPercent > 2 ? 'moderate' : 'low';
  
  // ADX
  const adxData = calculateADX(bars);
  const adxInterpretation = adxData 
    ? (adxData.adx > 40 ? 'very strong trend' : adxData.adx > 25 ? 'strong trend' : adxData.adx > 15 ? 'weak trend' : 'no trend')
    : 'insufficient data';
  
  // EMAs
  const ema20 = calculateEMA(closes, 20);
  const ema50 = calculateEMA(closes, 50);
  const sma200 = calculateSMA(closes, Math.min(200, closes.length));
  
  // Generate trading scenarios
  const bullishEntry = priceAnalysis.support + currentATR * 0.5;
  const bullishSL = priceAnalysis.support - currentATR;
  const bullishTP = bullishEntry + (bullishEntry - bullishSL) * 2;
  
  const bearishEntry = priceAnalysis.resistance - currentATR * 0.5;
  const bearishSL = priceAnalysis.resistance + currentATR;
  const bearishTP = bearishEntry - (bearishSL - bearishEntry) * 2;
  
  // Weighted confluence scoring (professional multi-factor model)
  // Weights: Trend=3, ADX=2, RSI=1.5, MACD=1.5, BB=1, Divergences=2, OBV=1.5, SMA200=1.5
  let bullishScore = 0;
  let bearishScore = 0;
  const maxScore = 14; // sum of all weights
  
  // Trend alignment (weight: 3)
  if (priceAnalysis.trend === 'bullish') bullishScore += 3;
  else if (priceAnalysis.trend === 'bearish') bearishScore += 3;
  
  // ADX directional (weight: 2)
  if (adxData) {
    const adxWeight = adxData.adx > 25 ? 2 : 1; // stronger signal when trend is confirmed
    if (adxData.plusDI > adxData.minusDI) bullishScore += adxWeight;
    else bearishScore += adxWeight;
  }
  
  // RSI (weight: 1.5)
  if (currentRSI < 35) bullishScore += 1.5;
  else if (currentRSI > 65) bearishScore += 1.5;
  else if (currentRSI < 45) bullishScore += 0.5;
  else if (currentRSI > 55) bearishScore += 0.5;
  
  // MACD (weight: 1.5)
  if (lastMACD.histogram > 0) bullishScore += 1.5;
  else bearishScore += 1.5;
  
  // Bollinger position (weight: 1)
  if (lastClose < lastBB.lower) bullishScore += 1; // mean reversion
  else if (lastClose > lastBB.upper) bearishScore += 1;
  
  // Divergences (weight: 2 each, strongest contrarian signal)
  if (rsiDivergence === 'bullish') bullishScore += 2;
  else if (rsiDivergence === 'bearish') bearishScore += 2;
  if (macdDivergence === 'bullish') bullishScore += 2;
  else if (macdDivergence === 'bearish') bearishScore += 2;
  
  // OBV divergence (weight: 1.5)
  if (volumeAnalysis.obvDivergence === 'bullish') bullishScore += 1.5;
  else if (volumeAnalysis.obvDivergence === 'bearish') bearishScore += 1.5;
  
  // SMA200 position (weight: 1.5)
  if (sma200.length > 0) {
    if (lastClose > sma200[sma200.length - 1]) bullishScore += 1.5;
    else bearishScore += 1.5;
  }
  
  // Convert to probability labels
  const totalScore = bullishScore + bearishScore;
  const bullishPct = totalScore > 0 ? (bullishScore / totalScore) * 100 : 50;
  const bearishPct = totalScore > 0 ? (bearishScore / totalScore) * 100 : 50;
  
  const toProbLabel = (pct: number) => pct >= 75 ? 'high' : pct >= 60 ? 'moderate-high' : pct >= 45 ? 'moderate' : 'low';
  const bullishProbability = toProbLabel(bullishPct);
  const bearishProbability = toProbLabel(bearishPct);
  
  // Risk assessment (enhanced)
  const hasDivergence = rsiDivergence !== 'none' || macdDivergence !== 'none' || volumeAnalysis.obvDivergence !== 'none';
  const overallRisk = volatilityLevel === 'high' ? 'high' : 
                      hasDivergence ? 'elevated' :
                      priceAnalysis.trendStrength === 'weak' ? 'moderate' : 'moderate-low';
  
  // Generate summary
  const summaryParts: string[] = [];
  summaryParts.push(`${symbol} on ${timeframe} timeframe shows ${priceAnalysis.trend} trend with ${priceAnalysis.trendStrength} strength.`);
  summaryParts.push(`Price is ${priceAnalysis.priceChangePercent >= 0 ? 'up' : 'down'} ${Math.abs(priceAnalysis.priceChangePercent).toFixed(2)}% over the selected period.`);
  summaryParts.push(`RSI at ${currentRSI.toFixed(1)} indicates ${rsiInterpretation} conditions.`);
  summaryParts.push(`MACD shows ${macdInterpretation}.`);
  if (rsiDivergence !== 'none') summaryParts.push(`⚠️ RSI ${rsiDivergence} divergence detected — potential reversal signal.`);
  if (macdDivergence !== 'none') summaryParts.push(`⚠️ MACD ${macdDivergence} divergence detected.`);
  if (volumeAnalysis.obvDivergence !== 'none') summaryParts.push(`⚠️ OBV ${volumeAnalysis.obvDivergence} divergence — volume not confirming price.`);
  summaryParts.push(`Volatility is ${volatilityLevel} with ATR at ${atrPercent.toFixed(2)}% of price.`);
  if (adxData) {
    summaryParts.push(`ADX at ${adxData.adx.toFixed(1)} suggests ${adxInterpretation}.`);
  }
  summaryParts.push(`Confluence score: Bullish ${bullishPct.toFixed(0)}% vs Bearish ${bearishPct.toFixed(0)}%.`);
  
  return {
    symbol,
    timeframe,
    barCount: bars.length,
    priceAnalysis,
    volumeAnalysis,
    indicators: {
      rsi: { current: currentRSI, interpretation: rsiInterpretation, divergence: rsiDivergence },
      macd: { ...lastMACD, interpretation: macdInterpretation, divergence: macdDivergence },
      bollingerBands: { ...lastBB, position: bbPosition },
      atr: { value: currentATR, volatilityLevel },
      adx: adxData ? { ...adxData, interpretation: adxInterpretation } : undefined,
      ema20: ema20.length > 0 ? ema20[ema20.length - 1] : lastClose,
      ema50: ema50.length > 0 ? ema50[ema50.length - 1] : lastClose,
      sma200: sma200.length > 0 ? sma200[sma200.length - 1] : undefined
    },
    patterns: [],
    tradingScenarios: {
      bullish: {
        probability: bullishProbability,
        entry: Math.round(bullishEntry * 100) / 100,
        stopLoss: Math.round(bullishSL * 100) / 100,
        takeProfit: Math.round(bullishTP * 100) / 100,
        riskReward: 2
      },
      bearish: {
        probability: bearishProbability,
        entry: Math.round(bearishEntry * 100) / 100,
        stopLoss: Math.round(bearishSL * 100) / 100,
        takeProfit: Math.round(bearishTP * 100) / 100,
        riskReward: 2
      },
      neutral: {
        description: priceAnalysis.trend === 'sideways' 
          ? 'Price is ranging. Consider range-bound strategies or wait for breakout.'
          : 'Current trend may continue. Trade in direction of trend with proper risk management.'
      }
    },
    confluence: {
      bullishPct: Math.round(bullishPct),
      bearishPct: Math.round(bearishPct),
      bullishScore,
      bearishScore,
      totalScore
    },
    divergences: {
      rsi: rsiDivergence,
      macd: macdDivergence,
      obv: volumeAnalysis.obvDivergence
    },
    riskAssessment: {
      overallRisk,
      volatilityRisk: volatilityLevel,
      trendRisk: priceAnalysis.trendStrength === 'weak' ? 'high' : 'moderate',
      keyLevels: [
        { level: priceAnalysis.support, type: 'support' },
        { level: priceAnalysis.resistance, type: 'resistance' },
        { level: ema50.length > 0 ? ema50[ema50.length - 1] : lastClose, type: 'ema50' }
      ]
    },
    summary: summaryParts.join(' ')
  };
}

// ============================================
// HTTP HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, timeframe, bars, higherTimeframe } = await req.json();

    if (!symbol || !bars || !Array.isArray(bars) || bars.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: symbol, bars" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate main analysis
    const analysis = generateAnalysis(bars, symbol, timeframe || '1d');

    // Fetch active patterns for this symbol
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: patterns } = await supabase
      .from('live_pattern_detections')
      .select('pattern_name, direction, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, timeframe')
      .eq('instrument', symbol.toUpperCase())
      .eq('status', 'active')
      .limit(5);

    if (patterns && patterns.length > 0) {
      analysis.patterns = patterns.map(p => ({
        name: p.pattern_name,
        direction: p.direction,
        quality: p.quality_score,
        entry: p.entry_price,
        stopLoss: p.stop_loss_price,
        takeProfit: p.take_profit_price,
        rr: p.risk_reward_ratio,
        timeframe: p.timeframe
      }));
    }

    // Fetch market breadth if available
    try {
      const { data: breadthData } = await supabase
        .from('cached_market_reports')
        .select('report')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (breadthData) {
        analysis.marketBreadth = { available: true };
      }
    } catch {
      // Market breadth not critical
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-chart-context] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
