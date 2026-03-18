import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * auto-paper-trade
 * 
 * Called from check-alert-matches when alert.auto_paper_trade = true.
 * Opens a paper trade automatically in the user's paper portfolio.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      user_id,
      symbol,
      direction,
      entry_price,
      stop_loss_price,
      take_profit_price,
      risk_percent = 1.0,
      pattern,
      timeframe,
      detection_id,
      asset_type,
    } = await req.json();

    // Validate required fields
    if (!user_id || !symbol || !direction || !entry_price || !stop_loss_price || !take_profit_price) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields', code: 'VALIDATION_ERROR' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[auto-paper-trade] Processing for user ${user_id}, ${symbol} ${direction}`);

    // 1. Check for existing open trade on same symbol (prevent duplicates)
    const { data: existingTrade } = await supabase
      .from('paper_trades')
      .select('id')
      .eq('user_id', user_id)
      .eq('symbol', symbol.toUpperCase())
      .eq('status', 'open')
      .limit(1)
      .maybeSingle();

    if (existingTrade) {
      console.log(`[auto-paper-trade] Skipping: open trade already exists for ${symbol}`);
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: 'duplicate_open_trade' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get user's paper portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('paper_portfolios')
      .select('id, current_balance')
      .eq('user_id', user_id)
      .maybeSingle();

    if (portfolioError || !portfolio) {
      console.error('[auto-paper-trade] Portfolio not found:', portfolioError);
      return new Response(
        JSON.stringify({ success: false, error: 'Paper portfolio not found', code: 'NO_PORTFOLIO' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Calculate position size
    // Risk amount = balance * risk_percent / 100
    // Stop distance = abs(entry - stop_loss)
    // Quantity = risk_amount / stop_distance
    const riskAmount = portfolio.current_balance * Math.min(risk_percent, 5) / 100;
    const stopDistance = Math.abs(entry_price - stop_loss_price);

    if (stopDistance <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid stop distance', code: 'INVALID_STOP' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const quantity = riskAmount / stopDistance;
    const positionValue = quantity * entry_price;

    // Ensure position doesn't exceed 50% of portfolio
    if (positionValue > portfolio.current_balance * 0.5) {
      console.log(`[auto-paper-trade] Position too large: ${positionValue} > 50% of ${portfolio.current_balance}`);
      return new Response(
        JSON.stringify({ success: false, skipped: true, reason: 'position_too_large' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Insert paper trade
    const { data: trade, error: insertError } = await supabase
      .from('paper_trades')
      .insert({
        user_id,
        symbol: symbol.toUpperCase(),
        trade_type: direction === 'long' ? 'long' : 'short',
        entry_price,
        stop_loss: stop_loss_price,
        take_profit: take_profit_price,
        quantity: Number(quantity.toFixed(6)),
        status: 'open',
        notes: `[auto-trade] ${pattern || 'pattern'} on ${timeframe || 'unknown'} | detection: ${detection_id || 'n/a'}`,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[auto-paper-trade] Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message, code: 'INSERT_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[auto-paper-trade] Trade created: ${trade.id} for ${symbol} ${direction} qty=${quantity.toFixed(6)}`);

    return new Response(
      JSON.stringify({
        success: true,
        trade_id: trade.id,
        quantity: Number(quantity.toFixed(6)),
        risk_amount: Number(riskAmount.toFixed(2)),
        position_value: Number(positionValue.toFixed(2)),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[auto-paper-trade] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message, code: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
