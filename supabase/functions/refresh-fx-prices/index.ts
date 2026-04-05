/**
 * Refresh FX Prices
 *
 * Fetches current quotes for all active FX instruments in live_pattern_detections
 * and updates current_price, prev_close, change_percent fields.
 *
 * Uses Finazon time_series (1h) — last bar close = current price.
 * Runs on a 5-minute cron schedule. Does NOT create new detections —
 * only refreshes prices on existing active patterns.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchFinazonData } from '../_shared/finazonFetch.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get all distinct active FX instruments
    const { data: fxDetections, error: fetchErr } = await supabase
      .from('live_pattern_detections')
      .select('instrument')
      .eq('asset_type', 'fx')
      .eq('status', 'active');

    if (fetchErr) {
      throw new Error(`Failed to fetch FX instruments: ${fetchErr.message}`);
    }

    if (!fxDetections || fxDetections.length === 0) {
      console.log('[refresh-fx-prices] No active FX instruments found');
      return new Response(
        JSON.stringify({ success: true, message: 'No active FX instruments', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uniqueSymbols = [...new Set(fxDetections.map((d: any) => d.instrument as string))];
    console.log(`[refresh-fx-prices] Found ${uniqueSymbols.length} unique active FX symbols`);

    // 2. Fetch latest 1h bars from Finazon for each symbol (last 2 bars sufficient)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

    interface PriceEntry { current: number; prev: number | null; changePct: number | null }
    const priceMap = new Map<string, PriceEntry>();

    await Promise.all(uniqueSymbols.map(async (symbol) => {
      const bars = await fetchFinazonData(symbol, '1h', twoHoursAgo);
      if (bars.length === 0) return;
      const last = bars[bars.length - 1];
      const prev = bars.length >= 2 ? bars[bars.length - 2] : null;
      const changePct = prev ? ((last.close - prev.close) / prev.close) * 100 : null;
      priceMap.set(symbol, { current: last.close, prev: prev?.close ?? null, changePct });
    }));

    // 3. Update each symbol
    let totalUpdated = 0;

    for (const symbol of uniqueSymbols) {
      const price = priceMap.get(symbol);

      if (!price || !Number.isFinite(price.current)) {
        console.log(`[refresh-fx-prices] Skipping ${symbol} — no valid price from Finazon`);
        continue;
      }

      const { error: updateErr } = await supabase
        .from('live_pattern_detections')
        .update({
          current_price: price.current,
          last_confirmed_at: new Date().toISOString(),
          prev_close: price.prev ?? null,
          change_percent: price.changePct ?? null,
        })
        .eq('instrument', symbol)
        .eq('asset_type', 'fx')
        .eq('status', 'active');

      if (updateErr) {
        console.error(`[refresh-fx-prices] Failed to update ${symbol}: ${updateErr.message}`);
      } else {
        totalUpdated++;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[refresh-fx-prices] Updated ${totalUpdated}/${uniqueSymbols.length} FX prices via Finazon in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: totalUpdated,
        total: uniqueSymbols.length,
        elapsed_ms: elapsed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[refresh-fx-prices] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
