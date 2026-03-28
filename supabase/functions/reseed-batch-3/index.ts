import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_NAME = "Batch 3 — Triple Top/Bottom";
const TARGET_PATTERNS = ["triple-top", "triple-bottom"];
const RESEED_REASON =
  "H3: Stronger pivot detection radius (2-bar → 3-4 bar). Tighter peak tolerance (3% → 2.5%). Removes noise-driven false detections.";

const TIMEFRAMES = ["1h", "4h", "1d", "1wk"];
const ASSET_TYPES = ["fx", "crypto", "stocks", "commodities", "indices", "etfs"];

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { dryRun = true } = await req.json().catch(() => ({}));

  console.log(`[Reseed Batch 3] Starting. dryRun=${dryRun}`);

  try {
    // ── Step 0: Verify Batch 2 completed ──
    const { data: batch2 } = await supabase
      .from("reseed_audit_log")
      .select("status")
      .eq("reseed_batch", "Batch 2 — Flags + Cup/Handle + Wedges")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (batch2?.status !== "completed") {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Batch 2 status is '${batch2?.status ?? "not found"}'. Must be 'completed' before starting Batch 3.`,
        }, null, 2),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Count existing detections ──
    const breakdownBefore: Record<string, number> = {};
    let detectionsBefore = 0;
    for (const pid of TARGET_PATTERNS) {
      const { count } = await supabase
        .from("historical_pattern_occurrences")
        .select("*", { count: "exact", head: true })
        .eq("pattern_id", pid);
      breakdownBefore[pid] = count ?? 0;
      detectionsBefore += count ?? 0;
    }

    console.log(`[Reseed Batch 3] Existing detections: ${detectionsBefore}`);

    // ── Step 2: Snapshot pattern_hit_rates ──
    const { data: hitRates } = await supabase
      .from("pattern_hit_rates")
      .select("id, pattern_id, win_rate, total_signals")
      .in("pattern_id", TARGET_PATTERNS);

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          detectionsBefore,
          breakdownBefore,
          hitRatesSnapshot: hitRates ?? [],
          message:
            "Dry run complete. Review counts above. Run with dryRun=false to execute.",
        }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════ LIVE RUN ═══════════════

    // ── Step 3: Log audit entry ──
    await supabase.from("reseed_audit_log").insert({
      reseed_batch: BATCH_NAME,
      pattern_id: TARGET_PATTERNS.join(", "),
      reseed_reason: RESEED_REASON,
      detections_before: detectionsBefore,
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

    // ── Step 5: Delete existing historical occurrences ──
    console.log(`[Reseed Batch 3] Deleting ${detectionsBefore} historical occurrences...`);
    for (const pid of TARGET_PATTERNS) {
      const { error: delErr } = await supabase
        .from("historical_pattern_occurrences")
        .delete()
        .eq("pattern_id", pid);
      if (delErr) {
        console.error(`[Reseed Batch 3] Delete error for ${pid}:`, delErr);
      } else {
        console.log(`[Reseed Batch 3] Deleted ${pid}: ${breakdownBefore[pid]} rows`);
      }
    }

    // ── Step 6: Trigger re-detection ──
    let totalInserted = 0;
    const seedErrors: string[] = [];

    for (const timeframe of TIMEFRAMES) {
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        console.log(`[Reseed Batch 3] Seeding ${timeframe} offset=${offset}...`);

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
                patterns: TARGET_PATTERNS,
                dryRun: false,
                offset,
                incrementalMode: false,
                forceFullBackfill: true,
              }),
            }
          );

          if (!response.ok) {
            const errText = await response.text();
            seedErrors.push(`${timeframe}@${offset}: HTTP ${response.status} — ${errText.slice(0, 200)}`);
            hasMore = false;
            continue;
          }

          const data = await response.json();
          totalInserted += data.summary?.insertedCount ?? 0;
          hasMore = data.hasMore ?? false;
          offset = data.nextOffset ?? offset + 10;

          if (data.errors?.length) {
            seedErrors.push(...data.errors.slice(0, 5));
          }
        } catch (err: any) {
          seedErrors.push(`${timeframe}@${offset}: ${err.message}`);
          hasMore = false;
        }

        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // ── Step 7: Count new detections ──
    const breakdownAfter: Record<string, number> = {};
    let detectionsAfter = 0;
    for (const pid of TARGET_PATTERNS) {
      const { count } = await supabase
        .from("historical_pattern_occurrences")
        .select("*", { count: "exact", head: true })
        .eq("pattern_id", pid);
      breakdownAfter[pid] = count ?? 0;
      detectionsAfter += count ?? 0;
    }

    // ── Step 8: Unmark reseeding on pattern_hit_rates ──
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

    // ── Step 9: Mark audit log as completed ──
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
      `[Reseed Batch 3] ✅ Complete. Before: ${detectionsBefore}, After: ${detectionsAfter}, Inserted: ${totalInserted}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: false,
        detectionsBefore,
        detectionsAfter,
        totalInserted,
        breakdownBefore,
        breakdownAfter,
        seedErrors: seedErrors.slice(0, 20),
        message: "Batch 3 reseed complete. Detection count expected to decrease — stricter pivot filter removes noise.",
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Reseed Batch 3] Fatal error:", error);

    await supabase
      .from("reseed_audit_log")
      .update({ status: "failed" })
      .eq("reseed_batch", BATCH_NAME)
      .eq("status", "running");

    await supabase
      .from("pattern_hit_rates")
      .update({ is_reseeding: false })
      .in("pattern_id", TARGET_PATTERNS);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
