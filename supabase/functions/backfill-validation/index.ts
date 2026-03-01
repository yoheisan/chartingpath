import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// BACKFILL VALIDATION — Parallel Sharded Edition
//
// Architecture:
//  • Parallel workers: 1 per asset class (stocks, etf, crypto, forex, indices)
//    → 5 concurrent workers × 500 batch × 60 runs/hr = 150,000 records/hr
//  • Shard-aware advisory lock: prevents same-shard concurrent runs
//    but allows different shards to run simultaneously
//  • Watermark pattern per shard: each shard tracks its own last_watermark
//  • Seeding gate: 05:00-12:00 UTC (ETF seed finishes ~11:50 UTC)
//  • Global market coverage:
//    APAC pre-market 23:00 UTC → cleared before Tokyo open
//    EU   pre-market 07:00 UTC → cleared before London open
//    US   pre-market 13:00 UTC → cleared before NYSE open
// ============================================================

// Asset class shards — mirrors the seeding pipeline partitions
export const ASSET_SHARDS = ["stocks", "etf", "crypto", "forex", "indices", "commodities"] as const;
type AssetShard = typeof ASSET_SHARDS[number];

// Asset type values stored in historical_pattern_occurrences.asset_type
const SHARD_ASSET_TYPES: Record<AssetShard, string[]> = {
  stocks:      ["stocks", "stock", "equity"],
  etf:         ["etf", "ETF", "etfs"],
  crypto:      ["crypto", "cryptocurrency"],
  forex:       ["forex", "fx", "currency"],
  indices:     ["indices", "index", "indice"],
  commodities: ["commodities", "commodity"],
};

const BASE_WORKER_NAME = "backfill-validation";
const BATCH_SIZE        = 500;  // 5× increase: 500 × 60 runs/hr = 30k/hr per shard
const SEEDING_START_UTC = 5;
const SEEDING_END_UTC   = 12;   // ETFs finish ~11:50 UTC; re-open at 12:00

interface BackfillRequest {
  batch_size?:   number;
  shard?:        AssetShard;   // which asset class to process (default: all via single-run)
  pattern_name?: string;
  symbol?:       string;
  timeframe?:    string;
  dry_run?:      boolean;
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

  const body = await req.json().catch(() => ({})) as BackfillRequest;
  const {
    batch_size   = BATCH_SIZE,
    shard,
    pattern_name,
    symbol,
    timeframe,
    dry_run      = false,
    force        = false,
  } = body;

  // Shard-scoped worker name so each asset class has independent:
  //   • advisory lock key
  //   • watermark
  //   • circuit breaker state
  const workerName = shard ? `${BASE_WORKER_NAME}:${shard}` : BASE_WORKER_NAME;

