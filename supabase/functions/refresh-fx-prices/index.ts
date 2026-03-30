/**
 * Refresh FX Prices
 * 
 * Fetches current quotes for all active FX instruments in live_pattern_detections
 * and updates current_price, prev_close, change_percent fields.
 * 
 * Runs on a 5-minute cron schedule. Does NOT create new detections —
 * only refreshes prices on existing active patterns.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BATCH_SIZE = 20; // Yahoo Finance quote endpoint limit per request

interface YahooQuoteResult {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChangePercent?: number;
}

/**
 * Fetch quotes from Yahoo Finance quote endpoint for a batch of symbols
 */
async function fetchQuotes(symbols: string[]): Promise<YahooQuoteResult[]> {
  const symbolList = symbols.map(s => encodeURIComponent(s)).join(',');
  const url = `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${symbolList}`;

  console.log(`[refresh-fx-prices] Fetching quotes: ${symbols.join(', ')}`);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[refresh-fx-prices] Yahoo quote API error: ${response.status} — ${text.slice(0, 200)}`);
    return [];
  }

  const data = await response.json();
  const results: YahooQuoteResult[] = data?.quoteResponse?.result ?? [];
  return results;
}

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

    // Deduplicate symbols
    const uniqueSymbols = [...new Set(fxDetections.map(d => d.instrument))];
    console.log(`[refresh-fx-prices] Found ${uniqueSymbols.length} unique active FX symbols`);

    // 2. Batch fetch quotes (up to BATCH_SIZE per request)
    let totalUpdated = 0;
    const totalSymbols = uniqueSymbols.length;

    for (let i = 0; i < uniqueSymbols.length; i += BATCH_SIZE) {
      const batch = uniqueSymbols.slice(i, i + BATCH_SIZE);
      const quotes = await fetchQuotes(batch);

      // 3. Update each symbol with valid price data
      for (const quote of quotes) {
        if (!quote.symbol || !Number.isFinite(quote.regularMarketPrice)) {
          console.log(`[refresh-fx-prices] Skipping ${quote.symbol ?? 'unknown'} — no valid price`);
          continue;
        }

        const { error: updateErr } = await supabase
          .from('live_pattern_detections')
          .update({
            current_price: quote.regularMarketPrice,
            last_confirmed_at: new Date().toISOString(),
            prev_close: quote.regularMarketPreviousClose ?? null,
            change_percent: quote.regularMarketChangePercent ?? null,
          })
          .eq('instrument', quote.symbol)
          .eq('asset_type', 'fx')
          .eq('status', 'active');

        if (updateErr) {
          console.error(`[refresh-fx-prices] Failed to update ${quote.symbol}: ${updateErr.message}`);
        } else {
          totalUpdated++;
        }
      }

      // Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < uniqueSymbols.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[refresh-fx-prices] Updated prices for ${totalUpdated}/${totalSymbols} FX instruments in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: totalUpdated,
        total: totalSymbols,
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
