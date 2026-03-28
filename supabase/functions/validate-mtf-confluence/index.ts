import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// LAYER 3: MULTI-TIMEFRAME CONFLUENCE VALIDATOR
// Ensures pattern direction aligns with the
// higher-timeframe trend, momentum, and S/R
// ============================================

interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
}

interface MTFInput {
  detection_id: string;
  detection_source: "historical" | "live";
  pattern_name: string;
  direction: string; // 'bullish' | 'bearish'
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  symbol: string;
  timeframe: string;
}

interface MTFVerdict {
  verdict: "confirmed" | "rejected" | "skipped";
  confidence: number;
  reasoning: string;
  factors: MTFFactor[];
}

interface MTFFactor {
  name: string;
  score: number; // -1 to 1
  detail: string;
}

// ============================================
// TIMEFRAME HIERARCHY
// ============================================

const TIMEFRAME_HIERARCHY: Record<string, string> = {
  "15m": "1h",
  "1h": "4h",
  "4h": "1d",
  "8h": "1d",
  "1d": "1wk",
  "1wk": "1wk", // Weekly has no higher TF — skip
};

// How many bars to request for the higher TF
const HTF_BAR_COUNT = 200;

// ============================================
// TECHNICAL INDICATORS (shared helpers)
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
  result.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
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

// ============================================
// S/R PROXIMITY DETECTION
// Uses swing highs/lows on the higher TF
// ============================================

function findSwingLevels(bars: Bar[], lookback = 5): { resistances: number[]; supports: number[] } {
  const resistances: number[] = [];
  const supports: number[] = [];

  for (let i = lookback; i < bars.length - lookback; i++) {
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let j = 1; j <= lookback; j++) {
      if (bars[i].h <= bars[i - j].h || bars[i].h <= bars[i + j].h) isSwingHigh = false;
      if (bars[i].l >= bars[i - j].l || bars[i].l >= bars[i + j].l) isSwingLow = false;
    }

    if (isSwingHigh) resistances.push(bars[i].h);
    if (isSwingLow) supports.push(bars[i].l);
  }

  return { resistances, supports };
}

// ============================================
// MTF CONFLUENCE SCORING
// ============================================

