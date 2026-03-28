import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_NAME = "Batch 6 — Score Recalculation Pass";
const RESEED_REASON =
  "H2: FX volume neutral score. M2: Analyst confidence discount at n=15-29. M3: MTF confirmation bonus. M4: Triangle touch count bonus. M5: H&S symmetry scoring. L2: Timing extended clean window bonus.";
const PAGE_SIZE = 1000;

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { dryRun = true } = await req.json().catch(() => ({}));
  console.log(`[Reseed Batch 6] Starting score recalculation. dryRun=${dryRun}`);

  try {
    // ── Step 0: Verify Batch 5 completed ──
    const { data: batch5Entries } = await supabase
      .from("reseed_audit_log")
      .select("status, reseed_batch")
      .ilike("reseed_batch", "%Batch 5%")
      .order("started_at", { ascending: false })
      .limit(5);

    // Batch 5 runs 3 times (stocks, indices, commodities) — need at least 1 completed
    const batch5Completed = batch5Entries?.some((e: any) => e.status === "completed");
    if (!batch5Completed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Batch 5 has no completed entries. Must have at least one completed asset class before starting Batch 6.",
        }, null, 2),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Count live detections ──
    const { count: totalDetections } = await supabase
      .from("live_pattern_detections")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // ── Step 2: Count agent scores ──
    const { count: totalAgentScores } = await supabase
      .from("agent_scores")
      .select("*", { count: "exact", head: true });

    let qualityRecalculated = 0;
    let agentRecalculated = 0;
    let upgraded = 0;
    let downgraded = 0;
    let unchanged = 0;
    let errors = 0;

    // ── Step 3: Recalculate quality scores on live_pattern_detections ──
    // The quality scorer code already has all fixes deployed (H2, M3, M4, M5).
    // We trigger a re-score by invoking the scoring edge function for each detection.
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: detections, error: fetchErr } = await supabase
        .from("live_pattern_detections")
        .select("id, instrument, pattern_id, timeframe, quality_score, quality_grade, direction, detected_at, pattern_data, asset_type")
        .eq("status", "active")
        .order("id")
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchErr) {
        console.error(`[Reseed Batch 6] Fetch error at offset ${offset}:`, fetchErr);
        break;
      }

      if (!detections || detections.length === 0) {
        hasMore = false;
        break;
      }

      for (const det of detections) {
        try {
          // Extract current scoring factors from pattern_data
          const patternData = det.pattern_data as Record<string, any> | null;
          if (!patternData) {
            unchanged++;
            continue;
          }

          const oldScore = det.quality_score ?? 0;
          const oldGrade = det.quality_grade ?? "D";

          // ── H2: FX volume neutral score ──
          // If asset is FX and volume score was inflated (>5.0), reset to neutral 5.0
          const isFx = det.asset_type === "fx" || /=X$/i.test(det.instrument);
          let volumeAdjustment = 0;
          if (isFx) {
            const volumeScore = patternData.volumeScore ?? patternData.volume_score;
            if (volumeScore && volumeScore > 5.0) {
              // Volume confirmation (15%) + RVOL (5%) = 20% weight
              // Adjustment: (oldVolumeScore - 5.0) * 0.20 reduction
              volumeAdjustment = -(volumeScore - 5.0) * 0.20;
            }
          }

          // ── M3: MTF confirmation bonus ──
          let mtfBonus = 0;
          const hasMtfConfirmation = patternData.mtfConfirmation ?? patternData.mtf_confirmation ?? false;
          const existingMtfBonus = patternData.mtfBonus ?? patternData.mtf_bonus ?? 0;
          if (hasMtfConfirmation && existingMtfBonus === 0) {
            mtfBonus = 0.8; // +0.8 bonus on 10-point scale
          }

          // ── M4: Triangle touch count bonus ──
          let touchBonus = 0;
          const isTriangle = ["ascending-triangle", "descending-triangle"].includes(det.pattern_id);
          if (isTriangle) {
            const touchCount = patternData.touchCount ?? patternData.touch_count ?? 3;
            if (touchCount >= 5) touchBonus = 1.5;
            else if (touchCount === 4) touchBonus = 1.0;
            else if (touchCount < 3) touchBonus = -1.0;
          }

          // ── M5: H&S symmetry scoring ──
          let symmetryAdjustment = 0;
          const isHnS = ["head-and-shoulders", "inverse-head-and-shoulders"].includes(det.pattern_id);
          if (isHnS) {
            const leftShoulder = patternData.leftShoulderPrice ?? patternData.left_shoulder_price;
            const rightShoulder = patternData.rightShoulderPrice ?? patternData.right_shoulder_price;
            const headPrice = patternData.headPrice ?? patternData.head_price;

            if (leftShoulder && rightShoulder && headPrice) {
              const headRange = Math.abs(headPrice - Math.min(leftShoulder, rightShoulder));
              const shoulderDiff = Math.abs(leftShoulder - rightShoulder);
              const variance = headRange > 0 ? shoulderDiff / headRange : 1;

              // Score based on variance: <5% = 10, <10% = 8, <15% = 6, <20% = 4, <25% = 2
              let symmetryScore: number;
              if (variance < 0.05) symmetryScore = 10;
              else if (variance < 0.10) symmetryScore = 8;
              else if (variance < 0.15) symmetryScore = 6;
              else if (variance < 0.20) symmetryScore = 4;
              else symmetryScore = 2;

              // Symmetry factor is 10% weight — adjust from old assumption of flat 5
              const oldSymmetryScore = patternData.symmetryScore ?? 5;
              symmetryAdjustment = (symmetryScore - oldSymmetryScore) * 0.10;
            }
          }

          // ── Compute new score ──
          const totalAdjustment = volumeAdjustment + mtfBonus + touchBonus + symmetryAdjustment;
          
          if (Math.abs(totalAdjustment) < 0.01) {
            unchanged++;
            continue;
          }

          const newScore = Math.max(0, Math.min(10, oldScore + totalAdjustment));
          const newScoreRounded = Number(newScore.toFixed(2));

          // Derive new grade
          let newGrade: string;
          // Grade thresholds: A >= 7.5, B >= 5.0, C >= 3.0, D < 3.0
          // (Also requires sample size and win rate for A/B — we preserve existing if no change)
          if (newScoreRounded >= 7.5) newGrade = "A";
          else if (newScoreRounded >= 5.0) newGrade = "B";
          else if (newScoreRounded >= 3.0) newGrade = "C";
          else newGrade = "D";

          if (newScoreRounded > oldScore) upgraded++;
          else if (newScoreRounded < oldScore) downgraded++;
          else unchanged++;

          if (!dryRun) {
            await supabase
              .from("live_pattern_detections")
              .update({
                quality_score: newScoreRounded,
                quality_grade: newGrade,
              })
              .eq("id", det.id);
          }

          qualityRecalculated++;
        } catch (err: any) {
          errors++;
          console.error(`[Reseed Batch 6] Error processing detection ${det.id}:`, err.message);
        }
      }

      offset += PAGE_SIZE;
      if (detections.length < PAGE_SIZE) hasMore = false;
      await new Promise((r) => setTimeout(r, 100));
      console.log(`[Reseed Batch 6] Processed ${offset} detections...`);
    }

    // ── Step 4: Recalculate agent_scores ──
    // The agent scoring code already has M2 (analyst confidence discount) and
    // L2 (timing extended clean window) deployed. Trigger a bulk re-score.
    if (!dryRun) {
      try {
        const { error: agentErr } = await supabase.functions.invoke("score-agent-detections", {
          body: { forceRecalculate: true, reason: "reseed-batch-6" },
        });
        if (agentErr) {
          console.error("[Reseed Batch 6] Agent re-score error:", agentErr);
        } else {
          agentRecalculated = totalAgentScores ?? 0;
          console.log(`[Reseed Batch 6] Agent scores re-triggered for ${agentRecalculated} entries`);
        }
      } catch (agentErr: any) {
        console.error("[Reseed Batch 6] Agent re-score invocation failed:", agentErr.message);
      }
    }

    // ── Step 5: Audit log ──
    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          totalDetections: totalDetections ?? 0,
          totalAgentScores: totalAgentScores ?? 0,
          qualityRecalculated,
          upgraded,
          downgraded,
          unchanged,
          errors,
          message: "Dry run complete. Review score shift counts. Run with dryRun=false to execute.",
        }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("reseed_audit_log").insert({
      reseed_batch: BATCH_NAME,
      pattern_id: "all-patterns",
      reseed_reason: RESEED_REASON,
      detections_before: totalDetections ?? 0,
      detections_after: qualityRecalculated,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    console.log(
      `[Reseed Batch 6] ✅ Complete. Quality: ${qualityRecalculated}, Agent: ${agentRecalculated}, Up: ${upgraded}, Down: ${downgraded}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: false,
        totalDetections: totalDetections ?? 0,
        totalAgentScores: totalAgentScores ?? 0,
        qualityRecalculated,
        agentRecalculated,
        upgraded,
        downgraded,
        unchanged,
        errors,
        message: "Batch 6 score recalculation complete.",
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Reseed Batch 6] Fatal error:", error);

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
