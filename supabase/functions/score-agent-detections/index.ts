import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PROOF_GATE_MIN_SAMPLE = 15;
const PROOF_GATE_MIN_WIN_RATE = 0.45;
const BATCH_SIZE = 100;

// Bayesian prior: neutral assumption when no data exists
const BAYESIAN_PRIOR_WIN_RATE = 0.50;
const BAYESIAN_PRIOR_EXPECTANCY = 0;
const BAYESIAN_VIRTUAL_SAMPLE = 10;

// ── Analyst Agent (matches AnalystAgent.ts engine logic) ──────────────────
function scoreAnalyst(hp: any, source: string = "per_symbol"): { raw: number; details: Record<string, any> } {
  const winRate = hp?.winRate ?? hp?.win_rate ?? 0;
  const sampleSize = hp?.sampleSize ?? hp?.sample_size ?? 0;
  const expectancyR = hp?.avgRMultiple ?? hp?.expectancyR ?? 0;

  if (sampleSize < 5) {
    return { raw: 0, details: { reason: "insufficient_data", sampleSize, source } };
  }

  const winRateScore = Math.min(10, winRate * 10);
  const expectancyScore = Math.min(10, Math.max(0, expectancyR) * 10);
  const MIN_SAMPLE = 30;
  const confidenceScore = Math.min(
    5,
    Math.log2(sampleSize / MIN_SAMPLE + 1) * 2 * (sampleSize >= MIN_SAMPLE ? 1 : 0.5)
  );
  let raw = Math.min(1, (winRateScore + expectancyScore + confidenceScore) / 25);

  // Discount fallback sources so they rank below per-symbol proven data
  const sourceDiscount = source === "per_symbol" ? 1.0
    : source === "pattern_aggregate" ? 0.65
    : 0.40; // bayesian_prior
  raw = raw * sourceDiscount;

  return {
    raw,
    details: {
      winRate, expectancyR, sampleSize, source,
      sourceDiscount,
      winRateScore: Math.round(winRateScore * 100) / 100,
      expectancyScore: Math.round(expectancyScore * 100) / 100,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
    },
  };
}

// ── Risk Agent (matches RiskAgent.ts engine logic) ────────────────────────
function scoreRisk(d: any): { raw: number; details: Record<string, any> } {
  const MIN_RR = 1.5;
  const KELLY_CAP = 0.25;
  const winRate = (d.historical_performance?.winRate ?? d.historical_performance?.win_rate ?? 0.5);

  const rrRatio = (d.risk_reward_ratio || 0) / MIN_RR;
  const rrScore = Math.min(10, Math.max(0, rrRatio * 5));

  const stopDist = d.entry_price > 0
    ? Math.abs(d.entry_price - d.stop_loss_price) / d.entry_price
    : 0.03;
  const stabilityScore = Math.max(0, 8 * (1 - Math.min(1, stopDist / 0.05)));

  const kelly = d.risk_reward_ratio > 0
    ? winRate - (1 - winRate) / d.risk_reward_ratio
    : 0;
  const cappedKelly = Math.min(KELLY_CAP, Math.max(0, kelly));
  const kellyScore = (cappedKelly / KELLY_CAP) * 7;

  const raw = Math.min(1, (rrScore + stabilityScore + kellyScore) / 25);

  return {
    raw,
    details: {
      rr: d.risk_reward_ratio,
      stopDist: Math.round(stopDist * 10000) / 100,
      kelly: Math.round(cappedKelly * 1000) / 1000,
      rrScore: Math.round(rrScore * 100) / 100,
      stabilityScore: Math.round(stabilityScore * 100) / 100,
      kellyScore: Math.round(kellyScore * 100) / 100,
    },
  };
}

// ── Timing Agent (matches live computeTimingFromEvents logic) ─────────────
function scoreTiming(d: any, economicEvents: any[]): { raw: number; details: Record<string, any> } {
  const trendScore = d.trend_alignment === "with_trend" ? 0.85
    : d.trend_alignment === "counter_trend" ? 0.3 : 0.55;

  if (!economicEvents || economicEvents.length === 0) {
    return { raw: trendScore, details: { trendScore, eventCount: 0 } };
  }

  const instrument = (d.instrument || "").toUpperCase();
  const relevantEvents = economicEvents.filter((e: any) => {
    const currency = (e.currency || e.country_code || "").toUpperCase();
    return instrument.includes(currency) || currency.includes(instrument.slice(0, 3));
  });

  let eventScore = 1.0;
  let highCount = 0;
  let mediumCount = 0;

  for (const event of relevantEvents) {
    const impact = (event.impact || event.impact_level || "").toLowerCase();
    if (impact === "high") { eventScore -= 0.15; highCount++; }
    else if (impact === "medium") { eventScore -= 0.06; mediumCount++; }
  }
  eventScore = Math.max(0, Math.min(1, eventScore));

  const raw = trendScore * 0.5 + eventScore * 0.5;

  return {
    raw,
    details: {
      trendScore,
      eventScore: Math.round(eventScore * 100) / 100,
      eventCount: relevantEvents.length,
      highCount,
      mediumCount,
    },
  };
}