function scoreMTFConfluence(
  htfBars: Bar[],
  direction: string,
  entryPrice: number,
): MTFVerdict {
  const closes = htfBars.map(b => b.c);
  const lastClose = closes[closes.length - 1];
  const factors: MTFFactor[] = [];

  // --- Factor 1: HTF Trend Direction (40%) ---
  const ema50 = calculateEMA(closes, Math.min(50, Math.floor(closes.length / 2)));
  const ema200 = calculateEMA(closes, Math.min(200, Math.floor(closes.length * 0.8)));
  const lastEma50 = ema50.length > 0 ? ema50[ema50.length - 1] : lastClose;
  const lastEma200 = ema200.length > 0 ? ema200[ema200.length - 1] : lastClose;

  // Also check slope of EMA50 over last 5 values
  let ema50Slope = 0;
  if (ema50.length >= 5) {
    const recent5 = ema50.slice(-5);
    ema50Slope = (recent5[4] - recent5[0]) / recent5[0] * 100; // % change
  }

  const htfUptrend = lastClose > lastEma50 && lastEma50 > lastEma200;
  const htfDowntrend = lastClose < lastEma50 && lastEma50 < lastEma200;

  let trendScore = 0;
  let trendDetail = "";

  if (direction === "bullish") {
    if (htfUptrend) {
      trendScore = 0.9;
      trendDetail = `HTF uptrend confirmed (price > EMA50 > EMA200, slope ${ema50Slope.toFixed(2)}%)`;
    } else if (htfDowntrend) {
      trendScore = -0.8;
      trendDetail = `HTF downtrend active — bullish pattern fighting the higher TF`;
    } else {
      trendScore = lastClose > lastEma50 ? 0.2 : -0.2;
      trendDetail = `HTF trend mixed (price ${lastClose > lastEma50 ? "above" : "below"} EMA50)`;
    }
  } else {
    if (htfDowntrend) {
      trendScore = 0.9;
      trendDetail = `HTF downtrend confirmed (price < EMA50 < EMA200, slope ${ema50Slope.toFixed(2)}%)`;
    } else if (htfUptrend) {
      trendScore = -0.8;
      trendDetail = `HTF uptrend active — bearish pattern fighting the higher TF`;
    } else {
      trendScore = lastClose < lastEma50 ? 0.2 : -0.2;
      trendDetail = `HTF trend mixed (price ${lastClose < lastEma50 ? "below" : "above"} EMA50)`;
    }
  }

  factors.push({ name: "HTF Trend Direction", score: trendScore, detail: trendDetail });

  // --- Factor 2: HTF S/R Proximity (25%) ---
  const { resistances, supports } = findSwingLevels(htfBars, 3);
  const atr = calculateATR(htfBars);
  let srScore = 0;
  let srDetail = "";

  if (atr > 0) {
    if (direction === "bullish") {
      // Check if entry is near a strong HTF resistance (blocking upside)
      const nearbyResistance = resistances.find(r => r > entryPrice && (r - entryPrice) < atr * 1.5);
      const nearbySupport = supports.find(s => s < entryPrice && (entryPrice - s) < atr * 1.5);

      if (nearbyResistance && !nearbySupport) {
        srScore = -0.6;
        srDetail = `HTF resistance at ${nearbyResistance.toFixed(2)} within 1.5 ATR — upside blocked`;
      } else if (nearbySupport && !nearbyResistance) {
        srScore = 0.5;
        srDetail = `HTF support at ${nearbySupport.toFixed(2)} nearby — floor reinforces bullish`;
      } else if (nearbyResistance && nearbySupport) {
        srScore = -0.2;
        srDetail = `Price between HTF S/R — congestion zone`;
      } else {
        srScore = 0.2;
        srDetail = `No major HTF S/R levels nearby — open space`;
      }
    } else {
      // For bearish, check if entry near strong HTF support (blocking downside)
      const nearbySupport = supports.find(s => s < entryPrice && (entryPrice - s) < atr * 1.5);
      const nearbyResistance = resistances.find(r => r > entryPrice && (r - entryPrice) < atr * 1.5);

      if (nearbySupport && !nearbyResistance) {
        srScore = -0.6;
        srDetail = `HTF support at ${nearbySupport.toFixed(2)} within 1.5 ATR — downside blocked`;
      } else if (nearbyResistance && !nearbySupport) {
        srScore = 0.5;
        srDetail = `HTF resistance at ${nearbyResistance.toFixed(2)} nearby — ceiling reinforces bearish`;
      } else if (nearbySupport && nearbyResistance) {
        srScore = -0.2;
        srDetail = `Price between HTF S/R — congestion zone`;
      } else {
        srScore = 0.2;
        srDetail = `No major HTF S/R levels nearby — open space`;
      }
    }
  } else {
    srDetail = "Insufficient data for HTF S/R analysis";
  }

  factors.push({ name: "HTF S/R Proximity", score: srScore, detail: srDetail });

  // --- Factor 3: HTF Momentum (20%) ---
  const macd = calculateMACD(closes);
  const rsiValues = calculateRSI(closes);
  const currentRSI = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;
  let momScore = 0;
  let momDetail = "";

  if (macd) {
    const macdAligned = direction === "bullish" ? macd.histogram > 0 : macd.histogram < 0;
    const rsiAligned = direction === "bullish" ? currentRSI > 40 && currentRSI < 75 : currentRSI < 60 && currentRSI > 25;

    if (macdAligned && rsiAligned) {
      momScore = 0.7;
      momDetail = `HTF MACD ${macd.histogram > 0 ? "positive" : "negative"} + RSI ${currentRSI.toFixed(1)} — momentum aligned`;
    } else if (macdAligned) {
      momScore = 0.3;
      momDetail = `HTF MACD aligned but RSI ${currentRSI.toFixed(1)} — partial momentum`;
    } else if (rsiAligned) {
      momScore = 0.1;
      momDetail = `HTF RSI ${currentRSI.toFixed(1)} OK but MACD diverging`;
    } else {
      momScore = -0.5;
      momDetail = `HTF MACD ${macd.histogram > 0 ? "positive" : "negative"} + RSI ${currentRSI.toFixed(1)} — momentum opposing`;
    }
  } else {
    momDetail = "Insufficient HTF data for momentum";
  }

  factors.push({ name: "HTF Momentum", score: momScore, detail: momDetail });

  // --- Factor 4: Cross-TF Volume Profile (15%) ---
  const volumes = htfBars.map(b => b.v || 0).filter(v => v > 0);
  let volScore = 0;
  let volDetail = "";

  if (volumes.length >= 20) {
    const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const recentVol = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const ratio = avgVol > 0 ? recentVol / avgVol : 1;

    if (ratio > 1.3) {
      volScore = 0.5;
      volDetail = `HTF volume ${ratio.toFixed(1)}x avg — institutional participation`;
    } else if (ratio > 0.8) {
      volScore = 0.2;
      volDetail = `HTF volume ${ratio.toFixed(1)}x avg — normal activity`;
    } else {
      volScore = -0.3;
      volDetail = `HTF volume ${ratio.toFixed(1)}x avg — low participation on higher TF`;
    }
  } else {
    volDetail = "Insufficient HTF volume data";
  }

  factors.push({ name: "HTF Volume Profile", score: volScore, detail: volDetail });

  // ============================================
  // AGGREGATE VERDICT
  // ============================================

  const weights: Record<string, number> = {
    "HTF Trend Direction": 0.40,
    "HTF S/R Proximity": 0.25,
    "HTF Momentum": 0.20,
    "HTF Volume Profile": 0.15,
  };

  let weightedSum = 0;
  let totalWeight = 0;
  for (const factor of factors) {
    const w = weights[factor.name] || 0.1;
    weightedSum += factor.score * w;
    totalWeight += w;
  }

  const compositeScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // Thresholds — slightly stricter than Layer 2 since this is the final gate
  const CONFIRM_THRESHOLD = 0.10;
  const REJECT_THRESHOLD = -0.20;

  let verdict: "confirmed" | "rejected" | "skipped";
  let reasoning: string;

  if (compositeScore >= CONFIRM_THRESHOLD) {
    verdict = "confirmed";
    const supporting = factors.filter(f => f.score > 0.2).map(f => f.name);
    reasoning = `MTF confluence confirmed (score: ${compositeScore.toFixed(3)}). HTF alignment: ${supporting.join(", ") || "marginal pass"}.`;
  } else if (compositeScore <= REJECT_THRESHOLD) {
    verdict = "rejected";
    const conflicting = factors.filter(f => f.score < -0.2).map(f => f.name);
    reasoning = `MTF confluence rejected (score: ${compositeScore.toFixed(3)}). HTF opposition: ${conflicting.join(", ") || "overall misalignment"}.`;
  } else {
    verdict = "confirmed"; // Marginal pass — let Layer 1+2 confirmed patterns through
    reasoning = `MTF confluence marginal (score: ${compositeScore.toFixed(3)}). HTF context neither confirms nor contradicts.`;
  }

  const confidence = Math.max(0, Math.min(1, (compositeScore + 1) / 2));

  return { verdict, confidence, reasoning, factors };
}

