import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_NAME = "Batch 5 — Stocks/Indices/Commodities ATR Recalculation";
const RESEED_REASON =
  "C2: ATR now uses true range (H/L/prevC) instead of close-to-close. Stocks/indices gap overnight — previous ATR was systematically underestimated, causing overly tight stops.";
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
 * Compute True Range ATR from bars.
 * True Range = max(H-L, |H-prevC|, |L-prevC|)
 * This correctly accounts for overnight gaps.
 */
function computeTrueRangeAtr(bars: Bar[], period = 14): number | null {
  if (bars.length < period + 1) return null;

  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const h = bars[i].high;
    const l = bars[i].low;
    const prevC = bars[i - 1].close;
    const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) return null;

  // Simple moving average for initial ATR, then EMA
  let atr = trueRanges.slice(0, period).reduce((s, v) => s + v, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
  }

  return atr;
}

/**
 * Re-derive outcome using bars data with new SL/TP levels.
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

  for (let i = patternEndIndex; i < bars.length; i++) {
    const bar = bars[i];
    if (isLong) {
      if (bar.low <= newSl) {
        return { outcome: "hit_sl", barsToOutcome: i - patternEndIndex + 1, outcomePrice: newSl, outcomeDate: bar.date };
      }
      if (bar.high >= newTp) {
        return { outcome: "hit_tp", barsToOutcome: i - patternEndIndex + 1, outcomePrice: newTp, outcomeDate: bar.date };
      }
    } else {
      if (bar.high >= newSl) {
        return { outcome: "hit_sl", barsToOutcome: i - patternEndIndex + 1, outcomePrice: newSl, outcomeDate: bar.date };
      }
      if (bar.low <= newTp) {
        return { outcome: "hit_tp", barsToOutcome: i - patternEndIndex + 1, outcomePrice: newTp, outcomeDate: bar.date };
      }
    }
  }

  return null;
}

/**
 * Classify asset type from symbol string.
 */
function classifyAsset(symbol: string): string {
  if (/^[\^]/.test(symbol)) return "indices";
  if (/=F$/i.test(symbol)) return "commodities";
  if (/=X$/i.test(symbol) || /USD|EUR|GBP|JPY|AUD|CAD|NZD|CHF/i.test(symbol)) return "fx";
  if (/USDT?$|BTC|ETH|SOL|BNB|XRP/i.test(symbol)) return "crypto";
  return "stocks";
}

/**
 * Get the asset_type value used in the DB for filtering.
 */
function getDbAssetType(assetClass: string): string {
  const map: Record<string, string> = {
    stocks: "stocks",
    indices: "indices",
    commodities: "commodities",
  };
  return map[assetClass] ?? assetClass;
}

/**
 * Minimum stop percent by asset class (from bracketLevels.ts).
 */
