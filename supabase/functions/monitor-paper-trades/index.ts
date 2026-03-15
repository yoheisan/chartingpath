import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Fetch all open paper trades that have SL and TP set
    const { data: openTrades, error } = await supabase
      .from('paper_trades')
      .select('*')
      .eq('status', 'open')
      .not('stop_loss', 'is', null)
      .not('take_profit', 'is', null);

    if (error) throw error;
    if (!openTrades?.length) {
      return new Response(
        JSON.stringify({ message: 'No open trades to monitor', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let hitTp = 0;
    let hitSl = 0;
    let timedOut = 0;

    for (const trade of openTrades) {
      // Get latest price for this instrument from live_pattern_detections
      const { data: latestPrice } = await supabase
        .from('live_pattern_detections')
        .select('current_price, detected_at')
        .eq('instrument', trade.symbol)
        .order('detected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestPrice?.current_price) continue;

      const currentPrice = Number(latestPrice.current_price);
      const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
      const openedHoursAgo = (Date.now() - new Date(trade.created_at).getTime()) / 3600000;

      let newStatus: string | null = null;
      let exitPrice: number | null = null;
      let outcomeR: number | null = null;
      let closeReason: string | null = null;
      let pnl: number = 0;

      const riskAmount = Math.abs(Number(trade.entry_price) - Number(trade.stop_loss));

      // Check TP hit
      if (isLong && currentPrice >= Number(trade.take_profit)) {
        newStatus = 'closed';
        exitPrice = Number(trade.take_profit);
        outcomeR = riskAmount > 0
          ? Math.round(((exitPrice - Number(trade.entry_price)) / riskAmount) * 100) / 100
          : 0;
        pnl = (exitPrice - Number(trade.entry_price)) * Number(trade.quantity);
        closeReason = `Take profit hit at ${exitPrice}`;
        hitTp++;
      } else if (!isLong && currentPrice <= Number(trade.take_profit)) {
        newStatus = 'closed';
        exitPrice = Number(trade.take_profit);
        outcomeR = riskAmount > 0
          ? Math.round(((Number(trade.entry_price) - exitPrice) / riskAmount) * 100) / 100
          : 0;
        pnl = (Number(trade.entry_price) - exitPrice) * Number(trade.quantity);
        closeReason = `Take profit hit at ${exitPrice}`;
        hitTp++;
      }
      // Check SL hit
      else if (isLong && currentPrice <= Number(trade.stop_loss)) {
        newStatus = 'closed';
        exitPrice = Number(trade.stop_loss);
        outcomeR = -1.0;
        pnl = (exitPrice - Number(trade.entry_price)) * Number(trade.quantity);
        closeReason = `Stop loss hit at ${exitPrice}`;
        hitSl++;
      } else if (!isLong && currentPrice >= Number(trade.stop_loss)) {
        newStatus = 'closed';
        exitPrice = Number(trade.stop_loss);
        outcomeR = -1.0;
        pnl = (Number(trade.entry_price) - exitPrice) * Number(trade.quantity);
        closeReason = `Stop loss hit at ${exitPrice}`;
        hitSl++;
      }
      // Timeout after 7 days
      else if (openedHoursAgo >= 168) {
        newStatus = 'closed';
        exitPrice = currentPrice;
        const priceMove = isLong
          ? currentPrice - Number(trade.entry_price)
          : Number(trade.entry_price) - currentPrice;
        outcomeR = riskAmount > 0
          ? Math.round((priceMove / riskAmount) * 100) / 100
          : 0;
        pnl = isLong
          ? (currentPrice - Number(trade.entry_price)) * Number(trade.quantity)
          : (Number(trade.entry_price) - currentPrice) * Number(trade.quantity);
        closeReason = `Timed out after 7 days at ${currentPrice}`;
        timedOut++;
      }

      if (newStatus && exitPrice !== null) {
        // Close the trade
        await supabase
          .from('paper_trades')
          .update({
            status: newStatus,
            exit_price: exitPrice,
            pnl: Math.round(pnl * 100) / 100,
            closed_at: new Date().toISOString(),
            close_reason: closeReason,
            outcome_r: outcomeR,
          })
          .eq('id', trade.id);

        // Send outcome email notification
        const { data: prefs } = await supabase
          .from('user_email_preferences')
          .select('alert_emails, unsubscribed')
          .eq('user_id', trade.user_id)
          .maybeSingle();

        if (prefs?.alert_emails && !prefs?.unsubscribed && !trade.notified_at) {
          const { data: { user } } = await supabase.auth.admin.getUserById(trade.user_id);

          if (user?.email) {
            const isWin = closeReason?.includes('Take profit');
            try {
              await supabase.functions.invoke('send-email', {
                body: {
                  to: user.email,
                  subject: isWin
                    ? `🎯 TP Hit! ${trade.symbol} +${outcomeR}R`
                    : closeReason?.includes('Stop loss')
                      ? `📉 SL Hit: ${trade.symbol} -1R`
                      : `⏱️ Trade Closed: ${trade.symbol} ${outcomeR && outcomeR > 0 ? '+' : ''}${outcomeR}R`,
                  template: 'trade_outcome',
                  data: {
                    instrument: trade.symbol,
                    pattern: trade.notes?.match(/\[pattern:(.*?)\]/)?.[1] ?? 'Pattern',
                    direction: trade.trade_type,
                    entryPrice: trade.entry_price,
                    exitPrice,
                    outcomeR,
                    closeReason,
                    openedAt: trade.created_at,
                    closedAt: new Date().toISOString(),
                  },
                },
              });
            } catch (emailErr) {
              console.warn('[monitor-paper-trades] Email send failed:', emailErr);
            }

            await supabase
              .from('paper_trades')
              .update({ notified_at: new Date().toISOString() })
              .eq('id', trade.id);
          }
        }

        processed++;
      }
    }

    console.log(`[monitor-paper-trades] Done: ${processed} closed (TP:${hitTp} SL:${hitSl} Timeout:${timedOut})`);

    return new Response(
      JSON.stringify({ success: true, processed, hitTp, hitSl, timedOut }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[monitor-paper-trades] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
