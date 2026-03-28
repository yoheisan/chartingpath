import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_NAME = "Batch 2 — Flags + Cup/Handle + Wedges";
const RESEED_REASON =
  "H1: Adaptive flag pole length by timeframe. L3: Tighter Cup/Handle retracement (60%→40%). M1: Linear regression wedge detection.";

const FLAG_PATTERNS = ["bull-flag", "bear-flag"];
const ALL_TIMEFRAME_PATTERNS = [
  "cup-and-handle",
  "inverse-cup-and-handle",
  "rising-wedge",
  "falling-wedge",
];
const ALL_PATTERNS = [...FLAG_PATTERNS, ...ALL_TIMEFRAME_PATTERNS];

// Flags only need reseed on 4H+ (1H pole=8 is unchanged)
const FLAG_RESEED_TIMEFRAMES = ["4h", "8h", "1d", "1wk"];
// Cup/Handle + Wedges reseed on all timeframes
const ALL_TIMEFRAMES = ["1h", "4h", "1d", "1wk"];
const ASSET_TYPES = ["fx", "crypto", "stocks", "commodities", "indices", "etfs"];

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { dryRun = true } = await req.json().catch(() => ({}));

  console.log(`[Reseed Batch 2] Starting. dryRun=${dryRun}`);

  try {
    // ── Step 0: Verify Batch 1 completed ──
    const { data: batch1 } = await supabase
      .from("reseed_audit_log")
      .select("status")
      .eq("reseed_batch", "Batch 1 — Symmetrical Triangle + Donchian")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (batch1?.status !== "completed") {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Batch 1 status is '${batch1?.status ?? "not found"}'. Must be 'completed' before starting Batch 2.`,
        }, null, 2),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Count existing detections ──
    const breakdownBefore: Record<string, number> = {};
    for (const pid of ALL_PATTERNS) {
      const { count } = await supabase
        .from("historical_pattern_occurrences")
        .select("*", { count: "exact", head: true })
        .eq("pattern_id", pid);
      breakdownBefore[pid] = count ?? 0;
    }

    // Count flag detections on affected timeframes only
    let flagAffectedCount = 0;
    for (const pid of FLAG_PATTERNS) {
      for (const tf of FLAG_RESEED_TIMEFRAMES) {
        const { count } = await supabase
          .from("historical_pattern_occurrences")
          .select("*", { count: "exact", head: true })
          .eq("pattern_id", pid)
          .eq("timeframe", tf);
        flagAffectedCount += count ?? 0;
      }
    }

    // Count 1H flag detections (will NOT be deleted)
    let flagPreservedCount = 0;
    for (const pid of FLAG_PATTERNS) {
      const { count } = await supabase
        .from("historical_pattern_occurrences")
        .select("*", { count: "exact", head: true })
        .eq("pattern_id", pid)
        .eq("timeframe", "1h");
      flagPreservedCount += count ?? 0;
    }

    const totalAffected = flagAffectedCount +
      ALL_TIMEFRAME_PATTERNS.reduce((s, p) => s + (breakdownBefore[p] ?? 0), 0);

    // ── Step 2: Snapshot pattern_hit_rates ──
    const { data: hitRates } = await supabase
      .from("pattern_hit_rates")
      .select("id, pattern_id, win_rate, total_signals")
      .in("pattern_id", ALL_PATTERNS);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          breakdownBefore,
          flagAffectedCount,
          flagPreservedOn1H: flagPreservedCount,
          totalAffected,
          hitRatesSnapshot: hitRates ?? [],
          message:
            "Dry run complete. Flag 1H detections will be preserved. Review counts above. Run with dryRun=false to execute.",
        }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════ LIVE RUN ═══════════════

    // ── Step 3: Log audit entry ──
    await supabase.from("reseed_audit_log").insert({
      reseed_batch: BATCH_NAME,
      pattern_id: ALL_PATTERNS.join(", "),
      reseed_reason: RESEED_REASON,
      detections_before: totalAffected,
      status: "running",
    });

    // ── Step 4: Mark pattern_hit_rates as reseeding ──
    for (const hr of hitRates ?? []) {
      await supabase
        .from("pattern_hit_rates")
        .update({
          is_reseeding: true,
          previous_win_rate: hr.win_rate,
          previous_sample_size: hr.total_signals,
        })
        .eq("id", hr.id);
    }

    // ── Step 5: Delete flag detections on affected timeframes ONLY ──
    console.log(`[Reseed Batch 2] Deleting ${flagAffectedCount} flag detections on 4H/8H/1D/1W...`);
    for (const pid of FLAG_PATTERNS) {
      for (const tf of FLAG_RESEED_TIMEFRAMES) {
        const { error: delErr } = await supabase
          .from("historical_pattern_occurrences")
          .delete()
          .eq("pattern_id", pid)
          .eq("timeframe", tf);
        if (delErr) {
          console.error(`[Reseed Batch 2] Delete error for ${pid}/${tf}:`, delErr);
        }
      }
    }
    console.log(`[Reseed Batch 2] Preserved ${flagPreservedCount} flag detections on 1H.`);

    // ── Step 6: Delete cup/handle and wedge detections on ALL timeframes ──
    for (const pid of ALL_TIMEFRAME_PATTERNS) {
      console.log(`[Reseed Batch 2] Deleting ${breakdownBefore[pid]} ${pid} detections...`);
      const { error: delErr } = await supabase
        .from("historical_pattern_occurrences")
        .delete()
        .eq("pattern_id", pid);
      if (delErr) {
        console.error(`[Reseed Batch 2] Delete error for ${pid}:`, delErr);
      }
    }

    // ── Step 7: Trigger re-detection ──
    let totalInserted = 0;
    const seedErrors: string[] = [];

    // 7a: Re-detect flags on affected timeframes only
    for (const timeframe of FLAG_RESEED_TIMEFRAMES) {
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        console.log(`[Reseed Batch 2] Seeding flags ${timeframe} offset=${offset}...`);
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/seed-historical-patterns-mtf`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                timeframe,
                assetTypes: ASSET_TYPES,
                maxInstrumentsPerType: 50,
                patterns: FLAG_PATTERNS,
                dryRun: false,
                offset,
                incrementalMode: false,
                forceFullBackfill: true,
              }),
            }
          );

          if (!response.ok) {
            const errText = await response.text();
            seedErrors.push(`flags/${timeframe}@${offset}: HTTP ${response.status} — ${errText.slice(0, 200)}`);
            hasMore = false;
            continue;
          }

          const data = await response.json();
          totalInserted += data.summary?.insertedCount ?? 0;
          hasMore = data.hasMore ?? false;
          offset = data.nextOffset ?? offset + 10;
          if (data.errors?.length) seedErrors.push(...data.errors.slice(0, 5));
        } catch (err: any) {
          seedErrors.push(`flags/${timeframe}@${offset}: ${err.message}`);
          hasMore = false;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // 7b: Re-detect cup/handle and wedges on all timeframes
    for (const timeframe of ALL_TIMEFRAMES) {
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        console.log(`[Reseed Batch 2] Seeding cup/handle+wedges ${timeframe} offset=${offset}...`);
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/seed-historical-patterns-mtf`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                timeframe,
                assetTypes: ASSET_TYPES,
                maxInstrumentsPerType: 50,
                patterns: ALL_TIMEFRAME_PATTERNS,
                dryRun: false,
                offset,
                incrementalMode: false,
                forceFullBackfill: true,
              }),
            }
          );

          if (!response.ok) {
            const errText = await response.text();
            seedErrors.push(`cup-wedge/${timeframe}@${offset}: HTTP ${response.status} — ${errText.slice(0, 200)}`);
            hasMore = false;
            continue;
          }

          const data = await response.json();
          totalInserted += data.summary?.insertedCount ?? 0;
          hasMore = data.hasMore ?? false;
          offset = data.nextOffset ?? offset + 10;
          if (data.errors?.length) seedErrors.push(...data.errors.slice(0, 5));
        } catch (err: any) {
          seedErrors.push(`cup-wedge/${timeframe}@${offset}: ${err.message}`);
          hasMore = false;
        }
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // ── Step 8: Count new detections ──
    const breakdownAfter: Record<string, number> = {};
    let detectionsAfter = 0;
    for (const pid of ALL_PATTERNS) {
      const { count } = await supabase
        .from("historical_pattern_occurrences")
        .select("*", { count: "exact", head: true })
        .eq("pattern_id", pid);
      breakdownAfter[pid] = count ?? 0;
      detectionsAfter += count ?? 0;
    }

    // ── Step 9: Unmark reseeding on pattern_hit_rates ──
    for (const hr of hitRates ?? []) {
      await supabase
        .from("pattern_hit_rates")
        .update({
          is_reseeding: false,
          last_reseeded_at: new Date().toISOString(),
          reseed_reason: RESEED_REASON,
          data_version: 2,
        })
        .eq("id", hr.id);
    }

    // ── Step 10: Mark audit log as completed ──
    await supabase
      .from("reseed_audit_log")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        detections_after: detectionsAfter,
      })
      .eq("reseed_batch", BATCH_NAME)
      .eq("status", "running");

    console.log(
      `[Reseed Batch 2] ✅ Complete. Affected: ${totalAffected}, After: ${detectionsAfter}, Inserted: ${totalInserted}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: false,
        totalAffected,
        detectionsAfter,
        totalInserted,
        breakdownBefore,
        breakdownAfter,
        flagPreservedOn1H: flagPreservedCount,
        seedErrors: seedErrors.slice(0, 20),
        message: "Batch 2 reseed complete.",
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Reseed Batch 2] Fatal error:", error);

    await supabase
      .from("reseed_audit_log")
      .update({ status: "failed" })
      .eq("reseed_batch", BATCH_NAME)
      .eq("status", "running");

    await supabase
      .from("pattern_hit_rates")
      .update({ is_reseeding: false })
      .in("pattern_id", ALL_PATTERNS);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
