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

// Volume Analysis
function analyzeVolume(bars: Bar[]): { avgVolume: number; lastVolume: number; volumeRatio: number; volumeTrend: string } {
  if (bars.length < 20) {
    return { avgVolume: 0, lastVolume: 0, volumeRatio: 1, volumeTrend: 'unknown' };
  }
  
  const volumes = bars.map(b => b.v || 0).filter(v => v > 0);
  if (volumes.length === 0) {
    return { avgVolume: 0, lastVolume: 0, volumeRatio: 1, volumeTrend: 'unknown' };
  }
  
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const lastVolume = volumes[volumes.length - 1];
  const volumeRatio = avgVolume > 0 ? lastVolume / avgVolume : 1;
  
  // Trend: compare recent 5 bars avg vs overall avg
  const recentAvg = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const volumeTrend = recentAvg > avgVolume * 1.2 ? 'increasing' : 
                      recentAvg < avgVolume * 0.8 ? 'decreasing' : 'stable';
  
  return { avgVolume, lastVolume, volumeRatio, volumeTrend };
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
  
  // Support and resistance (recent swing highs/lows)
  const support = Math.min(...lows.slice(-20));
  const resistance = Math.max(...highs.slice(-20));
  
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
  
  // MACD
  const macdData = calculateMACD(closes);
  const lastMACD = macdData.length > 0 ? macdData[macdData.length - 1] : { macd: 0, signal: 0, histogram: 0 };
  const macdInterpretation = lastMACD.histogram > 0 ? 'bullish momentum' : 'bearish momentum';
  
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
  
  // Probability based on indicators alignment
  let bullishScore = 0;
  let bearishScore = 0;
  
  if (priceAnalysis.trend === 'bullish') bullishScore += 2;
  if (priceAnalysis.trend === 'bearish') bearishScore += 2;
  if (currentRSI < 40) bullishScore += 1;
  if (currentRSI > 60) bearishScore += 1;
  if (lastMACD.histogram > 0) bullishScore += 1;
  if (lastMACD.histogram < 0) bearishScore += 1;
  if (lastClose < lastBB.middle) bullishScore += 1;
  if (lastClose > lastBB.middle) bearishScore += 1;
  if (adxData && adxData.plusDI > adxData.minusDI) bullishScore += 1;
  if (adxData && adxData.minusDI > adxData.plusDI) bearishScore += 1;
  
  const bullishProbability = bullishScore > bearishScore ? 'moderate-high' : bullishScore === bearishScore ? 'low' : 'low';
  const bearishProbability = bearishScore > bullishScore ? 'moderate-high' : bearishScore === bullishScore ? 'low' : 'low';
  
  // Risk assessment
  const overallRisk = volatilityLevel === 'high' ? 'high' : 
                      priceAnalysis.trendStrength === 'weak' ? 'moderate' : 'moderate-low';
  
  // Generate summary
  const summaryParts: string[] = [];
  summaryParts.push(`${symbol} on ${timeframe} timeframe shows ${priceAnalysis.trend} trend with ${priceAnalysis.trendStrength} strength.`);
  summaryParts.push(`Price is ${priceAnalysis.priceChangePercent >= 0 ? 'up' : 'down'} ${Math.abs(priceAnalysis.priceChangePercent).toFixed(2)}% over the selected period.`);
  summaryParts.push(`RSI at ${currentRSI.toFixed(1)} indicates ${rsiInterpretation} conditions.`);
  summaryParts.push(`MACD shows ${macdInterpretation}.`);
  summaryParts.push(`Volatility is ${volatilityLevel} with ATR at ${atrPercent.toFixed(2)}% of price.`);
  if (adxData) {
    summaryParts.push(`ADX at ${adxData.adx.toFixed(1)} suggests ${adxInterpretation}.`);
  }
  
  return {
    symbol,
    timeframe,
    barCount: bars.length,
    priceAnalysis,
    volumeAnalysis,
    indicators: {
      rsi: { current: currentRSI, interpretation: rsiInterpretation },
      macd: { ...lastMACD, interpretation: macdInterpretation },
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
