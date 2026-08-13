import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSlippageBps, getTotalSlippageBps, applyAdverseSlippage } from "../_shared/slippage-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Forex helpers ──
function isForexSymbol(symbol: string): boolean {
  return symbol.endsWith("=X");
}

function getForexPipSize(symbol: string): number {
  return symbol.toUpperCase().includes("JPY") ? 0.01 : 0.0001;
}

function priceToPips(symbol: string, priceMove: number): number {
  return priceMove / getForexPipSize(symbol);
}

function getForexPipValue(symbol: string, lotSize: number): number {
  const pipSize = getForexPipSize(symbol);
  const lotUnits = lotSize * 100_000;
  return pipSize * lotUnits;
}

function calcForexPnl(symbol: string, priceMove: number, lotSize: number): number {
  const pips = priceToPips(symbol, Math.abs(priceMove));
  const pipValue = getForexPipValue(symbol, lotSize);
  return (priceMove >= 0 ? 1 : -1) * pips * pipValue;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data: openTrades, error: fetchErr } = await supabase
      .from("paper_trades")
      .select("*, master_plan_id")
      .eq("status", "open");

    if (fetchErr) throw fetchErr;
    if (!openTrades?.length) {
      return new Response(
        JSON.stringify({ ok: true, message: "No open trades", closed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let closedCount = 0;
    let updatedCount = 0;

    for (const trade of openTrades) {
      // ── Price feed staleness / orphan check ──
      // NOTE: detections are a *downstream* product, not a price feed. Sourcing
      // price/freshness only from live_pattern_detections is the same inverted
      // dependency that killed FX (see refresh-fx-prices). historical_prices is the
      // authoritative feed; detections are only a fallback.
      const { data: freshnessRow } = await supabase
        .from("live_pattern_detections")
        .select("last_confirmed_at")
        .eq("instrument", trade.symbol)
        .eq("status", "active")
        .order("last_confirmed_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      const { data: latestBar } = await supabase
        .from("historical_prices")
        .select("date, close")
        .eq("symbol", trade.symbol)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const detectionTs = freshnessRow?.last_confirmed_at
        ? new Date(freshnessRow.last_confirmed_at)
        : null;
      const barTs = latestBar?.date ? new Date(latestBar.date) : null;
      const lastConfirmed = [detectionTs, barTs]
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const feedStale = !lastConfirmed || lastConfirmed < fourHoursAgo;

      if (feedStale) {
        if (!trade.monitoring_paused) {
          await supabase
            .from("paper_trades")
            .update({ monitoring_paused: true })
            .eq("id", trade.id);
        }
        console.log(
          `[manage-trades] PAUSED monitoring ${trade.symbol} — price feed stale since ${lastConfirmed?.toISOString() ?? "never"}. Manual review required.`
        );
        continue;
      }

      // Feed is fresh — resume if previously paused
      if (trade.monitoring_paused) {
        await supabase
          .from("paper_trades")
          .update({ monitoring_paused: false })
          .eq("id", trade.id);
        console.log(`[manage-trades] RESUMED monitoring ${trade.symbol} — feed restored`);
      }

      let currentPrice: number | null = latestBar?.close ? Number(latestBar.close) : null;
      if (!currentPrice) {
        const { data: priceData } = await supabase
          .from("live_pattern_detections")
          .select("current_price")
          .eq("instrument", trade.symbol)
          .order("first_detected_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        currentPrice = priceData?.current_price ? Number(priceData.current_price) : null;
      }

      if (!currentPrice) continue;

      const entryPrice = Number(trade.entry_price);
      const stopLoss = Number(trade.stop_loss);
      const takeProfit = Number(trade.take_profit);

      // ── PRICE SANITY GUARD ──────────────────────────────────────────────
      // A price wildly away from the trade's own entry means a cross-instrument
      // lookup, a unit/scale mismatch or a stale bar from another timeframe.
      // Never close a trade on such a price — log and skip.
      const MAX_PRICE_DEVIATION = 0.5; // 50%
      if (
        !Number.isFinite(currentPrice) ||
        currentPrice <= 0 ||
        (entryPrice > 0 && Math.abs(currentPrice - entryPrice) / entryPrice > MAX_PRICE_DEVIATION)
      ) {
        console.error(
          `[manage-trades] REJECTED price for ${trade.symbol}: price=${currentPrice} entry=${entryPrice} ` +
            `(deviation > ${MAX_PRICE_DEVIATION * 100}%). Trade ${trade.id} left open, monitoring paused.`
        );
        if (!trade.monitoring_paused) {
          await supabase
            .from("paper_trades")
            .update({ monitoring_paused: true })
            .eq("id", trade.id);
        }
        continue;
      }

      const isLong = trade.trade_type === "long" || trade.trade_type === "buy";
      const positionPct = Number(trade.position_size_pct || 3);
      // R is defined by the ORIGINAL stop distance, never by position sizing.
      const initialStop = Number(trade.initial_stop_loss ?? trade.stop_loss);
      const riskDistance = Math.abs(entryPrice - initialStop);
      const rUnit = riskDistance > 0 ? riskDistance : entryPrice * (positionPct / 100);
      const quantity = Number(trade.quantity);
      const createdAt = new Date(trade.created_at);
      const holdMins = Math.round((Date.now() - createdAt.getTime()) / 60000);

      // Detect forex
      const isForex = trade.instrument_type === "forex" || isForexSymbol(trade.symbol);
      const forexLotSize = isForex ? Number(trade.forex_lot_size || 0.01) : 0;

      // ── Per-trade slippage (base + size impact) ──
      const baseBps = getSlippageBps(trade.asset_type, trade.symbol);
      const notionalUsd = currentPrice * quantity;
      const totalSlippageBps = getTotalSlippageBps(baseBps, notionalUsd);

      // Calculate current PnL
      const priceMove = isLong
        ? currentPrice - entryPrice
        : entryPrice - currentPrice;
      const pnlR = rUnit > 0 ? Math.round((priceMove / rUnit) * 100) / 100 : 0;

      // ── Latency estimation ──
      const detectionLatencyMs = lastConfirmed
        ? Math.round(Date.now() - lastConfirmed.getTime())
        : null;

      // Check stop loss hit
      const stopHit = isLong
        ? currentPrice <= stopLoss
        : currentPrice >= stopLoss;

      // Check take profit hit
      const tpHit = isLong
        ? currentPrice >= takeProfit
        : currentPrice <= takeProfit;

      if (stopHit) {
        // ── Level-triggered exit: the fill IS the stop level (plus modelled
        //    slippage). Never a free-floating market price — that is what
        //    produced -187R rows. A stop exit is -1R by construction.
        const fillPrice = applyAdverseSlippage(stopLoss, !isLong, totalSlippageBps);
        const slMove = isLong ? fillPrice - entryPrice : entryPrice - fillPrice;
        const exitPnlR = Math.max(-1.05, rUnit > 0 ? slMove / rUnit : -1);
        const exitPnlDollars = isForex
          ? calcForexPnl(trade.symbol, slMove, forexLotSize)
          : slMove * quantity;

        const exitDetectedAt = new Date();
        const closedAtStr = exitDetectedAt.toISOString();
        const cooldownUntilStr = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
        const priceCrossedAt = lastConfirmed ? lastConfirmed.toISOString() : closedAtStr;

        await supabase
          .from("paper_trades")
          .update({
            status: "closed",
            exit_price: Math.round(fillPrice * 1e8) / 1e8,
            pnl: Math.round(exitPnlDollars * 100) / 100,
            outcome_r: Math.round(exitPnlR * 100) / 100,
            closed_at: closedAtStr,
            close_reason: "Stop loss hit",
            hold_duration_mins: holdMins,
            outcome: "loss",
            cooldown_until: cooldownUntilStr,
            ideal_exit_price: stopLoss,
            slippage_bps: totalSlippageBps,
            detection_latency_ms: detectionLatencyMs,
            price_crossed_at: priceCrossedAt,
          })
          .eq("id", trade.id);

        closedCount++;
        console.log(
          `[manage-trades] Stop hit: ${trade.symbol} ${exitPnlR.toFixed(2)}R | fill=${fillPrice.toFixed(4)} ideal=${stopLoss} latency=${detectionLatencyMs}ms ${isForex ? '(forex)' : ''}`
        );
        continue;
      }

      if (tpHit) {
        // ── Level-triggered exit: the fill IS the target level (plus slippage) ──
        const fillPrice = applyAdverseSlippage(takeProfit, !isLong, totalSlippageBps);
        const tpMove = isLong ? fillPrice - entryPrice : entryPrice - fillPrice;
        const exitPnlR = rUnit > 0 ? tpMove / rUnit : 0;
        const exitPnlDollars = isForex
          ? calcForexPnl(trade.symbol, tpMove, forexLotSize)
          : tpMove * quantity;

        const tpDetectedAt = new Date();
        const tpPriceCrossedAt = lastConfirmed ? lastConfirmed.toISOString() : tpDetectedAt.toISOString();

        await supabase
          .from("paper_trades")
          .update({
            status: "closed",
            exit_price: Math.round(fillPrice * 1e8) / 1e8,
            pnl: Math.round(exitPnlDollars * 100) / 100,
            outcome_r: Math.round(exitPnlR * 100) / 100,
            closed_at: tpDetectedAt.toISOString(),
            close_reason: "Take profit hit",
            hold_duration_mins: holdMins,
            outcome: "win",
            ideal_exit_price: takeProfit,
            slippage_bps: totalSlippageBps,
            detection_latency_ms: detectionLatencyMs,
            price_crossed_at: tpPriceCrossedAt,
          })
          .eq("id", trade.id);

        closedCount++;
        console.log(
          `[manage-trades] TP hit: ${trade.symbol} +${exitPnlR.toFixed(2)}R | fill=${fillPrice.toFixed(4)} ideal=${takeProfit} latency=${detectionLatencyMs}ms ${isForex ? '(forex)' : ''}`
        );
        continue;
      }

      // Trailing stop logic
      let newStop = stopLoss;
      if (isLong) {
        if (currentPrice >= entryPrice + 2 * rUnit) {
          newStop = Math.max(stopLoss, entryPrice + rUnit);
        } else if (currentPrice >= entryPrice + rUnit) {
          newStop = Math.max(stopLoss, entryPrice);
        }
      } else {
        if (currentPrice <= entryPrice - 2 * rUnit) {
          newStop = Math.min(stopLoss, entryPrice - rUnit);
        } else if (currentPrice <= entryPrice - rUnit) {
          newStop = Math.min(stopLoss, entryPrice);
        }
      }

      if (newStop !== stopLoss) {
        await supabase
          .from("paper_trades")
          .update({ stop_loss: newStop })
          .eq("id", trade.id);

        updatedCount++;
        console.log(`[manage-trades] Trailing stop updated: ${trade.symbol} → ${newStop}`);
      }

      // Check if past trading window
      if (trade.master_plan_id) {
        const { data: plan } = await supabase
          .from("master_plans")
          .select("trading_window_end, trading_schedules, timezone, asset_classes")
          .eq("id", trade.master_plan_id)
          .maybeSingle();

        if (plan) {
          const tz = plan.timezone || "America/New_York";
          const nowInTz = new Date().toLocaleString("en-US", { timeZone: tz });
          const localDate = new Date(nowInTz);
          const hhmm = `${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}`;
          const dayOfWeek = localDate.getDay();
          const schedules = (plan.trading_schedules as Record<string, any>) || {};

          const assetTypeMap: Record<string, string> = {
            stock: "stocks", equity: "stocks", fx: "forex", forex: "forex",
            crypto: "crypto", commodity: "commodities", index: "indices", etf: "etfs",
          };
          const tradeAssetType = (trade as any).asset_type;
          const mapped = tradeAssetType ? (assetTypeMap[tradeAssetType.toLowerCase()] || tradeAssetType.toLowerCase()) : null;
          const sched = mapped ? schedules[mapped] : null;

          let shouldClose = false;
          if (sched) {
            if (!sched.is_247) {
              if (sched.days && !sched.days.includes(dayOfWeek)) shouldClose = true;
              else if (sched.end && hhmm > sched.end) shouldClose = true;
            }
          } else if (plan.trading_window_end && hhmm > plan.trading_window_end) {
            shouldClose = true;
          }

          if (shouldClose) {
            // Session-end exit: use currentPrice with adverse slippage
            const isBuySide = !isLong; // closing a long = sell, closing a short = buy
            const fillPrice = applyAdverseSlippage(currentPrice, isBuySide, totalSlippageBps);
            const sessionMove = isLong ? fillPrice - entryPrice : entryPrice - fillPrice;
            // Cannot be worse than -1R: the stop would have executed first.
            const sessionPnlR = rUnit > 0
              ? Math.max(-1, Math.round((sessionMove / rUnit) * 100) / 100)
              : 0;

            const windowPnl = isForex
              ? calcForexPnl(trade.symbol, sessionMove, forexLotSize)
              : sessionMove * quantity;

            // Determine granular session-end close reason
            let sessionCloseReason = "session_end";
            const tpDistance = Math.abs(takeProfit - currentPrice);
            const tpRange = Math.abs(takeProfit - entryPrice);
            const withinTpProximity = tpRange > 0 && (tpDistance / tpRange) <= 0.10;
            const movingFavorably = isLong
              ? currentPrice > entryPrice && currentPrice < takeProfit
              : currentPrice < entryPrice && currentPrice > takeProfit;

            if (withinTpProximity) {
              sessionCloseReason = "session_end_tp_proximity";
            } else if (movingFavorably) {
              sessionCloseReason = "session_end_unresolved";
            }

            await supabase
              .from("paper_trades")
              .update({
                status: "closed",
                exit_price: Math.round(fillPrice * 1e8) / 1e8,
                pnl: Math.round(windowPnl * 100) / 100,
                outcome_r: sessionPnlR,
                closed_at: new Date().toISOString(),
                close_reason: sessionCloseReason,
                hold_duration_mins: holdMins,
                outcome: sessionPnlR >= 0 ? "win" : "loss",
                slippage_bps: totalSlippageBps,
                detection_latency_ms: detectionLatencyMs,
              })
              .eq("id", trade.id);

            closedCount++;
            console.log(`[manage-trades] Window close: ${trade.symbol} ${sessionPnlR}R fill=${fillPrice.toFixed(4)} ${isForex ? '(forex)' : ''}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        processed: openTrades.length,
        closed: closedCount,
        stops_updated: updatedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[manage-trades] Fatal:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
