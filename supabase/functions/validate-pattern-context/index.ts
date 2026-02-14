import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// LAYER 2: AI CONTEXT VALIDATOR
// Validates Bulkowski engine detections using
// technical indicator context analysis
// ============================================

interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
}

interface DetectionInput {
  detection_id: string;
  detection_source: "historical" | "live";
  pattern_name: string;
  direction: string; // 'bullish' | 'bearish'
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  symbol: string;
  timeframe: string;
  bars: Bar[]; // OHLCV bars around the detection
  quality_score?: string;
  trend_alignment?: string;
}

interface ValidationVerdict {
  verdict: "confirmed" | "rejected" | "skipped";
  confidence: number; // 0-1
  reasoning: string;
  factors: ValidationFactor[];
}

interface ValidationFactor {
  name: string;
  score: number; // -1 to 1 (negative = against, positive = supports)
  detail: string;
}

// ============================================
// TECHNICAL INDICATOR CALCULATIONS
// Shared logic with analyze-chart-context
// ============================================

function calculateEMA(closes: number[], period: number): number[] {
  if (closes.length < period) return [];
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(ema);
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  return result;
}

function calculateRSI(closes: number[], period = 14): number[] {
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
    result.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
  }
  return result;
}

function calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow + signal) return null;
  const fastEMA = calculateEMA(closes, fast);
  const slowEMA = calculateEMA(closes, slow);
  const offset = slow - fast;
  const macdLine: number[] = [];
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }
  const signalLine = calculateEMA(macdLine, signal);
  const signalOffset = macdLine.length - signalLine.length;
  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  return { macd: lastMacd, signal: lastSignal, histogram: lastMacd - lastSignal };
}

function calculateATR(bars: Bar[], period = 14): number {
  if (bars.length < period + 1) return 0;
  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    trueRanges.push(Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - bars[i - 1].c),
      Math.abs(bars[i].l - bars[i - 1].c)
    ));
  }
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }
  return atr;
}

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
    trueRanges.push(Math.max(
      bars[i].h - bars[i].l,
      Math.abs(bars[i].h - bars[i - 1].c),
      Math.abs(bars[i].l - bars[i - 1].c)
    ));
  }
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
    dxValues.push(diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100);
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

// ============================================
// VALIDATION LOGIC
// ============================================

// Reversal patterns need counter-trend conditions
const REVERSAL_PATTERNS = [
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'double-top', 'double-bottom',
  'triple-top', 'triple-bottom',
  'rising-wedge', 'falling-wedge',
  'rounding-bottom', 'rounding-top',
];

// Continuation patterns need with-trend conditions
const CONTINUATION_PATTERNS = [
  'bull-flag', 'bear-flag',
  'bull-pennant', 'bear-pennant',
  'cup-and-handle', 'inverse-cup-and-handle',
  'ascending-triangle', 'descending-triangle',
  'symmetrical-triangle',
];

