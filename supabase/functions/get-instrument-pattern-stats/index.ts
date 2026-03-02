import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pattern_id, instrument } = await req.json();

    if (!pattern_id || !instrument) {
      return new Response(
        JSON.stringify({ success: false, error: 'pattern_id and instrument are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch breakdowns for this instrument+pattern from the materialized view
    const { data: breakdowns, error: breakdownError } = await supabase
      .from('instrument_pattern_stats_mv')
      .select('*')
      .eq('pattern_id', pattern_id)
      .eq('symbol', instrument.toUpperCase())
      .order('total_trades', { ascending: false });

    if (breakdownError) {
      console.error('Breakdown query error:', breakdownError);
      return new Response(
        JSON.stringify({ success: false, error: breakdownError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!breakdowns || breakdowns.length === 0) {
      return new Response(
        JSON.stringify({ success: true, instrument, pattern_id, breakdowns: [], aggregates: null, related_instruments: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } }
      );
    }

    // Compute aggregates across all timeframes
    const totalTrades = breakdowns.reduce((s, b) => s + Number(b.total_trades), 0);
    const totalWins = breakdowns.reduce((s, b) => s + Number(b.wins), 0);
    const totalLosses = breakdowns.reduce((s, b) => s + Number(b.losses), 0);
    const weightedRr = breakdowns.reduce((s, b) => s + Number(b.avg_rr) * Number(b.total_trades), 0) / totalTrades;
    const weightedBars = breakdowns.reduce((s, b) => s + Number(b.avg_bars) * Number(b.total_trades), 0) / totalTrades;
    const wr = totalWins / totalTrades;
    const expectancy = wr * weightedRr - (1 - wr);

    const aggregates = {
      total_trades: totalTrades,
      wins: totalWins,
      losses: totalLosses,
      win_rate_pct: Math.round(wr * 1000) / 10,
      expectancy_r: Math.round(expectancy * 1000) / 1000,
      avg_rr: Math.round(weightedRr * 100) / 100,
      avg_bars: Math.round(weightedBars * 10) / 10,
    };

    // Fetch related instruments (top 8 by trade count for this pattern, excluding current)
    const { data: related } = await supabase
      .from('instrument_pattern_stats_mv')
      .select('symbol, total_trades')
      .eq('pattern_id', pattern_id)
      .neq('symbol', instrument.toUpperCase())
      .order('total_trades', { ascending: false })
      .limit(8);

    // Deduplicate symbols (may appear in multiple timeframes)
    const seen = new Set<string>();
    const relatedInstruments: string[] = [];
    for (const r of related || []) {
      if (!seen.has(r.symbol)) {
        seen.add(r.symbol);
        relatedInstruments.push(r.symbol);
      }
      if (relatedInstruments.length >= 8) break;
    }

    const patternName = breakdowns[0]?.pattern_name || pattern_id;

    return new Response(
      JSON.stringify({
        success: true,
        instrument: instrument.toUpperCase(),
        pattern_id,
        pattern_name: patternName,
        breakdowns: breakdowns.map(b => ({
          timeframe: b.timeframe,
          total_trades: Number(b.total_trades),
          wins: Number(b.wins),
          losses: Number(b.losses),
          win_rate_pct: Number(b.win_rate_pct),
          expectancy_r: Number(b.expectancy_r),
          avg_rr: Number(b.avg_rr),
          avg_bars: Number(b.avg_bars),
        })),
        aggregates,
        related_instruments: relatedInstruments,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      }
    );
  } catch (err) {
    console.error('get-instrument-pattern-stats error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
