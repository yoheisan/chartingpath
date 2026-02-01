import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const id = String(body?.id || '').trim();

    if (!id || !isUuid(id)) {
      return new Response(JSON.stringify({ success: false, error: 'Missing or invalid id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase
      .from('historical_pattern_occurrences')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[get-historical-pattern-details] DB error:', error.message);
      throw error;
    }

    if (!data) {
      return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize bars to compressed format (t, o, h, l, c, v) expected by frontend
    const normalizedBars = (data.bars || []).map((bar: any) => {
      // Handle both formats: already compressed or full names
      if ('t' in bar) return bar;
      return {
        t: bar.date || bar.timestamp,
        o: bar.open ?? bar.o,
        h: bar.high ?? bar.h,
        l: bar.low ?? bar.l,
        c: bar.close ?? bar.c,
        v: bar.volume ?? bar.v ?? 0,
      };
    });

    // Match the response structure expected by the frontend (snake_case)
    const pattern = {
      id: data.id,
      instrument: data.symbol,
      pattern_name: data.pattern_name,
      direction: data.direction,
      quality_score: data.quality_score,
      entry_price: data.entry_price,
      stop_loss_price: data.stop_loss_price,
      take_profit_price: data.take_profit_price,
      risk_reward_ratio: data.risk_reward_ratio,
      timeframe: data.timeframe,
      first_detected_at: data.detected_at,
      bars: normalizedBars,
      visual_spec: data.visual_spec || {},
      // Historical-specific fields
      outcome: data.outcome,
      outcome_pnl_percent: data.outcome_pnl_percent,
      outcome_date: data.outcome_date,
      outcome_price: data.outcome_price,
      bars_to_outcome: data.bars_to_outcome,
      trend_alignment: data.trend_alignment,
      trend_indicators: data.trend_indicators,
    };

    return new Response(JSON.stringify({ success: true, pattern }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err: any) {
    console.error('[get-historical-pattern-details] Error:', err?.message || err);
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