function validateDetection(input: DetectionInput): ValidationVerdict {
  const { bars, pattern_name, direction, entry_price, stop_loss_price } = input;
  const closes = bars.map(b => b.c);
  const lastClose = closes[closes.length - 1];
  const factors: ValidationFactor[] = [];

  // --- Factor 1: Trend Alignment ---
  const ema20 = calculateEMA(closes, Math.min(20, Math.floor(closes.length / 2)));
  const ema50 = calculateEMA(closes, Math.min(50, Math.floor(closes.length / 2)));
  const lastEma20 = ema20.length > 0 ? ema20[ema20.length - 1] : lastClose;
  const lastEma50 = ema50.length > 0 ? ema50[ema50.length - 1] : lastClose;

  const isUptrend = lastClose > lastEma20 && lastEma20 > lastEma50;
  const isDowntrend = lastClose < lastEma20 && lastEma20 < lastEma50;
  const isReversal = REVERSAL_PATTERNS.includes(pattern_name);
  const isContinuation = CONTINUATION_PATTERNS.includes(pattern_name);

  let trendScore = 0;
  let trendDetail = "";

  if (isReversal) {
    // Reversals NEED a prior trend to reverse FROM
    if (direction === "bullish" && isDowntrend) {
      trendScore = 0.8;
      trendDetail = "Prior downtrend present — valid setup for bullish reversal";
    } else if (direction === "bearish" && isUptrend) {
      trendScore = 0.8;
      trendDetail = "Prior uptrend present — valid setup for bearish reversal";
    } else if (direction === "bullish" && isUptrend) {
      trendScore = -0.5;
      trendDetail = "No prior downtrend — bullish reversal lacks context";
    } else if (direction === "bearish" && isDowntrend) {
      trendScore = -0.5;
      trendDetail = "No prior uptrend — bearish reversal lacks context";
    } else {
      trendScore = 0;
      trendDetail = "Sideways market — reversal context is ambiguous";
    }
  } else if (isContinuation) {
    // Continuations should be WITH the trend
    if (direction === "bullish" && isUptrend) {
      trendScore = 0.8;
      trendDetail = "Uptrend confirmed — continuation pattern aligned";
    } else if (direction === "bearish" && isDowntrend) {
      trendScore = 0.8;
      trendDetail = "Downtrend confirmed — continuation pattern aligned";
    } else {
      trendScore = -0.4;
      trendDetail = "Continuation pattern against prevailing trend";
    }
  } else {
    trendScore = 0.2;
    trendDetail = "Pattern type has flexible trend requirements";
  }

  factors.push({ name: "Trend Alignment", score: trendScore, detail: trendDetail });

  // --- Factor 2: RSI Confirmation ---
  const rsiValues = calculateRSI(closes);
  const currentRSI = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;
  let rsiScore = 0;
  let rsiDetail = "";

  if (direction === "bullish") {
    if (currentRSI < 35) { rsiScore = 0.7; rsiDetail = `RSI ${currentRSI.toFixed(1)} — oversold supports bullish setup`; }
    else if (currentRSI < 50) { rsiScore = 0.3; rsiDetail = `RSI ${currentRSI.toFixed(1)} — neutral-low, mild support`; }
    else if (currentRSI > 75) { rsiScore = -0.6; rsiDetail = `RSI ${currentRSI.toFixed(1)} — overbought contradicts bullish entry`; }
    else { rsiScore = 0; rsiDetail = `RSI ${currentRSI.toFixed(1)} — neutral`; }
  } else {
    if (currentRSI > 65) { rsiScore = 0.7; rsiDetail = `RSI ${currentRSI.toFixed(1)} — overbought supports bearish setup`; }
    else if (currentRSI > 50) { rsiScore = 0.3; rsiDetail = `RSI ${currentRSI.toFixed(1)} — neutral-high, mild support`; }
    else if (currentRSI < 25) { rsiScore = -0.6; rsiDetail = `RSI ${currentRSI.toFixed(1)} — oversold contradicts bearish entry`; }
    else { rsiScore = 0; rsiDetail = `RSI ${currentRSI.toFixed(1)} — neutral`; }
  }

  factors.push({ name: "RSI", score: rsiScore, detail: rsiDetail });

  // --- Factor 3: MACD Momentum ---
  const macd = calculateMACD(closes);
  let macdScore = 0;
  let macdDetail = "";

  if (macd) {
    if (direction === "bullish") {
      if (macd.histogram > 0) { macdScore = 0.5; macdDetail = "MACD histogram positive — bullish momentum"; }
      else { macdScore = -0.3; macdDetail = "MACD histogram negative — momentum against bullish"; }
    } else {
      if (macd.histogram < 0) { macdScore = 0.5; macdDetail = "MACD histogram negative — bearish momentum"; }
      else { macdScore = -0.3; macdDetail = "MACD histogram positive — momentum against bearish"; }
    }
  } else {
    macdDetail = "Insufficient data for MACD";
  }

  factors.push({ name: "MACD Momentum", score: macdScore, detail: macdDetail });

  // --- Factor 4: ADX Trend Strength ---
  const adx = calculateADX(bars);
  let adxScore = 0;
  let adxDetail = "";

  if (adx) {
    if (adx.adx > 25) {
      // Strong trend — good for continuation, needs caution for reversal
      if (isContinuation) {
        adxScore = 0.6;
        adxDetail = `ADX ${adx.adx.toFixed(1)} — strong trend supports continuation`;
      } else if (isReversal) {
        adxScore = adx.adx > 40 ? -0.3 : 0.2;
        adxDetail = adx.adx > 40
          ? `ADX ${adx.adx.toFixed(1)} — very strong trend, reversal risky`
          : `ADX ${adx.adx.toFixed(1)} — trend present, reversal plausible`;
      } else {
        adxScore = 0.3;
        adxDetail = `ADX ${adx.adx.toFixed(1)} — trending market`;
      }
    } else {
      adxScore = isReversal ? 0.3 : -0.2;
      adxDetail = `ADX ${adx.adx.toFixed(1)} — weak trend / ranging`;
    }
  } else {
    adxDetail = "Insufficient data for ADX";
  }

  factors.push({ name: "ADX Strength", score: adxScore, detail: adxDetail });

  // --- Factor 5: Volume Confirmation ---
  const volumes = bars.map(b => b.v || 0).filter(v => v > 0);
  let volScore = 0;
  let volDetail = "";

  if (volumes.length >= 20) {
    const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const recentVol = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const ratio = avgVol > 0 ? recentVol / avgVol : 1;

    if (ratio > 1.5) { volScore = 0.6; volDetail = `Volume ${ratio.toFixed(1)}x avg — strong participation`; }
    else if (ratio > 1.0) { volScore = 0.3; volDetail = `Volume ${ratio.toFixed(1)}x avg — adequate participation`; }
    else if (ratio < 0.5) { volScore = -0.4; volDetail = `Volume ${ratio.toFixed(1)}x avg — low participation, weak conviction`; }
    else { volScore = 0; volDetail = `Volume ${ratio.toFixed(1)}x avg — normal`; }
  } else {
    volDetail = "Insufficient volume data";
  }

  factors.push({ name: "Volume", score: volScore, detail: volDetail });

  // --- Factor 6: Risk/Reward Sanity ---
  const riskDistance = Math.abs(entry_price - stop_loss_price);
  const atr = calculateATR(bars);
  let rrScore = 0;
  let rrDetail = "";

  if (atr > 0 && riskDistance > 0) {
    const atrRatio = riskDistance / atr;
    if (atrRatio >= 1.0 && atrRatio <= 3.0) {
      rrScore = 0.4;
      rrDetail = `SL distance ${atrRatio.toFixed(1)}x ATR — well-calibrated`;
    } else if (atrRatio < 0.5) {
      rrScore = -0.3;
      rrDetail = `SL distance ${atrRatio.toFixed(1)}x ATR — too tight, likely noise stop`;
    } else if (atrRatio > 5) {
      rrScore = -0.3;
      rrDetail = `SL distance ${atrRatio.toFixed(1)}x ATR — too wide`;
    } else {
      rrScore = 0.1;
      rrDetail = `SL distance ${atrRatio.toFixed(1)}x ATR — acceptable`;
    }
  } else {
    rrDetail = "Cannot evaluate risk calibration";
  }

  factors.push({ name: "Risk Calibration", score: rrScore, detail: rrDetail });

  // ============================================
  // AGGREGATE VERDICT
  // ============================================

  // Weighted scoring
  const weights: Record<string, number> = {
    "Trend Alignment": 0.30,
    "RSI": 0.15,
    "MACD Momentum": 0.15,
    "ADX Strength": 0.15,
    "Volume": 0.15,
    "Risk Calibration": 0.10,
  };

  let weightedSum = 0;
  let totalWeight = 0;
  for (const factor of factors) {
    const w = weights[factor.name] || 0.1;
    weightedSum += factor.score * w;
    totalWeight += w;
  }

  const compositeScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Thresholds
  const CONFIRM_THRESHOLD = 0.15;  // Needs positive signal to confirm
  const REJECT_THRESHOLD = -0.15;  // Below this = rejected

  let verdict: "confirmed" | "rejected" | "skipped";
  let reasoning: string;

  if (compositeScore >= CONFIRM_THRESHOLD) {
    verdict = "confirmed";
    const supportingFactors = factors.filter(f => f.score > 0.2).map(f => f.name);
    reasoning = `Pattern confirmed (score: ${compositeScore.toFixed(3)}). Supporting factors: ${supportingFactors.join(", ") || "marginal consensus"}.`;
  } else if (compositeScore <= REJECT_THRESHOLD) {
    verdict = "rejected";
    const conflictingFactors = factors.filter(f => f.score < -0.2).map(f => f.name);
    reasoning = `Pattern rejected (score: ${compositeScore.toFixed(3)}). Conflicting factors: ${conflictingFactors.join(", ") || "overall weakness"}.`;
  } else {
    verdict = "confirmed"; // Marginal — let through with lower confidence
    reasoning = `Pattern marginally confirmed (score: ${compositeScore.toFixed(3)}). Context is ambiguous but does not contradict the setup.`;
  }

  // Confidence: map composite score to 0-1 range
  const confidence = Math.max(0, Math.min(1, (compositeScore + 1) / 2));

  return { verdict, confidence, reasoning, factors };
}

