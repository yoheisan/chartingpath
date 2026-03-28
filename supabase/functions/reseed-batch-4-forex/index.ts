import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_NAME = "Batch 4 — Forex Bracket Recalculation";
const RESEED_REASON =
  "H4: Minimum stop floor increased from 0.3% to 0.5% for Forex instruments. Historical SL levels were too tight.";
const FOREX_MIN_STOP_PCT = 0.005; // 0.5%
const PAGE_SIZE = 1000;

interface Bar {
  open: number;
  high: number;
  low: number;
  close: number;
  date: string;
  volume?: number;
}

/**
 * Re-derive outcome using bars data with new SL/TP levels.
 * Returns { outcome, barsToOutcome, outcomePrice, outcomeDate } or null if no resolution.
 */
function deriveOutcome(
  bars: Bar[],
  entryPrice: number,
  newSl: number,
  newTp: number,
  direction: string,
  patternEndIndex: number
): { outcome: string; barsToOutcome: number; outcomePrice: number; outcomeDate: string } | null {
  const isLong = direction === "bullish" || direction === "long";

  // Scan bars after pattern end (entry bar onwards)
  for (let i = patternEndIndex; i < bars.length; i++) {
    const bar = bars[i];

    if (isLong) {
      // Check SL first (conservative)
      if (bar.low <= newSl) {
        return { outcome: "hit_sl", barsToOutcome: i - patternEndIndex + 1, outcomePrice: newSl, outcomeDate: bar.date };
      }
      if (bar.high >= newTp) {
        return { outcome: "hit_tp", barsToOutcome: i - patternEndIndex + 1, outcomePrice: newTp, outcomeDate: bar.date };
      }
    } else {
      // Short: SL is above entry, TP is below
      if (bar.high >= newSl) {
        return { outcome: "hit_sl", barsToOutcome: i - patternEndIndex + 1, outcomePrice: newSl, outcomeDate: bar.date };
      }
      if (bar.low <= newTp) {
        return { outcome: "hit_tp", barsToOutcome: i - patternEndIndex + 1, outcomePrice: newTp, outcomeDate: bar.date };
      }
    }
  }

  return null; // No resolution in available bars
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { dryRun = true } = await req.json().catch(() => ({}));
  console.log(`[Reseed Batch 4] Starting. dryRun=${dryRun}`);

  try {
    // ── Step 0: Verify Batch 3 completed ──
    const { data: batch3 } = await supabase
      .from("reseed_audit_log")
      .select("status")
      .eq("reseed_batch", "Batch 3 — Triple Top/Bottom")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (batch3?.status !== "completed") {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Batch 3 status is '${batch3?.status ?? "not found"}'. Must be 'completed' before starting Batch 4.`,
        }, null, 2),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Count forex occurrences with tight stops ──
    const { count: totalFx } = await supabase
      .from("historical_pattern_occurrences")
      .select("*", { count: "exact", head: true })
      .eq("asset_type", "fx");

    // We need to fetch and check stop % in code since SQL expression filters aren't available
    let totalAffected = 0;
    let outcomeFlipped = 0;
    let recalculated = 0;
    let unchanged = 0;
    let noResolution = 0;
    const flipDetails: Array<{ id: string; symbol: string; oldOutcome: string; newOutcome: string }> = [];

    // Process in pages
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error: fetchErr } = await supabase
        .from("historical_pattern_occurrences")
        .select("id, symbol, entry_price, stop_loss_price, take_profit_price, direction, outcome, outcome_price, outcome_date, bars_to_outcome, risk_reward_ratio, bars, pattern_end_date")
        .eq("asset_type", "fx")
        .order("id")
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchErr) {
        console.error(`[Reseed Batch 4] Fetch error at offset ${offset}:`, fetchErr);
        break;
      }

      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }

      for (const occ of batch) {
        const entry = Number(occ.entry_price);
        const currentSl = Number(occ.stop_loss_price);
        const currentTp = Number(occ.take_profit_price);

        if (entry <= 0 || currentSl <= 0) continue;

        const stopPct = Math.abs(entry - currentSl) / entry;

        // Only recalculate if stop was below the new 0.5% floor
        if (stopPct >= FOREX_MIN_STOP_PCT) {
          unchanged++;
          continue;
        }

        totalAffected++;
        const isLong = occ.direction === "bullish" || occ.direction === "long";

        // Calculate new SL with 0.5% floor
        const newMinStop = entry * FOREX_MIN_STOP_PCT;
        const newSl = isLong ? entry - newMinStop : entry + newMinStop;

        // Scale TP to maintain original R:R ratio
        const rr = Number(occ.risk_reward_ratio) || 2;
        const newTpDistance = newMinStop * rr;
        const newTp = isLong ? entry + newTpDistance : entry - newTpDistance;

        // Re-derive outcome using bars data
        const bars: Bar[] = Array.isArray(occ.bars) ? occ.bars : [];

        // Find the entry bar index (pattern_end_date marks the last bar of the pattern)
        let entryBarIdx = 0;
        if (occ.pattern_end_date && bars.length > 0) {
          const endDate = new Date(occ.pattern_end_date).getTime();
          for (let i = 0; i < bars.length; i++) {
            if (new Date(bars[i].date).getTime() >= endDate) {
              entryBarIdx = i + 1; // Entry is the bar after pattern end
              break;
            }
          }
        }

        const derived = deriveOutcome(bars, entry, newSl, newTp, occ.direction, entryBarIdx);

        const oldOutcome = occ.outcome;
        const newOutcome = derived?.outcome ?? "pending";
        const outcomeChanged = oldOutcome !== newOutcome && derived !== null;

        if (outcomeChanged) {
          outcomeFlipped++;
          if (flipDetails.length < 50) {
            flipDetails.push({ id: occ.id, symbol: occ.symbol, oldOutcome: oldOutcome ?? "null", newOutcome });
          }
        }

        recalculated++;

        if (!dryRun && derived) {
          await supabase
            .from("historical_pattern_occurrences")
            .update({
              stop_loss_price: newSl,
              take_profit_price: newTp,
              outcome: derived.outcome,
              outcome_price: derived.outcomePrice,
              outcome_date: derived.outcomeDate,
              bars_to_outcome: derived.barsToOutcome,
            })
            .eq("id", occ.id);
        } else if (!dryRun && !derived) {
          // Update brackets but keep outcome as-is if we can't re-derive
          noResolution++;
          await supabase
            .from("historical_pattern_occurrences")
            .update({
              stop_loss_price: newSl,
              take_profit_price: newTp,
            })
            .eq("id", occ.id);
        } else if (dryRun && !derived) {
          noResolution++;
        }
      }

      offset += PAGE_SIZE;
      if (batch.length < PAGE_SIZE) hasMore = false;

      // Throttle
      await new Promise((r) => setTimeout(r, 200));
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          totalForex: totalFx ?? 0,
          totalAffected,
          unchanged,
          recalculated,
          outcomeFlipped,
          noResolution,
          sampleFlips: flipDetails.slice(0, 20),
          message: "Dry run complete. Review affected counts. Run with dryRun=false to execute.",
        }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Audit log ──
    await supabase.from("reseed_audit_log").insert({
      reseed_batch: BATCH_NAME,
      pattern_id: "all-patterns",
      reseed_reason: RESEED_REASON,
      detections_before: totalFx ?? 0,
      detections_after: totalFx ?? 0, // count unchanged, only brackets updated
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    console.log(
      `[Reseed Batch 4] ✅ Complete. Affected: ${totalAffected}, Recalculated: ${recalculated}, Flipped: ${outcomeFlipped}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: false,
        totalForex: totalFx ?? 0,
        totalAffected,
        unchanged,
        recalculated,
        outcomeFlipped,
        noResolution,
        sampleFlips: flipDetails.slice(0, 20),
        message: "Batch 4 Forex bracket recalculation complete.",
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Reseed Batch 4] Fatal error:", error);

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
