import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_NAME = "FINAL — v2.0 Activated";

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { dryRun = true } = await req.json().catch(() => ({}));
  console.log(`[Reseed Finalise] Starting. dryRun=${dryRun}`);

  try {
    // ── Step 1: Verify all batches complete ──
    const { data: incompleteLogs } = await supabase
      .from("reseed_audit_log")
      .select("reseed_batch, status")
      .neq("status", "completed");

    // Filter out the finalisation entry itself if it exists from a prior run
    const reallyIncomplete = (incompleteLogs ?? []).filter(
      (l: any) => !l.reseed_batch.includes("FINAL")
    );

    if (reallyIncomplete.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Not all batches complete. Cannot finalise.",
          incomplete: reallyIncomplete,
        }, null, 2),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Generate before/after comparison report ──
    const { data: hitRates } = await supabase
      .from("pattern_hit_rates")
      .select("pattern_id, timeframe, win_rate, previous_win_rate, total_signals, previous_sample_size, data_version, is_reseeding");

    const report = (hitRates ?? []).map((s: any) => ({
      pattern: s.pattern_id,
      timeframe: s.timeframe,
      winRateBefore: s.previous_win_rate,
      winRateAfter: s.win_rate,
      winRateDelta: Number(((s.win_rate ?? 0) - (s.previous_win_rate ?? 0)).toFixed(4)),
      sampleBefore: s.previous_sample_size,
      sampleAfter: s.total_signals,
      version: s.data_version,
      stillReseeding: s.is_reseeding,
    }));

    const summary = {
      totalRows: report.length,
      upgradedToV2: report.filter((r: any) => r.version === 2).length,
      stillOnV1: report.filter((r: any) => r.version !== 2).length,
      stillReseeding: report.filter((r: any) => r.stillReseeding).length,
      avgWinRateBefore: report.length > 0
        ? Number((report.reduce((s: number, r: any) => s + (r.winRateBefore ?? 0), 0) / report.length).toFixed(4))
        : null,
      avgWinRateAfter: report.length > 0
        ? Number((report.reduce((s: number, r: any) => s + (r.winRateAfter ?? 0), 0) / report.length).toFixed(4))
        : null,
    };

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          summary,
          report: report.slice(0, 50),
          message: "Dry run complete. Review summary. Run with dryRun=false to activate v2.0.",
        }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Deactivate v1, activate v2 ──
    await supabase
      .from("platform_data_version")
      .update({ is_active: false })
      .eq("version", 1);

    await supabase
      .from("platform_data_version")
      .update({
        is_active: true,
        activated_at: new Date().toISOString(),
      })
      .eq("version", 2);

    // ── Step 4: Clear all reseeding flags ──
    // Process in batches to handle potentially many rows
    const { data: reseedingRows } = await supabase
      .from("pattern_hit_rates")
      .select("id")
      .eq("is_reseeding", true);

    if (reseedingRows && reseedingRows.length > 0) {
      const ids = reseedingRows.map((r: any) => r.id);
      const BATCH = 200;
      for (let i = 0; i < ids.length; i += BATCH) {
        await supabase
          .from("pattern_hit_rates")
          .update({
            is_reseeding: false,
            data_version: 2,
            last_reseeded_at: new Date().toISOString(),
          })
          .in("id", ids.slice(i, i + BATCH));
      }
      console.log(`[Reseed Finalise] Cleared reseeding flags on ${ids.length} rows`);
    }

    // Also set data_version=2 on any rows that weren't flagged as reseeding
    await supabase
      .from("pattern_hit_rates")
      .update({ data_version: 2 })
      .neq("data_version", 2);

    // ── Step 5: Log finalisation ──
    await supabase.from("reseed_audit_log").insert({
      reseed_batch: BATCH_NAME,
      pattern_id: "all-patterns",
      reseed_reason: "All detection methodology improvements applied and verified. v2.0 activated.",
      detections_before: summary.totalRows,
      detections_after: summary.upgradedToV2,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    console.log(`[Reseed Finalise] ✅ v2.0 activated. ${summary.upgradedToV2}/${summary.totalRows} rows on v2.`);

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: false,
        summary,
        report: report.slice(0, 50),
        message: "v2.0 activated. All reseeding flags cleared. DataQualityBanner will show completion state for 7 days.",
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Reseed Finalise] Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