// ============================================
// FETCH HIGHER TIMEFRAME BARS
// ============================================

async function fetchHTFBars(
  supabase: ReturnType<typeof createClient>,
  symbol: string,
  htfTimeframe: string,
): Promise<Bar[]> {
  // Try DB first
  const { data: dbBars } = await supabase
    .from("historical_prices")
    .select("date, open, high, low, close, volume")
    .eq("symbol", symbol)
    .eq("timeframe", htfTimeframe)
    .order("date", { ascending: true })
    .limit(HTF_BAR_COUNT);

  if (dbBars && dbBars.length >= 50) {
    return dbBars.map((r: any) => ({
      t: r.date, o: r.open, h: r.high, l: r.low, c: r.close, v: r.volume || 0,
    }));
  }

  // Fallback: fetch from EODHD first, Yahoo as last resort
  try {
    const daysBack = htfTimeframe === "1wk" ? 365 * 3 : htfTimeframe === "1d" ? 365 * 2 : 180;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysBack);

    // Try EODHD first (primary source)
    const { data: eodhData, error: eodhError } = await supabase.functions.invoke("fetch-eodhd", {
      body: {
        symbol,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        interval: htfTimeframe,
        includeOhlc: true,
      },
    });

    if (!eodhError && eodhData?.bars?.length > 0) {
      return eodhData.bars.map((b: any) => ({
        t: b.date || b.t,
        o: b.open || b.o,
        h: b.high || b.h,
        l: b.low || b.l,
        c: b.close || b.c,
        v: b.volume || b.v || 0,
      }));
    }

    console.warn(`[mtf-confluence] EODHD returned no data for ${symbol}/${htfTimeframe}, trying Yahoo fallback`);

    // Yahoo last-resort fallback
    const { data: fnData, error: fnError } = await supabase.functions.invoke("fetch-yahoo-finance", {
      body: {
        symbol,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        interval: htfTimeframe,
        includeOhlc: true,
      },
    });

    if (fnError || !fnData?.bars?.length) {
      console.warn(`[mtf-confluence] Yahoo fallback also failed for ${symbol}/${htfTimeframe}`);
      return [];
    }

    return fnData.bars.map((b: any) => ({
      t: b.date || b.t,
      o: b.open || b.o,
      h: b.high || b.h,
      l: b.low || b.l,
      c: b.close || b.c,
      v: b.volume || b.v || 0,
    }));
  } catch (err) {
    console.error(`[mtf-confluence] Fetch error for ${symbol}/${htfTimeframe}:`, err);
    return [];
  }
}