  // ──────────────────────────────────────────────────────────
  // 1. Pre-flight gate check (circuit breaker + seeding window)
  // ──────────────────────────────────────────────────────────
  if (!force) {
    const { data: gateData, error: gateError } = await supabase.rpc("check_worker_can_run", {
      p_worker_name:      workerName,
      p_seeding_start_utc: SEEDING_START_UTC,
      p_seeding_end_utc:  SEEDING_END_UTC,
    });

    if (gateError) {
      console.error(`[${workerName}] Gate check failed:`, gateError.message);
      return jsonError(`Gate check failed: ${gateError.message}`, 500);
    }

    const gate = gateData as { can_run: boolean; reason: string; [key: string]: unknown };

    if (!gate.can_run) {
      console.info(`[${workerName}] Skipping — ${gate.reason}`, gate);
      return new Response(
        JSON.stringify({ success: true, skipped: true, shard, ...gate }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`[${workerName}] Gate passed. watermark=${gate.last_watermark ?? "none"}`);
  } else {
    console.info(`[${workerName}] Force=true, bypassing gate checks`);
  }

  // ──────────────────────────────────────────────────────────
  // 2. Acquire shard-scoped advisory lock
  //    Different shards can run concurrently.
  //    Same shard is protected from duplicate execution.
  // ──────────────────────────────────────────────────────────
  const { data: lockAcquired, error: lockError } = await supabase.rpc("acquire_worker_lock", {
    p_worker_name: workerName,
  });

  if (lockError || !lockAcquired) {
    console.warn(`[${workerName}] Lock held — another instance running for this shard`);
    return new Response(
      JSON.stringify({ success: true, skipped: true, shard, reason: "lock_held_by_another_instance" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  await supabase.rpc("mark_worker_running", { p_worker_name: workerName });

  try {
    // ──────────────────────────────────────────────────────────
    // 3. Fetch shard watermark
    // ──────────────────────────────────────────────────────────
    const { data: workerState } = await supabase
      .from("worker_runs")
      .select("last_watermark")
      .eq("worker_name", workerName)
      .single();

    const lastWatermark: string | null = workerState?.last_watermark ?? null;

    // ──────────────────────────────────────────────────────────
    // 4. Build batch query — shard-filtered + watermarked
    // ──────────────────────────────────────────────────────────
    let query = supabase
      .from("historical_pattern_occurrences")
      .select(
        "id, pattern_name, direction, entry_price, stop_loss_price, take_profit_price, symbol, timeframe, bars, quality_score, trend_alignment, asset_type, validation_status, created_at",
      )
      .eq("validation_status", "pending")
      .order("created_at", { ascending: true })
      .limit(batch_size);

    if (lastWatermark) {
      query = query.gt("created_at", lastWatermark);
    }

    // Shard filter: only process this shard's asset types
    if (shard && SHARD_ASSET_TYPES[shard]) {
      query = query.in("asset_type", SHARD_ASSET_TYPES[shard]);
    }

    // Optional admin overrides
    if (pattern_name) query = query.eq("pattern_name", pattern_name);
    if (symbol)       query = query.eq("symbol", symbol);
    if (timeframe)    query = query.eq("timeframe", timeframe);

    const { data: patterns, error: fetchError } = await query;

    if (fetchError) {
      const isTimeout = fetchError.message?.includes("statement timeout") || fetchError.code === "57014";
      await failureCleanup(supabase, workerName, fetchError.message, isTimeout);
      return jsonError(fetchError.message, isTimeout ? 504 : 500);
    }

    if (!patterns || patterns.length === 0) {
      console.info(`[${workerName}] Caught up — no pending patterns above watermark`);
      await supabase.rpc("record_worker_success", {
        p_worker_name: workerName,
        p_metadata:    { last_run_result: "caught_up", shard, ran_at: new Date().toISOString() },
      });
      await supabase.rpc("release_worker_lock", { p_worker_name: workerName });
      return new Response(
        JSON.stringify({
          success:        true,
          message:        "All caught up — no pending patterns above watermark",
          shard,
          last_watermark: lastWatermark,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`[${workerName}] Processing ${patterns.length} patterns (watermark: ${lastWatermark ?? "start"})`);

    // ──────────────────────────────────────────────────────────
    // 5. Dry-run mode
    // ──────────────────────────────────────────────────────────
    if (dry_run) {
      await supabase.rpc("release_worker_lock", { p_worker_name: workerName });
      return new Response(
        JSON.stringify({
          success:        true,
          dry_run:        true,
          shard,
          batch_count:    patterns.length,
          watermark_start: lastWatermark,
          watermark_end:  patterns[patterns.length - 1].created_at,
          sample_ids:     patterns.slice(0, 5).map((p: any) => p.id),
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
      await failureCleanup(supabase, workerName, l2Error.message);
      return jsonError(`Layer 2 failed: ${l2Error.message}`, 500);
    }

    // ──────────────────────────────────────────────────────────
    // 7. Advance shard watermark
    // ──────────────────────────────────────────────────────────
    const newWatermark = patterns[patterns.length - 1].created_at as string;

    await supabase.rpc("record_worker_success", {
      p_worker_name:   workerName,
      p_new_watermark: newWatermark,
      p_metadata: {
        shard,
        last_batch_size: patterns.length,
        last_watermark:  newWatermark,
        l2_summary:      l2Result?.summary ?? {},
        ran_at:          new Date().toISOString(),
      },
    });

    console.info(`[${workerName}] Batch complete. New watermark: ${newWatermark}`);

    const result = {
      success:         true,
      shard,
      batch_processed: patterns.length,
      watermark_start: lastWatermark,
      watermark_end:   newWatermark,
      has_more:        patterns.length === batch_size,
      l2_summary:      l2Result?.summary ?? {},
    };

    await supabase.rpc("release_worker_lock", { p_worker_name: workerName });
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = msg.includes("statement timeout") || msg.includes("57014");
    await failureCleanup(supabase, workerName, msg, isTimeout);
    return jsonError(msg, isTimeout ? 504 : 500);
  }
});

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

async function failureCleanup(
  supabase: ReturnType<typeof createClient>,
  workerName: string,
  errorMsg: string,
  _isTimeout = false,
) {
  console.error(`[${workerName}] Failure:`, errorMsg);
  try {
    await supabase.rpc("record_worker_failure", {
      p_worker_name:       workerName,
      p_error:             errorMsg,
      p_circuit_threshold: 3,
      p_circuit_open_mins: 30,
    });
    await supabase.rpc("release_worker_lock", { p_worker_name: workerName });
  } catch (e) {
    console.error(`[${workerName}] Failed to record failure state:`, e);
  }
}

function jsonError(message: string, status: number) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
