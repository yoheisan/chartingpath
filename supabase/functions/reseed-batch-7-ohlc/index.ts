import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_NAME = "Batch 7 — 4H/8H Full Reseed (OHLC Fix)";
const RESEED_REASON =
  "L4: OHLC aggregation audit confirmed errors in High/Low values for aggregated 4H/8H bars. All 4H and 8H pattern detections require full reseeding with corrected OHLC data.";
const PAGE_SIZE = 1000;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { dryRun = true, timeframe = "4h" } = await req.json().catch(() => ({}));

  if (!["4h", "8h"].includes(timeframe)) {
    return new Response(
      JSON.stringify({ success: false, error: `Invalid timeframe '${timeframe}'. Must be '4h' or '8h'.` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`[Reseed Batch 7] Starting. dryRun=${dryRun}, timeframe=${timeframe}`);

  try {
    // ── Step 0: Verify Batch 6 completed ──
    const { data: batch6 } = await supabase
      .from("reseed_audit_log")
      .select("status")
      .eq("reseed_batch", "Batch 6 — Score Recalculation Pass")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (batch6?.status !== "completed") {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Batch 6 status is '${batch6?.status ?? "not found"}'. Must be 'completed' before starting Batch 7.`,
        }, null, 2),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Check OHLC audit result ──
    // Look for audit-ohlc-aggregation results — if NO_RESEED_NEEDED, skip
    const { data: auditLog } = await supabase
      .from("reseed_audit_log")
      .select("reseed_reason, status")
      .ilike("reseed_batch", "%OHLC%audit%")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    // If no audit found, we allow manual override but warn
    const auditSkipped = !auditLog;
    const auditSaysNoReseed = auditLog?.reseed_reason?.includes("NO_RESEED_NEEDED");

    if (auditSaysNoReseed) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          message: "OHLC audit returned NO_RESEED_NEEDED. Batch 7 is not required. Skip to Phase 9.",
        }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Count affected records ──
    const { count: totalCount } = await supabase
      .from("historical_pattern_occurrences")
      .select("*", { count: "exact", head: true })
      .eq("timeframe", timeframe);

    // Get unique instruments on this timeframe
    const instrumentSet = new Set<string>();
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: rows } = await supabase
        .from("historical_pattern_occurrences")
        .select("symbol")
        .eq("timeframe", timeframe)
        .order("symbol")
        .range(offset, offset + PAGE_SIZE - 1);

      if (!rows || rows.length === 0) {
        hasMore = false;
        break;
      }

      for (const r of rows) instrumentSet.add(r.symbol);
      offset += PAGE_SIZE;
      if (rows.length < PAGE_SIZE) hasMore = false;
    }

    const uniqueInstruments = [...instrumentSet];

    console.log(`[Reseed Batch 7] ${timeframe}: ${totalCount} occurrences across ${uniqueInstruments.length} instruments`);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          timeframe,
          totalOccurrences: totalCount ?? 0,
          uniqueInstruments: uniqueInstruments.length,
          sampleInstruments: uniqueInstruments.slice(0, 20),
          auditSkipped,
          message: `Dry run complete for ${timeframe}. ${totalCount} occurrences across ${uniqueInstruments.length} instruments would be deleted and re-detected.`,
        }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Log start ──
    await supabase.from("reseed_audit_log").insert({
      reseed_batch: BATCH_NAME,
      pattern_id: "all-patterns",
      reseed_reason: `${RESEED_REASON} [${timeframe}]`,
      detections_before: totalCount ?? 0,
      status: "running",
    });

    // ── Step 4: Snapshot pattern_hit_rates for this timeframe ──
    const { data: hitRates } = await supabase
      .from("pattern_hit_rates")
      .select("id, win_rate, total_signals")
      .eq("timeframe", timeframe);

    if (hitRates) {
      for (const hr of hitRates) {
        await supabase
          .from("pattern_hit_rates")
          .update({
            is_reseeding: true,
            previous_win_rate: hr.win_rate,
            previous_sample_size: hr.total_signals,
          })
          .eq("id", hr.id);
      }
    }

    // ── Step 5: Delete all historical occurrences on this timeframe ──
    // Delete in batches to avoid timeout
    let deletedTotal = 0;
    let deleteMore = true;

    while (deleteMore) {
      const { data: toDelete } = await supabase
        .from("historical_pattern_occurrences")
        .select("id")
        .eq("timeframe", timeframe)
        .limit(PAGE_SIZE);

      if (!toDelete || toDelete.length === 0) {
        deleteMore = false;
        break;
      }

      const ids = toDelete.map((r: any) => r.id);
      await supabase
        .from("historical_pattern_occurrences")
        .delete()
        .in("id", ids);

      deletedTotal += ids.length;
      console.log(`[Reseed Batch 7] ${timeframe}: deleted ${deletedTotal} occurrences...`);
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log(`[Reseed Batch 7] ${timeframe}: deleted ${deletedTotal} total. Starting re-detection...`);

    // ── Step 6: Re-detect patterns using corrected OHLC aggregation ──
    const BATCH_SIZE = 20;
    let processedInstruments = 0;

    for (let i = 0; i < uniqueInstruments.length; i += BATCH_SIZE) {
      const batch = uniqueInstruments.slice(i, i + BATCH_SIZE);

      for (const instrument of batch) {
        try {
          await supabase.functions.invoke("seed-historical-patterns-mtf", {
            body: {
              instruments: [instrument],
              timeframes: [timeframe],
              patterns: "all",
              forceFullBackfill: true,
            },
          });
        } catch (err: any) {
          console.error(`[Reseed Batch 7] Error re-detecting ${instrument}:`, err.message);
        }
        await new Promise((r) => setTimeout(r, 300));
      }

      processedInstruments += batch.length;
      console.log(`[Reseed Batch 7] ${timeframe}: ${processedInstruments}/${uniqueInstruments.length} instruments re-detected`);
    }

    // ── Step 7: Count new detections ──
    const { count: newCount } = await supabase
      .from("historical_pattern_occurrences")
      .select("*", { count: "exact", head: true })
      .eq("timeframe", timeframe);

    // ── Step 8: Clear reseeding flags ──
    if (hitRates) {
      for (const hr of hitRates) {
        await supabase
          .from("pattern_hit_rates")
          .update({
            is_reseeding: false,
            last_reseeded_at: new Date().toISOString(),
            reseed_reason: `Batch 7 OHLC fix [${timeframe}]`,
            data_version: 2,
          })
          .eq("id", hr.id);
      }
    }

    // ── Step 9: Update audit log ──
    await supabase
      .from("reseed_audit_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        detections_after: newCount ?? 0,
      })
      .eq("reseed_batch", BATCH_NAME)
      .eq("status", "running");

    console.log(
      `[Reseed Batch 7] ✅ ${timeframe} complete. Before: ${totalCount}, After: ${newCount}, Instruments: ${uniqueInstruments.length}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: false,
        timeframe,
        detectionsBefore: totalCount ?? 0,
        detectionsAfter: newCount ?? 0,
        instrumentsProcessed: uniqueInstruments.length,
        message: `Batch 7 ${timeframe} OHLC reseed complete.`,
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(`[Reseed Batch 7] Fatal error (${timeframe}):`, error);

    await supabase
      .from("reseed_audit_log")
      .update({ status: "failed" })
      .eq("reseed_batch", BATCH_NAME)
      .eq("status", "running");

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