const MIN_STOP_PCT: Record<string, number> = {
  stocks: 0.005,       // 0.5%
  indices: 0.003,      // 0.3%
  commodities: 0.006,  // 0.6%
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { dryRun = true, assetClass = "stocks" } = await req.json().catch(() => ({}));

  if (!["stocks", "indices", "commodities"].includes(assetClass)) {
    return new Response(
      JSON.stringify({ success: false, error: `Invalid assetClass '${assetClass}'. Must be stocks, indices, or commodities.` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`[Reseed Batch 5] Starting. dryRun=${dryRun}, assetClass=${assetClass}`);

  try {
    // ── Step 0: Verify Batch 4 completed ──
    const { data: batch4 } = await supabase
      .from("reseed_audit_log")
      .select("status")
      .eq("reseed_batch", "Batch 4 — Forex Bracket Recalculation")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (batch4?.status !== "completed") {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Batch 4 status is '${batch4?.status ?? "not found"}'. Must be 'completed' before starting Batch 5.`,
        }, null, 2),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dbAssetType = getDbAssetType(assetClass);
    const minStopPct = MIN_STOP_PCT[assetClass] ?? 0.005;

    // ── Step 1: Count total occurrences ──
    const { count: totalCount } = await supabase
      .from("historical_pattern_occurrences")
      .select("*", { count: "exact", head: true })
      .eq("asset_type", dbAssetType);

    let totalProcessed = 0;
    let atrRecalculated = 0;
    let bracketsUpdated = 0;
    let outcomeFlipped = 0;
    let unchanged = 0;
    let noResolution = 0;
    let insufficientBars = 0;
    const flipDetails: Array<{ id: string; symbol: string; oldOutcome: string; newOutcome: string; oldAtr: number; newAtr: number }> = [];

    // ── Step 2: Process in pages ──
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error: fetchErr } = await supabase
        .from("historical_pattern_occurrences")
        .select("id, symbol, entry_price, stop_loss_price, take_profit_price, direction, outcome, outcome_price, outcome_date, bars_to_outcome, risk_reward_ratio, bars, pattern_end_date")
        .eq("asset_type", dbAssetType)
        .order("id")
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchErr) {
        console.error(`[Reseed Batch 5] Fetch error at offset ${offset}:`, fetchErr);
        break;
      }

      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }

      for (const occ of batch) {
        totalProcessed++;
        const entry = Number(occ.entry_price);
        const currentSl = Number(occ.stop_loss_price);
        const currentTp = Number(occ.take_profit_price);

        if (entry <= 0 || currentSl <= 0) {
          unchanged++;
          continue;
        }

        const bars: Bar[] = Array.isArray(occ.bars) ? occ.bars : [];

        // Need enough bars for ATR(14) calculation
        if (bars.length < 16) {
          insufficientBars++;
          unchanged++;
          continue;
        }

        // Compute true range ATR from the bars leading up to pattern end
        let entryBarIdx = 0;
        if (occ.pattern_end_date && bars.length > 0) {
          const endDate = new Date(occ.pattern_end_date).getTime();
          for (let i = 0; i < bars.length; i++) {
            if (new Date(bars[i].date).getTime() >= endDate) {
              entryBarIdx = i + 1;
              break;
            }
          }
        }

        // Use bars up to entry for ATR calculation
        const atrBars = bars.slice(0, Math.max(entryBarIdx, 15));
        const newAtr = computeTrueRangeAtr(atrBars);

        if (newAtr === null || newAtr <= 0) {
          insufficientBars++;
          unchanged++;
          continue;
        }

        // Old ATR approximation: close-to-close would have been smaller for gapping instruments
        // We can estimate old ATR from the current stop distance if it was ATR-based
        const currentStopDist = Math.abs(entry - currentSl);
        const isLong = occ.direction === "bullish" || occ.direction === "long";

        // Recalculate SL using true range ATR with 2× multiplier (standard)
        const atrMultiplier = 2.0;
        const minAtrMultiplier = 1.0;
        let newStopDist = newAtr * atrMultiplier;

        // Apply ATR floor: SL must be >= 1× ATR
        const atrFloor = newAtr * minAtrMultiplier;
        if (newStopDist < atrFloor) newStopDist = atrFloor;

        // Apply minimum percent floor
        const minPercentDist = entry * minStopPct;
        if (newStopDist < minPercentDist) newStopDist = minPercentDist;

        // If new stop is not materially different (within 2%), skip
        if (Math.abs(newStopDist - currentStopDist) / currentStopDist < 0.02) {
          unchanged++;
          continue;
        }

        atrRecalculated++;

        const newSl = isLong ? entry - newStopDist : entry + newStopDist;

        // Scale TP to maintain original R:R ratio
        const rr = Number(occ.risk_reward_ratio) || 2;
        const newTpDist = newStopDist * rr;
        const newTp = isLong ? entry + newTpDist : entry - newTpDist;

        // Re-derive outcome
        const derived = deriveOutcome(bars, entry, newSl, newTp, occ.direction, entryBarIdx);

        const oldOutcome = occ.outcome;
        const newOutcome = derived?.outcome ?? "pending";
        const outcomeChanged = oldOutcome !== newOutcome && derived !== null;

        if (outcomeChanged) {
          outcomeFlipped++;
          if (flipDetails.length < 50) {
            flipDetails.push({
              id: occ.id,
              symbol: occ.symbol,
              oldOutcome: oldOutcome ?? "null",
              newOutcome,
              oldAtr: currentStopDist / atrMultiplier,
              newAtr,
            });
          }
        }

        bracketsUpdated++;

        if (!dryRun && derived) {
          await supabase
            .from("historical_pattern_occurrences")
            .update({
              stop_loss_price: Number(newSl.toFixed(8)),
              take_profit_price: Number(newTp.toFixed(8)),
              outcome: derived.outcome,
              outcome_price: derived.outcomePrice,
              outcome_date: derived.outcomeDate,
              bars_to_outcome: derived.barsToOutcome,
            })
            .eq("id", occ.id);
        } else if (!dryRun && !derived) {
          noResolution++;
          await supabase
            .from("historical_pattern_occurrences")
            .update({
              stop_loss_price: Number(newSl.toFixed(8)),
              take_profit_price: Number(newTp.toFixed(8)),
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
      console.log(`[Reseed Batch 5] ${assetClass}: processed ${offset} rows...`);
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          assetClass,
          totalInAssetClass: totalCount ?? 0,
          totalProcessed,
          atrRecalculated,
          bracketsUpdated,
          outcomeFlipped,
          unchanged,
          noResolution,
          insufficientBars,
          sampleFlips: flipDetails.slice(0, 20),
          message: `Dry run complete for ${assetClass}. Review affected counts. Run with dryRun=false to execute.`,
        }, null, 2),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Audit log ──
    await supabase.from("reseed_audit_log").insert({
      reseed_batch: BATCH_NAME,
      pattern_id: "all-patterns",
      reseed_reason: `${RESEED_REASON} [${assetClass}]`,
      detections_before: totalCount ?? 0,
      detections_after: totalCount ?? 0,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    console.log(
      `[Reseed Batch 5] ✅ ${assetClass} complete. Recalculated: ${atrRecalculated}, Brackets updated: ${bracketsUpdated}, Flipped: ${outcomeFlipped}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        dryRun: false,
        assetClass,
        totalInAssetClass: totalCount ?? 0,
        totalProcessed,
        atrRecalculated,
        bracketsUpdated,
        outcomeFlipped,
        unchanged,
        noResolution,
        insufficientBars,
        sampleFlips: flipDetails.slice(0, 20),
        message: `Batch 5 ATR recalculation complete for ${assetClass}.`,
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error(`[Reseed Batch 5] Fatal error (${assetClass}):`, error);

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
