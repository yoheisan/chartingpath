/**
 * Refresh FX Prices
 * 
 * Fetches current quotes for all active FX instruments in live_pattern_detections
 * and updates current_price, prev_close, change_percent fields.
 * 
 * Uses EODHD real-time quote endpoint (bulk mode).
 * Runs on a 5-minute cron schedule. Does NOT create new detections —
 * only refreshes prices on existing active patterns.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface EODHDRealTimeQuote {
  code: string;
  close: number;
  previousClose: number;
  change_p: number;
}

/**
 * Convert Yahoo-style FX symbol to EODHD format
 * EURUSD=X → EURUSD.FOREX
 */
function toEODHDSymbol(instrument: string): string {
  return instrument.replace('=X', '.FOREX');
}

/**
 * Fetch real-time quotes from EODHD bulk endpoint.
 * First symbol goes in the URL path, rest go in &s= param.
 */
async function fetchEODHDQuotes(
  symbols: string[],
  apiKey: string
): Promise<EODHDRealTimeQuote[]> {
  if (symbols.length === 0) return [];

  const eodhSymbols = symbols.map(toEODHDSymbol);
  const primary = eodhSymbols[0];
  const rest = eodhSymbols.slice(1);

  let url = `https://eodhd.com/api/real-time/${primary}?api_token=${apiKey}&fmt=json`;
  if (rest.length > 0) {
    url += `&s=${rest.join(',')}`;
  }

  console.log(`[refresh-fx-prices] Fetching ${symbols.length} quotes via EODHD real-time`);

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    console.error(`[refresh-fx-prices] EODHD API error: ${response.status} — ${text.slice(0, 200)}`);
    return [];
  }

  const data = await response.json();

  // Single symbol returns an object, multiple returns an array
  if (Array.isArray(data)) {
    return data;
  }
  return [data];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
    if (!EODHD_API_KEY) {
      throw new Error('EODHD_API_KEY not configured');
    }

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

    // Deduplicate symbols
    const uniqueSymbols = [...new Set(fxDetections.map(d => d.instrument))];
    console.log(`[refresh-fx-prices] Found ${uniqueSymbols.length} unique active FX symbols`);

    // 2. Fetch all quotes in one bulk request
    const quotes = await fetchEODHDQuotes(uniqueSymbols, EODHD_API_KEY);

    // Build a map from EODHD code → quote for easy lookup
    const quoteMap = new Map<string, EODHDRealTimeQuote>();
    for (const q of quotes) {
      if (q.code) {
        quoteMap.set(q.code, q);
      }
    }

    // 3. Update each symbol
    let totalUpdated = 0;

    for (const symbol of uniqueSymbols) {
      const eodhCode = toEODHDSymbol(symbol);
      const quote = quoteMap.get(eodhCode);

      if (!quote || !Number.isFinite(quote.close)) {
        console.log(`[refresh-fx-prices] Skipping ${symbol} — no valid price from EODHD`);
        continue;
      }

      const { error: updateErr } = await supabase
        .from('live_pattern_detections')
        .update({
          current_price: quote.close,
          last_confirmed_at: new Date().toISOString(),
          prev_close: quote.previousClose ?? null,
          change_percent: quote.change_p ?? null,
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
    console.log(`[refresh-fx-prices] Updated ${totalUpdated}/${uniqueSymbols.length} FX prices via EODHD real-time in ${elapsed}ms`);

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
