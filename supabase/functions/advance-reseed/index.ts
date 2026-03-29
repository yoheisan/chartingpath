import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIMEFRAME_ORDER = ['1d', '8h', '4h', '1h'];
const BATCH_SIZE = 50;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Read current state
    const { data: state, error: stateErr } = await supabase
      .from('reseed_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (stateErr) throw stateErr;

    if (state.status === 'complete') {
      console.log('[advance-reseed] Already complete, exiting.');
      return new Response(JSON.stringify({ success: true, status: 'complete' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark running
    await supabase.from('reseed_state').update({ status: 'running', updated_at: new Date().toISOString() }).eq('id', 1);

    console.log(`[advance-reseed] Calling seed-historical-patterns-mtf: timeframe=${state.timeframe}, offset=${state.offset}`);

    // Call seed-historical-patterns-mtf
    const response = await fetch(`${supabaseUrl}/functions/v1/seed-historical-patterns-mtf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        timeframe: state.timeframe,
        offset: state.offset,
        maxInstrumentsPerType: BATCH_SIZE,
        dryRun: false,
        incrementalMode: true,
        forceFullBackfill: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`seed-historical-patterns-mtf HTTP ${response.status}: ${errText}`);
    }

    const result = await response.json();
    console.log(`[advance-reseed] Result: inserted=${result.summary?.insertedCount || 0}, hasMore=${result.hasMore}`);

    if (result.hasMore) {
      // Advance offset
      const newOffset = (state.offset || 0) + BATCH_SIZE;
      await supabase.from('reseed_state').update({
        offset: newOffset,
        status: 'idle',
        updated_at: new Date().toISOString(),
      }).eq('id', 1);

      console.log(`[advance-reseed] Advanced offset to ${newOffset}`);
      return new Response(JSON.stringify({
        success: true,
        status: 'idle',
        timeframe: state.timeframe,
        nextOffset: newOffset,
        inserted: result.summary?.insertedCount || 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // This timeframe is done — advance to next
    const currentIdx = TIMEFRAME_ORDER.indexOf(state.timeframe);
    const nextIdx = currentIdx + 1;

    if (nextIdx >= TIMEFRAME_ORDER.length) {
      // All timeframes done
      await supabase.from('reseed_state').update({
        status: 'complete',
        updated_at: new Date().toISOString(),
      }).eq('id', 1);

      console.log('[advance-reseed] All timeframes complete.');
      return new Response(JSON.stringify({ success: true, status: 'complete' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Move to next timeframe, reset offset
    const nextTimeframe = TIMEFRAME_ORDER[nextIdx];
    await supabase.from('reseed_state').update({
      timeframe: nextTimeframe,
      offset: 0,
      status: 'idle',
      updated_at: new Date().toISOString(),
    }).eq('id', 1);

    console.log(`[advance-reseed] Advanced to timeframe ${nextTimeframe}`);
    return new Response(JSON.stringify({
      success: true,
      status: 'idle',
      nextTimeframe,
      inserted: result.summary?.insertedCount || 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[advance-reseed] Error:', error);

    // Reset to idle so next cron run retries
    await supabase.from('reseed_state').update({
      status: 'idle',
      updated_at: new Date().toISOString(),
    }).eq('id', 1).catch(() => {});

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