// ── Portfolio Agent (quality-grade proxy, no basket context) ─────────────
function scorePortfolio(d: any): number {
  const gradeMap: Record<string, number> = { A: 0.95, B: 0.78, C: 0.55, D: 0.35, F: 0.15 };
  return gradeMap[d.quality_score || "C"] ?? 0.55;
}

// ── Per-Symbol History Fetcher ────────────────────────────────────────────
// Queries historical_pattern_occurrences for the EXACT symbol+pattern combo
async function fetchPerSymbolStats(
  supabase: any,
  detections: Array<{ instrument: string; pattern_id: string }>
): Promise<Map<string, { winRate: number; avgRMultiple: number; sampleSize: number }>> {
  const map = new Map();
  if (!detections.length) return map;

  // Build unique symbol+pattern_id combos
  const combos = [...new Set(detections.map((d) => `${d.instrument}||${d.pattern_id}`))];

  // Batch fetch — we need symbol-level data so query with both filters
  for (const combo of combos) {
    const [symbol, patternId] = combo.split("||");
    try {
      const { data, error } = await supabase
        .from("historical_pattern_occurrences")
        .select("outcome, outcome_pnl_percent")
        .eq("symbol", symbol)
        .eq("pattern_id", patternId)
        .in("outcome", ["hit_tp", "hit_sl"])
        .limit(2000);

      if (error || !data?.length) continue;

      let wins = 0, total = 0, pnlSum = 0;
      for (const row of data) {
        total++;
        if (row.outcome === "hit_tp") wins++;
        pnlSum += row.outcome_pnl_percent ?? 0;
      }

      if (total >= 5) {
        map.set(combo, {
          winRate: Math.round((wins / total) * 1000) / 10,
          avgRMultiple: Math.round((pnlSum / total / 100) * 100) / 100,
          sampleSize: total,
        });
      }
    } catch (err: any) {
      console.warn(`[score-agent-detections] Per-symbol fetch error for ${symbol}/${patternId}:`, err.message);
    }
  }

  console.log(`[score-agent-detections] Per-symbol stats found for ${map.size}/${combos.length} combos`);
  return map;
}

// ── Pattern-Level Aggregate Fetcher (cross-symbol fallback) ──────────────
async function fetchPatternAggregates(
  supabase: any,
  patternIds: string[]
): Promise<Map<string, { winRate: number; avgRMultiple: number; sampleSize: number }>> {
  const map = new Map();
  if (!patternIds.length) return map;

  try {
    const { data, error } = await supabase
      .from("historical_pattern_occurrences")
      .select("pattern_id, outcome, outcome_pnl_percent")
      .in("pattern_id", patternIds)
      .in("outcome", ["hit_tp", "hit_sl"])
      .limit(5000);

    if (error || !data?.length) return map;

    const grouped = new Map<string, { wins: number; total: number; pnlSum: number }>();
    for (const row of data) {
      if (!grouped.has(row.pattern_id)) grouped.set(row.pattern_id, { wins: 0, total: 0, pnlSum: 0 });
      const e = grouped.get(row.pattern_id)!;
      e.total++;
      if (row.outcome === "hit_tp") e.wins++;
      e.pnlSum += row.outcome_pnl_percent ?? 0;
    }

    for (const [patternId, e] of grouped) {
      if (e.total >= 5) {
        map.set(patternId, {
          winRate: Math.round((e.wins / e.total) * 1000) / 10,
          avgRMultiple: Math.round((e.pnlSum / e.total / 100) * 100) / 100,
          sampleSize: e.total,
        });
      }
    }

    console.log(`[score-agent-detections] Pattern aggregates fetched for ${map.size}/${patternIds.length} patterns`);
  } catch (err: any) {
    console.warn("[score-agent-detections] Pattern aggregate fetch error:", err.message);
  }

  return map;
}

