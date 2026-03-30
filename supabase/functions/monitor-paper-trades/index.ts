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

/**
 * Feed trade outcome back into agent_scores to make scoring self-improving.
 */
async function feedbackToAgentScores(
  supabase: ReturnType<typeof createClient>,
  trade: Record<string, any>,
  outcomeR: number,
  closeReason: string,
) {
  const patternId = trade.pattern_id || trade.notes?.match(/\[pattern:(.*?)\]/)?.[1];
  const timeframe = trade.timeframe || trade.notes?.match(/on (\w+)/)?.[1];
  
  if (!patternId || !timeframe) {
    console.log('[feedback] Skipping: no pattern_id or timeframe on trade', trade.id);
    return;
  }

  let signalWeight = 1.0;
  const overrideReason = trade.override_reason;

  if (overrideReason) {
    if (NEUTRAL_OVERRIDES.includes(overrideReason)) {
      console.log(`[feedback] Neutral override "${overrideReason}" — no signal quality update`);
      return;
    }
    if (NEGATIVE_SIGNAL_OVERRIDES.includes(overrideReason)) {
      signalWeight = 0.3;
      console.log(`[feedback] Soft negative override "${overrideReason}" — weight 0.3`);
    }
  }

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

  const currentWinRate = agentScore.win_rate ?? 0.5;
  const currentSampleSize = agentScore.sample_size ?? 0;
  const isWin = outcomeR > 0;

  const effectiveOutcome = isWin ? signalWeight : 0;
  const newSampleSize = currentSampleSize + signalWeight;
  const newWinRate = newSampleSize > 0
    ? (currentWinRate * currentSampleSize + effectiveOutcome) / newSampleSize
    : currentWinRate;

  const wrScore = Math.min(15, newWinRate * 15);
  const confidenceBonus = Math.min(10, Math.log2(Math.max(1, newSampleSize)) * 1.5);
  const newAnalystRaw = Math.round((wrScore + confidenceBonus) * 100) / 100;

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

      // Detect forex
      const isForex = trade.instrument_type === "forex" || isForexSymbol(trade.symbol);
      const forexLotSize = isForex ? Number(trade.forex_lot_size || 0.01) : 0;

      let newStatus: string | null = null;
      let exitPrice: number | null = null;
      let outcomeR: number | null = null;
      let closeReason: string | null = null;
      let pnl: number = 0;

      const riskAmount = Math.abs(Number(trade.entry_price) - Number(trade.stop_loss));

      // Helper to calculate P&L based on instrument type
      const calcPnl = (pMove: number): number => {
        if (isForex) {
          return calcForexPnl(trade.symbol, pMove, forexLotSize);
        }
        return pMove * Number(trade.quantity);
      };

      // Check TP hit
      if (isLong && currentPrice >= Number(trade.take_profit)) {
        newStatus = 'closed';
        exitPrice = Number(trade.take_profit);
        outcomeR = riskAmount > 0
          ? Math.round(((exitPrice - Number(trade.entry_price)) / riskAmount) * 100) / 100
          : 0;
        pnl = calcPnl(exitPrice - Number(trade.entry_price));
        closeReason = `Take profit hit at ${exitPrice}`;
        hitTp++;
      } else if (!isLong && currentPrice <= Number(trade.take_profit)) {
        newStatus = 'closed';
        exitPrice = Number(trade.take_profit);
        outcomeR = riskAmount > 0
          ? Math.round(((Number(trade.entry_price) - exitPrice) / riskAmount) * 100) / 100
          : 0;
        pnl = calcPnl(Number(trade.entry_price) - exitPrice);
        closeReason = `Take profit hit at ${exitPrice}`;
        hitTp++;
      }
      // Check SL hit
      else if (isLong && currentPrice <= Number(trade.stop_loss)) {
        newStatus = 'closed';
        exitPrice = Number(trade.stop_loss);
        outcomeR = -1.0;
        pnl = calcPnl(exitPrice - Number(trade.entry_price));
        closeReason = `Stop loss hit at ${exitPrice}`;
        hitSl++;
      } else if (!isLong && currentPrice >= Number(trade.stop_loss)) {
        newStatus = 'closed';
        exitPrice = Number(trade.stop_loss);
        outcomeR = -1.0;
        pnl = calcPnl(Number(trade.entry_price) - exitPrice);
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
        pnl = calcPnl(isLong ? currentPrice - Number(trade.entry_price) : Number(trade.entry_price) - currentPrice);
        closeReason = `Timed out after 7 days at ${currentPrice}`;
        timedOut++;
      }

      if (newStatus && exitPrice !== null) {
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

        try {
          await feedbackToAgentScores(supabase, trade, outcomeR ?? 0, closeReason ?? '');
          feedbackCount++;
        } catch (fbErr) {
          console.warn('[monitor-paper-trades] Feedback error:', fbErr);
        }

        // ── Email notification on trade close ──
        const { data: profile } = await supabase
          .from('profiles')
          .select('email_notifications_enabled, email')
          .eq('user_id', trade.user_id)
          .maybeSingle();

        if (profile?.email_notifications_enabled && profile?.email && !trade.notified_at) {
          const attribution = trade.attribution;
          const closedByLabel = (attribution === 'human_overwrite' || closeReason?.includes('manual') || closeReason?.includes('override'))
            ? 'You closed'
            : 'AI closed';
          const outcomeRStr = outcomeR !== null
            ? (outcomeR > 0 ? `+${outcomeR}` : `${outcomeR}`)
            : '0';
          const setupType = trade.setup_type || trade.pattern_id || 'Setup';

          try {
            await supabase.functions.invoke('send-email', {
              body: {
                to: profile.email,
                subject: `[ChartingPath] Trade closed: ${trade.symbol} ${outcomeRStr}R`,
                template: 'trade_outcome',
                data: {
                  symbol: trade.symbol,
                  setup_type: setupType,
                  entry_price: trade.entry_price,
                  exit_price: exitPrice,
                  outcome_r: outcomeRStr,
                  close_reason: closeReason,
                  pnl: Math.round(pnl * 100) / 100,
                  closed_by: closedByLabel,
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
