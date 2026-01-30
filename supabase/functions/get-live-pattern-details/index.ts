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
      .from('live_pattern_detections')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[get-live-pattern-details] DB error:', error.message);
      throw error;
    }

    if (!data) {
      return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pattern = {
      dbId: data.id,
      instrument: data.instrument,
      patternId: data.pattern_id,
      patternName: data.pattern_name,
      direction: data.direction,
      signalTs: data.first_detected_at,
      quality: { score: data.quality_score || 'B', reasons: data.quality_reasons || [] },
      tradePlan: {
        entryType: 'bar_close',
        entry: data.entry_price,
        stopLoss: data.stop_loss_price,
        takeProfit: data.take_profit_price,
        rr: data.risk_reward_ratio,
      },
      bars: data.bars || [],
      visualSpec: data.visual_spec || {},
      currentPrice: data.current_price,
      prevClose: data.prev_close,
      changePercent: data.change_percent,
      trendAlignment: data.trend_alignment,
      trendIndicators: data.trend_indicators,
      historicalPerformance: data.historical_performance || undefined,
    };

    return new Response(JSON.stringify({ success: true, pattern }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
    });
  } catch (err: any) {
    console.error('[get-live-pattern-details] Error:', err?.message || err);
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