// ── Main Handler ──────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch all active detections
    const { data: detections, error: detErr } = await supabase
      .from("live_pattern_detections")
      .select("*")
      .eq("status", "active");

    if (detErr) throw detErr;
    if (!detections?.length) {
      return new Response(JSON.stringify({ scored: 0, skipped: 0, message: "no active detections" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch upcoming economic events for timing agent
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const { data: economicEvents } = await supabase
      .from("economic_events")
      .select("*")
      .gte("scheduled_time", now.toISOString())
      .lte("scheduled_time", in48h.toISOString());

    // 3. Identify detections needing pattern-aggregate fallback
    const dataPoorDetections = detections.filter((d: any) => {
      const hp = d.historical_performance;
      const sampleSize = hp?.sampleSize ?? hp?.sample_size ?? 0;
      return sampleSize < 5;
    });

    let patternAggregates = new Map<string, { winRate: number; avgRMultiple: number; sampleSize: number }>();
    if (dataPoorDetections.length > 0) {
      const patternIds = [...new Set(dataPoorDetections.map((d: any) => d.pattern_id))];
      console.log(`[score-agent-detections] ${dataPoorDetections.length} detections need fallback, fetching aggregates for ${patternIds.length} patterns`);
      patternAggregates = await fetchPatternAggregates(supabase, patternIds);
    }

    // 4. Score in batches and upsert
    let scored = 0;
    let skipped = 0;
    let fallbackUsed = { pattern_aggregate: 0, bayesian_prior: 0 };

    for (let i = 0; i < detections.length; i += BATCH_SIZE) {
      const batch = detections.slice(i, i + BATCH_SIZE);

      const rows = batch.map((d: any) => {
        let hp = d.historical_performance;
        const originalSampleSize = hp?.sampleSize ?? hp?.sample_size ?? 0;
        let analystSource = "per_symbol";

        // Fallback chain for data-poor detections
        if (originalSampleSize < 5) {
          const agg = patternAggregates.get(d.pattern_id);
          if (agg && agg.sampleSize >= 5) {
            // Use pattern-level aggregate
            hp = { winRate: agg.winRate, avgRMultiple: agg.avgRMultiple, sampleSize: agg.sampleSize };
            analystSource = "pattern_aggregate";
            fallbackUsed.pattern_aggregate++;
          } else {
            // Use Bayesian prior — neutral score instead of 0
            hp = { winRate: BAYESIAN_PRIOR_WIN_RATE, avgRMultiple: BAYESIAN_PRIOR_EXPECTANCY, sampleSize: BAYESIAN_VIRTUAL_SAMPLE };
            analystSource = "bayesian_prior";
            fallbackUsed.bayesian_prior++;
          }
        }

        const winRate = hp?.winRate ?? hp?.win_rate ?? 0;
        const sampleSize = hp?.sampleSize ?? hp?.sample_size ?? 0;
        const expectancyR = hp?.avgRMultiple ?? hp?.expectancyR ?? 0;

        const analyst = scoreAnalyst(hp, analystSource);
        const risk = scoreRisk(d);
        const timing = scoreTiming(d, economicEvents || []);
        const portfolioRaw = scorePortfolio(d);
        const isProven = sampleSize >= PROOF_GATE_MIN_SAMPLE && winRate >= PROOF_GATE_MIN_WIN_RATE;

        return {
          detection_id: d.id,
          instrument: d.instrument,
          pattern_id: d.pattern_id,
          timeframe: d.timeframe,
          asset_type: d.asset_type,
          direction: d.direction,
          analyst_raw: analyst.raw,
          risk_raw: risk.raw,
          timing_raw: timing.raw,
          portfolio_raw: portfolioRaw,
          analyst_details: analyst.details,
          risk_details: risk.details,
          timing_details: timing.details,
          sample_size: sampleSize,
          win_rate: winRate,
          expectancy_r: expectancyR,
          is_proven: isProven,
          scored_at: new Date().toISOString(),
        };
      });

      const { error: upsertErr } = await supabase
        .from("agent_scores")
        .upsert(rows, { onConflict: "detection_id" });

      if (upsertErr) {
        console.error("[score-agent-detections] upsert error:", upsertErr);
        skipped += batch.length;
      } else {
        scored += batch.length;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[score-agent-detections] scored=${scored} skipped=${skipped} duration=${duration}ms fallbacks=${JSON.stringify(fallbackUsed)}`);

    return new Response(
      JSON.stringify({ scored, skipped, duration_ms: duration, total: detections.length, fallbacks: fallbackUsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[score-agent-detections] error:", err);

    const msg = typeof err?.message === "string" && err.message.includes("<")
      ? "Upstream service temporarily unavailable"
      : (err.message || "Unknown error");

    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
