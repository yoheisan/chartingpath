import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Override reasons that indicate the pattern signal itself was bad → soft negative
const NEGATIVE_SIGNAL_OVERRIDES = [
  'Pattern invalidated',
  'Market conditions changed',
  'Changed my mind',
];

// Override reasons that are trader-side decisions → neutral (no signal quality impact)
const NEUTRAL_OVERRIDES = [
  'Taking partial profit',
  'Risk management',
  'News event risk',
];

/**
 * Feed trade outcome back into agent_scores to make scoring self-improving.
 * 
 * - TP hit: full positive signal (weight 1.0)
 * - SL hit: full negative signal (weight 1.0)
 * - Timeout: weighted by R outcome (positive = partial win, negative = partial loss)
 * - Override (negative signal): soft negative (weight 0.3)
 * - Override (neutral): no signal quality update
 */
async function feedbackToAgentScores(
  supabase: ReturnType<typeof createClient>,
  trade: Record<string, any>,
  outcomeR: number,
  closeReason: string,
) {
  // Extract pattern_id and timeframe from trade columns or notes
  const patternId = trade.pattern_id || trade.notes?.match(/\[pattern:(.*?)\]/)?.[1];
  const timeframe = trade.timeframe || trade.notes?.match(/on (\w+)/)?.[1];
  
  if (!patternId || !timeframe) {
    console.log('[feedback] Skipping: no pattern_id or timeframe on trade', trade.id);
    return;
  }

  // Determine signal weight based on close reason
  let signalWeight = 1.0;
  const overrideReason = trade.override_reason;

  if (overrideReason) {
    if (NEUTRAL_OVERRIDES.includes(overrideReason)) {
      console.log(`[feedback] Neutral override "${overrideReason}" — no signal quality update`);
      return; // Skip entirely for neutral overrides
    }
    if (NEGATIVE_SIGNAL_OVERRIDES.includes(overrideReason)) {
      signalWeight = 0.3; // Soft negative
      console.log(`[feedback] Soft negative override "${overrideReason}" — weight 0.3`);
    }
  }

  // Find the matching agent_scores row for this instrument+pattern+timeframe
  const { data: agentScore } = await supabase
    .from('agent_scores')
    .select('id, analyst_raw, win_rate, sample_size, analyst_details')
    .eq('instrument', trade.symbol)
    .eq('pattern_id', patternId)
    .eq('timeframe', timeframe)
    .order('scored_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!agentScore) {
    console.log(`[feedback] No agent_scores row for ${trade.symbol}/${patternId}/${timeframe}`);
    return;
  }

  // Calculate updated stats
  const currentWinRate = agentScore.win_rate ?? 0.5;
  const currentSampleSize = agentScore.sample_size ?? 0;
  const isWin = outcomeR > 0;

  // Weighted incremental update: new_wr = (old_wr * n + weighted_outcome) / (n + weight)
  const effectiveOutcome = isWin ? signalWeight : 0;
  const newSampleSize = currentSampleSize + signalWeight;
  const newWinRate = newSampleSize > 0
    ? (currentWinRate * currentSampleSize + effectiveOutcome) / newSampleSize
    : currentWinRate;

  // Update analyst_raw score based on new win rate (out of 25)
  // Formula: base from win rate (0-15) + confidence bonus from sample size (0-10)
  const wrScore = Math.min(15, newWinRate * 15);
  const confidenceBonus = Math.min(10, Math.log2(Math.max(1, newSampleSize)) * 1.5);
  const newAnalystRaw = Math.round((wrScore + confidenceBonus) * 100) / 100;

  // Update analyst_details with outcome tracking
  const details = (agentScore.analyst_details as Record<string, any>) || {};
  const outcomes = details.outcome_feedback || { wins: 0, losses: 0, overrides: 0 };
  if (isWin) outcomes.wins = (outcomes.wins || 0) + 1;
  else outcomes.losses = (outcomes.losses || 0) + 1;
  if (overrideReason) outcomes.overrides = (outcomes.overrides || 0) + 1;
  details.outcome_feedback = outcomes;
  details.last_outcome_at = new Date().toISOString();
  details.last_outcome_r = outcomeR;

  const { error } = await supabase
    .from('agent_scores')
    .update({
      analyst_raw: newAnalystRaw,
      win_rate: Math.round(newWinRate * 10000) / 10000,
      sample_size: Math.round(newSampleSize),
      analyst_details: details,
    })
    .eq('id', agentScore.id);

  if (error) {
    console.error('[feedback] agent_scores update error:', error);
  } else {
    console.log(`[feedback] Updated ${trade.symbol}/${patternId}/${timeframe}: wr=${(newWinRate * 100).toFixed(1)}% n=${Math.round(newSampleSize)} analyst=${newAnalystRaw}`);
  }
}

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
    let feedbackCount = 0;

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

        // Feed outcome back to agent scoring
        try {
          await feedbackToAgentScores(supabase, trade, outcomeR ?? 0, closeReason ?? '');
          feedbackCount++;
        } catch (fbErr) {
          console.warn('[monitor-paper-trades] Feedback error:', fbErr);
        }

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
                    pattern: trade.pattern_id || (trade.notes?.match(/\[pattern:(.*?)\]/)?.[1] ?? 'Pattern'),
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

    console.log(`[monitor-paper-trades] Done: ${processed} closed (TP:${hitTp} SL:${hitSl} Timeout:${timedOut}) Feedback:${feedbackCount}`);

    return new Response(
      JSON.stringify({ success: true, processed, hitTp, hitSl, timedOut, feedbackCount }),
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