// ============================================
// BATCH PROCESSING
// ============================================

async function processMTFValidations(
  inputs: MTFInput[],
  supabase: ReturnType<typeof createClient>,
): Promise<{ results: Array<{ detection_id: string; verdict: MTFVerdict }> }> {
  const startTime = Date.now();
  const results: Array<{ detection_id: string; verdict: MTFVerdict }> = [];

  // Group by symbol+htfTimeframe to avoid duplicate fetches
  const htfBarCache = new Map<string, Bar[]>();

  for (const input of inputs) {
    const detectionStart = Date.now();

    try {
      const htfTimeframe = TIMEFRAME_HIERARCHY[input.timeframe];

      // Skip if the pattern is already on the highest timeframe (1wk)
      if (htfTimeframe === input.timeframe) {
        const skipVerdict: MTFVerdict = {
          verdict: "confirmed",
          confidence: 0.5,
          reasoning: `No higher timeframe available for ${input.timeframe} — MTF check skipped, pattern passes.`,
          factors: [],
        };

        await supabase.from("pattern_pipeline_results").insert({
          detection_id: input.detection_id,
          detection_source: input.detection_source,
          layer_name: "mtf_confluence",
          verdict: "confirmed",
          confidence: 0.5,
          reasoning: skipVerdict.reasoning,
          layer_output: { skipped_reason: "highest_timeframe" },
          processing_time_ms: Date.now() - detectionStart,
        });

        results.push({ detection_id: input.detection_id, verdict: skipVerdict });
        continue;
      }

      // Fetch or use cached HTF bars
      const cacheKey = `${input.symbol}|${htfTimeframe}`;
      let htfBars = htfBarCache.get(cacheKey);
      if (!htfBars) {
        htfBars = await fetchHTFBars(supabase, input.symbol, htfTimeframe);
        htfBarCache.set(cacheKey, htfBars);
      }

      if (htfBars.length < 30) {
        const skipVerdict: MTFVerdict = {
          verdict: "confirmed",
          confidence: 0.4,
          reasoning: `Insufficient HTF data (${htfBars.length} bars) — MTF check skipped, pattern passes.`,
          factors: [],
        };

        await supabase.from("pattern_pipeline_results").insert({
          detection_id: input.detection_id,
          detection_source: input.detection_source,
          layer_name: "mtf_confluence",
          verdict: "confirmed",
          confidence: 0.4,
          reasoning: skipVerdict.reasoning,
          layer_output: { skipped_reason: "insufficient_htf_data", bars_available: htfBars.length },
          processing_time_ms: Date.now() - detectionStart,
        });

        results.push({ detection_id: input.detection_id, verdict: skipVerdict });
        continue;
      }

      // Score MTF confluence
      const verdict = scoreMTFConfluence(htfBars, input.direction, input.entry_price);
      const processingTime = Date.now() - detectionStart;

      // Log to pipeline
      await supabase.from("pattern_pipeline_results").insert({
        detection_id: input.detection_id,
        detection_source: input.detection_source,
        layer_name: "mtf_confluence",
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        reasoning: verdict.reasoning,
        layer_output: { factors: verdict.factors, composite_score: (verdict.confidence * 2) - 1, htf_timeframe: htfTimeframe },
        processing_time_ms: processingTime,
      });

      // Update detection record
      const table = input.detection_source === "live"
        ? "live_pattern_detections"
        : "historical_pattern_occurrences";

      const updatePayload: Record<string, unknown> = {
        validation_completed_at: new Date().toISOString(),
      };

      if (verdict.verdict === "rejected") {
        // Override to rejected — this is the final gate
        updatePayload.validation_status = "rejected";
      } else if (verdict.verdict === "confirmed") {
        // Final layer passed — mark as confirmed (this is the terminal state)
        updatePayload.validation_status = "confirmed";
      }

      // Append layer to passed layers
      if (verdict.verdict === "confirmed") {
        const { data: current } = await supabase
          .from(table)
          .select("validation_layers_passed")
          .eq("id", input.detection_id)
          .single();

        const existingLayers = (current?.validation_layers_passed as string[]) || [];
        if (!existingLayers.includes("mtf_confluence")) {
          updatePayload.validation_layers_passed = [...existingLayers, "mtf_confluence"];
        }
      }

      await supabase.from(table).update(updatePayload).eq("id", input.detection_id);

      results.push({ detection_id: input.detection_id, verdict });

    } catch (err) {
      console.error(`[mtf-confluence] Error for ${input.detection_id}:`, err);

      await supabase.from("pattern_pipeline_results").insert({
        detection_id: input.detection_id,
        detection_source: input.detection_source,
        layer_name: "mtf_confluence",
        verdict: "error",
        confidence: 0,
        reasoning: err instanceof Error ? err.message : "Unknown error",
        processing_time_ms: Date.now() - detectionStart,
      });

      results.push({
        detection_id: input.detection_id,
        verdict: { verdict: "confirmed", confidence: 0.3, reasoning: "MTF validation error — fallback pass", factors: [] },
      });
    }
  }

  console.log(`[mtf-confluence] Processed ${results.length} detections in ${Date.now() - startTime}ms`);
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
    const { detections } = body as { detections: MTFInput[] };

    if (!detections || !Array.isArray(detections) || detections.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required field: detections (array)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MAX_BATCH = 30; // Smaller batch since HTF fetch is network-bound
    const batch = detections.slice(0, MAX_BATCH);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const result = await processMTFValidations(batch, supabase);

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
    console.error("[mtf-confluence] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
