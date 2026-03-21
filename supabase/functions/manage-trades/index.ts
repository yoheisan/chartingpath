import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Get all open paper trades
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
      // Get simulated current price from live detections
      const { data: priceData } = await supabase
        .from("live_pattern_detections")
        .select("current_price")
        .eq("instrument", trade.symbol)
        .order("detected_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const currentPrice = priceData?.current_price
        ? Number(priceData.current_price)
        : null;

      if (!currentPrice) continue;

      const entryPrice = Number(trade.entry_price);
      const stopLoss = Number(trade.stop_loss);
      const takeProfit = Number(trade.take_profit);
      const isLong = trade.trade_type === "long" || trade.trade_type === "buy";
      const positionPct = Number(trade.position_size_pct || 3);
      const rUnit = entryPrice * (positionPct / 100);
      const quantity = Number(trade.quantity);
      const createdAt = new Date(trade.created_at);
      const holdMins = Math.round((Date.now() - createdAt.getTime()) / 60000);

      // Calculate current PnL
      const priceMove = isLong
        ? currentPrice - entryPrice
        : entryPrice - currentPrice;
      const pnlR = rUnit > 0 ? Math.round((priceMove / rUnit) * 100) / 100 : 0;
      const pnlDollars = Math.round(priceMove * quantity * 100) / 100;

      // Check stop loss hit
      const stopHit = isLong
        ? currentPrice <= stopLoss
        : currentPrice >= stopLoss;

      // Check take profit hit
      const tpHit = isLong
        ? currentPrice >= takeProfit
        : currentPrice <= takeProfit;

      if (stopHit) {
        const exitPnlR = isLong
          ? (stopLoss - entryPrice) / rUnit
          : (entryPrice - stopLoss) / rUnit;
        const exitPnlDollars = isLong
          ? (stopLoss - entryPrice) * quantity
          : (entryPrice - stopLoss) * quantity;

        await supabase
          .from("paper_trades")
          .update({
            status: "closed",
            exit_price: stopLoss,
            pnl: Math.round(exitPnlDollars * 100) / 100,
            outcome_r: Math.round(exitPnlR * 100) / 100,
            closed_at: new Date().toISOString(),
            close_reason: "Stop loss hit",
            hold_duration_mins: holdMins,
            outcome: "loss",
          })
          .eq("id", trade.id);

        closedCount++;
        console.log(`[manage-trades] Stop hit: ${trade.symbol} ${exitPnlR.toFixed(2)}R`);
        continue;
      }

      if (tpHit) {
        const exitPnlR = isLong
          ? (takeProfit - entryPrice) / rUnit
          : (entryPrice - takeProfit) / rUnit;
        const exitPnlDollars = isLong
          ? (takeProfit - entryPrice) * quantity
          : (entryPrice - takeProfit) * quantity;

        await supabase
          .from("paper_trades")
          .update({
            status: "closed",
            exit_price: takeProfit,
            pnl: Math.round(exitPnlDollars * 100) / 100,
            outcome_r: Math.round(exitPnlR * 100) / 100,
            closed_at: new Date().toISOString(),
            close_reason: "Take profit hit",
            hold_duration_mins: holdMins,
            outcome: "win",
          })
          .eq("id", trade.id);

        closedCount++;
        console.log(`[manage-trades] TP hit: ${trade.symbol} +${exitPnlR.toFixed(2)}R`);
        continue;
      }

      // Trailing stop logic
      let newStop = stopLoss;
      if (isLong) {
        if (currentPrice >= entryPrice + 2 * rUnit) {
          newStop = Math.max(stopLoss, entryPrice + rUnit); // trail to +1R
        } else if (currentPrice >= entryPrice + rUnit) {
          newStop = Math.max(stopLoss, entryPrice); // move to breakeven
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

      // Check if past trading window — close trade
      if (trade.master_plan_id) {
        const { data: plan } = await supabase
          .from("master_plans")
          .select("trading_window_end")
          .eq("id", trade.master_plan_id)
          .maybeSingle();

        if (plan?.trading_window_end) {
          const now = new Date();
          const hhmm = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
          if (hhmm > plan.trading_window_end) {
            await supabase
              .from("paper_trades")
              .update({
                status: "closed",
                exit_price: currentPrice,
                pnl: Math.round(pnlDollars * 100) / 100,
                outcome_r: pnlR,
                closed_at: new Date().toISOString(),
                close_reason: "Trading window closed",
                hold_duration_mins: holdMins,
                outcome: pnlR >= 0 ? "win" : "loss",
              })
              .eq("id", trade.id);

            closedCount++;
            console.log(`[manage-trades] Window close: ${trade.symbol} ${pnlR}R`);
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
