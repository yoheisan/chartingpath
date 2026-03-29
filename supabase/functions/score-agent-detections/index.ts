import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  fetchPatternStatsBatch,
  BAYESIAN_PRIOR_WIN_RATE,
  BAYESIAN_PRIOR_EXPECTANCY,
  BAYESIAN_VIRTUAL_SAMPLE,
  type PatternStatsResult,
} from "../_shared/statsEnrichment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PROOF_GATE_MIN_SAMPLE = 15;
const PROOF_GATE_MIN_WIN_RATE = 0.45;
const BATCH_SIZE = 100;

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
    const raw = Math.min(1, trendScore * 0.5 + 1.0 * 0.5 + 0.12);
    return {
      raw,
      details: {
        trendScore,
        eventScore: 1.0,
        eventCount: 0,
        highCount: 0,
        mediumCount: 0,
        timingWindow: {
          daysUntilNextHighImpact: null,
          isExtendedClean: true,
          bonus: 3,
        },
      },
    };
  }

  const instrument = (d.instrument || "").toUpperCase();
  const now = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  const relevantEvents = economicEvents.filter((e: any) => {
    const currency = (e.currency || e.country_code || "").toUpperCase();
    return instrument.includes(currency) || currency.includes(instrument.slice(0, 3));
  });

  const eventsIn3Days = relevantEvents.filter((e: any) => {
    const eventTime = new Date(e.scheduled_time || e.date).getTime();
    return eventTime >= now && eventTime <= now + THREE_DAYS_MS;
  });

  let eventScore = 1.0;
  let highCount3d = 0;
  let mediumCount3d = 0;

  for (const event of eventsIn3Days) {
    const impact = (event.impact || event.impact_level || "").toLowerCase();
    if (impact === "high") { eventScore -= 0.15; highCount3d++; }
    else if (impact === "medium") { eventScore -= 0.06; mediumCount3d++; }
  }
  eventScore = Math.max(0, Math.min(1, eventScore));

  const highImpactAll = relevantEvents.filter((e: any) => {
    const impact = (e.impact || e.impact_level || "").toLowerCase();
    return impact === "high";
  });

  let daysUntilNextHighImpact: number | null = null;
  if (highImpactAll.length > 0) {
    const sorted = [...highImpactAll].sort(
      (a, b) => new Date(a.scheduled_time || a.date).getTime() - new Date(b.scheduled_time || b.date).getTime()
    );
    daysUntilNextHighImpact = Math.round(
      (new Date(sorted[0].scheduled_time || sorted[0].date).getTime() - now) / (1000 * 60 * 60 * 24) * 10
    ) / 10;
  }

  let extendedBonus = 0;
  if (relevantEvents.length === 0) {
    extendedBonus = 0.12;
  } else if (highImpactAll.length === 0) {
    extendedBonus = 0.08;
  }

  const raw = Math.min(1, trendScore * 0.5 + eventScore * 0.5 + extendedBonus);

  return {
    raw,
    details: {
      trendScore,
      eventScore: Math.round(eventScore * 100) / 100,
      eventCount: eventsIn3Days.length,
      highCount: highCount3d,
      mediumCount: mediumCount3d,
      timingWindow: {
        daysUntilNextHighImpact,
        isExtendedClean: highImpactAll.length === 0,
        bonus: extendedBonus === 0.12 ? 3 : extendedBonus === 0.08 ? 2 : 0,
      },
    },
  };
}

// ── Portfolio Agent (quality-grade proxy, no basket context) ─────────────
function scorePortfolio(d: any): number {
  const gradeMap: Record<string, number> = { A: 0.95, B: 0.78, C: 0.55, D: 0.35, F: 0.15 };
  return gradeMap[d.quality_score || "C"] ?? 0.55;
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
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const { data: economicEvents } = await supabase
      .from("economic_events")
      .select("*")
      .gte("scheduled_time", now.toISOString())
      .lte("scheduled_time", in7d.toISOString());

    // 3. Batch-fetch stats for data-poor detections via shared enrichment module
    const dataPoorDetections = detections.filter((d: any) => {
      const hp = d.historical_performance;
      const sampleSize = hp?.sampleSize ?? hp?.sample_size ?? 0;
      return sampleSize < 5;
    });

    let enrichedStats = new Map<string, PatternStatsResult>();
    if (dataPoorDetections.length > 0) {
      console.log(`[score-agent-detections] ${dataPoorDetections.length} detections have sparse live data, fetching via shared statsEnrichment...`);
      enrichedStats = await fetchPatternStatsBatch(
        supabase,
        dataPoorDetections.map((d: any) => ({ patternId: d.pattern_id, symbol: d.instrument })),
        dataPoorDetections[0]?.timeframe || "1d"
      );
    }

    // 4. Score in batches and upsert
    let scored = 0;
    let skipped = 0;
    let fallbackUsed = { per_symbol_db: 0, pattern_aggregate: 0, bayesian_prior: 0 };

    for (let i = 0; i < detections.length; i += BATCH_SIZE) {
      const batch = detections.slice(i, i + BATCH_SIZE);

      const rows = batch.map((d: any) => {
        let hp = d.historical_performance;
        const originalSampleSize = hp?.sampleSize ?? hp?.sample_size ?? 0;
        let analystSource = "per_symbol";

        // Fallback chain for data-poor detections (now via shared module)
        if (originalSampleSize < 5) {
          const key = `${d.instrument}||${d.pattern_id}`;
          const enriched = enrichedStats.get(key);
          if (enriched) {
            hp = { winRate: enriched.winRate, avgRMultiple: enriched.expectancy, sampleSize: enriched.sampleSize };
            analystSource = enriched.source;
            if (enriched.source === "per_symbol") fallbackUsed.per_symbol_db++;
            else if (enriched.source === "pattern_aggregate") fallbackUsed.pattern_aggregate++;
            else fallbackUsed.bayesian_prior++;
          } else {
            // Safety net — should not happen since batch always returns bayesian prior
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
