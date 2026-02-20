import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// BACKFILL VALIDATION — Stateful Edition
//
// Architecture:
//  • Persistent circuit breaker via worker_runs table (survives cold boots)
//  • Advisory lock (pg_try_advisory_lock) prevents concurrent instances
//  • Watermark pattern: resumes from last successfully processed created_at,
//    so every cold boot doesn't re-scan from row 0
//  • Seeding window awareness: silently no-ops 05:00-12:00 UTC
// ============================================================

const WORKER_NAME  = "backfill-validation";
const BATCH_SIZE   = 50;  // Increased now that we have proper indexing + watermark

interface BackfillRequest {
  batch_size?:   number;
  pattern_name?: string;
  symbol?:       string;
  timeframe?:    string;
  dry_run?:      boolean;
  // Admin override: force-run even during seeding window
  force?:        boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // ──────────────────────────────────────────────────────────
  // 1. Pre-flight: check worker_runs state
  //    Covers circuit breaker + seeding window + stale lock
  // ──────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({})) as BackfillRequest;
  const { batch_size = BATCH_SIZE, pattern_name, symbol, timeframe, dry_run = false, force = false } = body;

  if (!force) {
    const { data: gateData, error: gateError } = await supabase.rpc("check_worker_can_run", {
      p_worker_name: WORKER_NAME,
    });

    if (gateError) {
      console.error(`[${WORKER_NAME}] Gate check failed:`, gateError.message);
      return jsonError(`Gate check failed: ${gateError.message}`, 500);
    }

    const gate = gateData as { can_run: boolean; reason: string; [key: string]: unknown };

    if (!gate.can_run) {
      console.info(`[${WORKER_NAME}] Skipping — reason: ${gate.reason}`, gate);
      return new Response(
        JSON.stringify({ success: true, skipped: true, ...gate }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`[${WORKER_NAME}] Gate passed. last_watermark=${gate.last_watermark ?? "none"}`);
  } else {
    console.info(`[${WORKER_NAME}] Force=true, bypassing gate checks`);
  }

  // ──────────────────────────────────────────────────────────
  // 2. Acquire advisory lock — prevents concurrent runs
  // ──────────────────────────────────────────────────────────
  const { data: lockAcquired, error: lockError } = await supabase.rpc("acquire_worker_lock", {
    p_worker_name: WORKER_NAME,
  });

  if (lockError || !lockAcquired) {
    console.warn(`[${WORKER_NAME}] Could not acquire advisory lock — another instance is running`);
    return new Response(
      JSON.stringify({ success: true, skipped: true, reason: "lock_held_by_another_instance" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Mark running in the coordination table
  await supabase.rpc("mark_worker_running", { p_worker_name: WORKER_NAME });

  try {
    // ──────────────────────────────────────────────────────────
    // 3. Fetch current watermark from worker_runs
    //    We query records AFTER the watermark so we never
    //    reprocess already-validated rows on cold boot.
    // ──────────────────────────────────────────────────────────
    const { data: workerState } = await supabase
      .from("worker_runs")
      .select("last_watermark")
      .eq("worker_name", WORKER_NAME)
      .single();

    const lastWatermark: string | null = workerState?.last_watermark ?? null;

    // ──────────────────────────────────────────────────────────
    // 4. Fetch a batch of unvalidated patterns
    //    Always uses the composite index: (validation_status, created_at)
    // ──────────────────────────────────────────────────────────
    let query = supabase
      .from("historical_pattern_occurrences")
      .select(
        "id, pattern_name, direction, entry_price, stop_loss_price, take_profit_price, symbol, timeframe, bars, quality_score, trend_alignment, validation_status, created_at",
      )
      .or("validation_status.eq.pending,validation_status.is.null")
      .order("created_at", { ascending: true })
      .limit(batch_size);

    // Watermark filter: only process records newer than last successful batch
    if (lastWatermark) {
      query = query.gt("created_at", lastWatermark);
    }

    // Optional filters (admin/manual overrides)
    if (pattern_name) query = query.eq("pattern_name", pattern_name);
    if (symbol)       query = query.eq("symbol", symbol);
    if (timeframe)    query = query.eq("timeframe", timeframe);

    const { data: patterns, error: fetchError } = await query;

    if (fetchError) {
      const isTimeout = fetchError.message?.includes("statement timeout") || fetchError.code === "57014";
      await failureCleanup(supabase, fetchError.message, isTimeout);
      return jsonError(fetchError.message, isTimeout ? 504 : 500);
    }

    if (!patterns || patterns.length === 0) {
      console.info(`[${WORKER_NAME}] No unvalidated patterns above watermark — all caught up`);
      await supabase.rpc("record_worker_success", {
        p_worker_name: WORKER_NAME,
        p_metadata: { last_run_result: "caught_up", ran_at: new Date().toISOString() },
      });
      await supabase.rpc("release_worker_lock", { p_worker_name: WORKER_NAME });
      return new Response(
        JSON.stringify({
          success: true,
          message: "All caught up — no pending patterns above watermark",
          last_watermark: lastWatermark,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`[${WORKER_NAME}] Processing ${patterns.length} patterns (watermark: ${lastWatermark ?? "start"})`);

    // ──────────────────────────────────────────────────────────
    // 5. Dry-run mode: preview without touching DB
    // ──────────────────────────────────────────────────────────
    if (dry_run) {
      await supabase.rpc("release_worker_lock", { p_worker_name: WORKER_NAME });
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          batch_count: patterns.length,
          watermark_start: lastWatermark,
          watermark_end: patterns[patterns.length - 1].created_at,
          sample_ids: patterns.slice(0, 5).map((p: any) => p.id),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ──────────────────────────────────────────────────────────
    // 6. Send batch through Layer 2 (Context Validator)
    // ──────────────────────────────────────────────────────────
    const detections = patterns.map((p: any) => ({
      detection_id:      p.id,
      detection_source:  "historical" as const,
      pattern_name:      p.pattern_name,
      direction:         p.direction,
      entry_price:       p.entry_price,
      stop_loss_price:   p.stop_loss_price,
      take_profit_price: p.take_profit_price,
      symbol:            p.symbol,
      timeframe:         p.timeframe,
      bars:              Array.isArray(p.bars) ? p.bars : [],
      quality_score:     p.quality_score,
      trend_alignment:   p.trend_alignment,
    }));

    const { data: l2Result, error: l2Error } = await supabase.functions.invoke(
      "validate-pattern-context",
      { body: { detections } },
    );

    if (l2Error) {
      await failureCleanup(supabase, l2Error.message);
      return jsonError(`Layer 2 failed: ${l2Error.message}`, 500);
    }

    // ──────────────────────────────────────────────────────────
    // 7. Advance watermark to the max created_at in this batch
    //    Only advance on success so failed batches are retried
    // ──────────────────────────────────────────────────────────
    const newWatermark = patterns[patterns.length - 1].created_at as string;

    await supabase.rpc("record_worker_success", {
      p_worker_name:   WORKER_NAME,
      p_new_watermark: newWatermark,
      p_metadata: {
        last_batch_size: patterns.length,
        last_watermark:  newWatermark,
        l2_summary:      l2Result?.summary ?? {},
        ran_at:          new Date().toISOString(),
      },
    });

    console.info(`[${WORKER_NAME}] Batch complete. New watermark: ${newWatermark}`);

    const result = {
      success:         true,
      batch_processed: patterns.length,
      watermark_start: lastWatermark,
      watermark_end:   newWatermark,
      has_more:        patterns.length === batch_size,
      l2_summary:      l2Result?.summary ?? {},
    };

    await supabase.rpc("release_worker_lock", { p_worker_name: WORKER_NAME });
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = msg.includes("statement timeout") || msg.includes("57014");
    await failureCleanup(supabase, msg, isTimeout);
    return jsonError(msg, isTimeout ? 504 : 500);
  }
});

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

async function failureCleanup(
  supabase: ReturnType<typeof createClient>,
  errorMsg: string,
  _isTimeout = false,
) {
  console.error(`[${WORKER_NAME}] Failure:`, errorMsg);
  try {
    await supabase.rpc("record_worker_failure", {
      p_worker_name:       WORKER_NAME,
      p_error:             errorMsg,
      p_circuit_threshold: 3,
      p_circuit_open_mins: 30,
    });
    await supabase.rpc("release_worker_lock", { p_worker_name: WORKER_NAME });
  } catch (e) {
    console.error(`[${WORKER_NAME}] Failed to record failure state:`, e);
  }
}

function jsonError(message: string, status: number) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