// ============================================
// BATCH VALIDATION SUPPORT
// ============================================

async function processValidations(
  detections: DetectionInput[],
  supabase: ReturnType<typeof createClient>
): Promise<{ results: Array<{ detection_id: string; verdict: ValidationVerdict }> }> {
  const startTime = Date.now();
  const results: Array<{ detection_id: string; verdict: ValidationVerdict }> = [];

  for (const detection of detections) {
    const detectionStart = Date.now();

    try {
      const verdict = validateDetection(detection);
      const processingTime = Date.now() - detectionStart;

      // Log to pipeline results
      await supabase.from("pattern_pipeline_results").insert({
        detection_id: detection.detection_id,
        detection_source: detection.detection_source,
        layer_name: "ai_context_validator",
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        reasoning: verdict.reasoning,
        layer_output: { factors: verdict.factors, composite_score: (verdict.confidence * 2) - 1 },
        processing_time_ms: processingTime,
      });

      // Update the detection's validation_status
      const table = detection.detection_source === "live"
        ? "live_pattern_detections"
        : "historical_pattern_occurrences";

      const updatePayload: Record<string, unknown> = {
        validation_status: verdict.verdict,
        validation_completed_at: new Date().toISOString(),
      };

      // Append this layer to passed layers if confirmed
      if (verdict.verdict === "confirmed") {
        // We need to read current layers first
        const { data: current } = await supabase
          .from(table)
          .select("validation_layers_passed")
          .eq("id", detection.detection_id)
          .single();

        const existingLayers = (current?.validation_layers_passed as string[]) || [];
        if (!existingLayers.includes("ai_context_validator")) {
          updatePayload.validation_layers_passed = [...existingLayers, "ai_context_validator"];
        }
      }

      await supabase.from(table).update(updatePayload).eq("id", detection.detection_id);

      results.push({ detection_id: detection.detection_id, verdict });

    } catch (err) {
      console.error(`[validate-pattern-context] Error validating ${detection.detection_id}:`, err);

      // Log error to pipeline
      await supabase.from("pattern_pipeline_results").insert({
        detection_id: detection.detection_id,
        detection_source: detection.detection_source,
        layer_name: "ai_context_validator",
        verdict: "error",
        confidence: 0,
        reasoning: err instanceof Error ? err.message : "Unknown error",
        processing_time_ms: Date.now() - detectionStart,
      });

      results.push({
        detection_id: detection.detection_id,
        verdict: { verdict: "skipped", confidence: 0, reasoning: "Validation error — fallback to pass", factors: [] }
      });
    }
  }

  console.log(`[validate-pattern-context] Processed ${results.length} detections in ${Date.now() - startTime}ms`);
  return { results };
}

// ============================================
// HTTP HANDLER
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { detections } = body as { detections: DetectionInput[] };

    if (!detections || !Array.isArray(detections) || detections.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required field: detections (array)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cap batch size to prevent timeouts
    const MAX_BATCH = 50;
    const batch = detections.slice(0, MAX_BATCH);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const result = await processValidations(batch, supabase);

    const summary = {
      total: result.results.length,
      confirmed: result.results.filter(r => r.verdict.verdict === "confirmed").length,
      rejected: result.results.filter(r => r.verdict.verdict === "rejected").length,
      skipped: result.results.filter(r => r.verdict.verdict === "skipped").length,
    };

    return new Response(
      JSON.stringify({ success: true, summary, results: result.results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[validate-pattern-context] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
