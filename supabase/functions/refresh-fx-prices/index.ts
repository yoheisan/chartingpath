/**
 * Refresh FX Prices
 *
 * Fetches current quotes for the whole active FX instrument universe (from the
 * `instruments` table) and updates current_price / prev_close / change_percent on
 * any active FX detections that exist for those symbols.
 *
 * Uses Finazon time_series (1h) — last bar close = current price.
 * Runs on a 5-minute cron schedule. Does NOT create new detections —
 * only refreshes prices on existing active patterns.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchFinazonData } from '../_shared/finazonFetch.ts';

/**
 * Yahoo fallback. Finazon is the primary FX source but its quota is shared with
 * the scanners and it returns HTTP 429 for the whole batch once exhausted. A price
 * refresher with a single provider is a single point of failure for an entire
 * asset class, which is how FX went dark.
 */
async function fetchYahooLastTwoCloses(symbol: string): Promise<{ current: number; prev: number | null } | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1h`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const closes: (number | null)[] = result?.indicators?.quote?.[0]?.close ?? [];
    const valid = closes.filter((c): c is number => typeof c === 'number' && Number.isFinite(c));
    if (valid.length === 0) {
      const meta = result?.meta?.regularMarketPrice;
      return Number.isFinite(meta) ? { current: Number(meta), prev: null } : null;
    }
    return { current: valid[valid.length - 1], prev: valid.length >= 2 ? valid[valid.length - 2] : null };
  } catch {
    return null;
  }
}

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

    // 1. Source the refresh list from the TRADEABLE UNIVERSE (`instruments`), never
    //    from live_pattern_detections.
    //
    //    DEADLOCK WARNING — do not reintroduce a detections-derived list here.
    //    Reading the symbol list from live_pattern_detections WHERE status='active'
    //    creates a circular dependency: pattern detection needs fresh prices to
    //    produce detections, and this refresher would need detections to produce
    //    fresh prices. The moment an asset class' detections all expire at once
    //    (FX, 2026-07-31) the loop can never restart:
    //      no active detections -> no price refresh -> stale prices ->
    //      scanner finds nothing -> still no active detections.
    //    The price refresher's job is to keep prices current for the tradeable
    //    universe; it must not depend on downstream detection output.
    const { data: fxInstruments, error: fetchErr } = await supabase
      .from('instruments')
      .select('symbol')
      .eq('asset_type', 'fx')
      .eq('is_active', true);

    if (fetchErr) {
      throw new Error(`Failed to fetch FX instruments: ${fetchErr.message}`);
    }

    if (!fxInstruments || fxInstruments.length === 0) {
      console.error('[refresh-fx-prices] No active FX rows in `instruments` — universe is empty, this is a data problem, not a quiet market');
      return new Response(
        JSON.stringify({ success: true, message: 'No active FX instruments in universe', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const uniqueSymbols = [...new Set(fxInstruments.map((d: any) => d.symbol as string))];
    console.log(`[refresh-fx-prices] Refreshing ${uniqueSymbols.length} FX symbols from the instruments universe`);

    // 2. Fetch latest 1h bars from Finazon for each symbol (last 2 bars sufficient)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

    interface PriceEntry { current: number; prev: number | null; changePct: number | null }
    const priceMap = new Map<string, PriceEntry>();

    // The universe is ~99 symbols. Firing them all at once trips Finazon's rate
    // limiter (HTTP 429 on every request), so throttle: small concurrent batches
    // with a pause between them, and one retry for symbols that came back empty.
    const BATCH_SIZE = 6;
    const BATCH_PAUSE_MS = 350;

    const priceOne = async (symbol: string) => {
      const bars = await fetchFinazonData(symbol, '1h', twoHoursAgo);
      if (bars.length === 0) {
        const y = await fetchYahooLastTwoCloses(symbol);
        if (!y) return false;
        const changePctY = y.prev ? ((y.current - y.prev) / y.prev) * 100 : null;
        priceMap.set(symbol, { current: y.current, prev: y.prev, changePct: changePctY });
        return true;
      }
      const last = bars[bars.length - 1];
      const prev = bars.length >= 2 ? bars[bars.length - 2] : null;
      const changePct = prev ? ((last.close - prev.close) / prev.close) * 100 : null;
      priceMap.set(symbol, { current: last.close, prev: prev?.close ?? null, changePct });
      return true;
    };

    const runBatched = async (symbols: string[]) => {
      const failed: string[] = [];
      for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(async (s) => ({ s, ok: await priceOne(s).catch(() => false) })));
        for (const r of results) if (!r.ok) failed.push(r.s);
        if (i + BATCH_SIZE < symbols.length) await new Promise((r) => setTimeout(r, BATCH_PAUSE_MS));
      }
      return failed;
    };

    const firstPassFailures = await runBatched(uniqueSymbols);
    if (firstPassFailures.length) {
      console.warn(`[refresh-fx-prices] ${firstPassFailures.length} symbols empty on first pass, retrying once`);
      await new Promise((r) => setTimeout(r, 1500));
      const stillFailed = await runBatched(firstPassFailures);
      if (stillFailed.length) {
        console.warn(`[refresh-fx-prices] Still no quote for ${stillFailed.length} symbols: ${stillFailed.slice(0, 15).join(', ')}`);
      }
    }

    // 3. Update each symbol
    let totalUpdated = 0;
    let totalPriced = 0;
    const nowIso = new Date().toISOString();

    for (const symbol of uniqueSymbols) {
      const price = priceMap.get(symbol);

      if (!price || !Number.isFinite(price.current)) {
        console.log(`[refresh-fx-prices] Skipping ${symbol} — no valid price from Finazon`);
        continue;
      }
      totalPriced++;

      // Persist the quote as a bar so the scanner has fresh price data even when
      // there is no active detection for this symbol. This is what actually lets a
      // dead asset class recover.
      const { error: barErr } = await supabase
        .from('historical_prices')
        .upsert({
          symbol,
          instrument_type: 'forex',
          timeframe: '1h',
          date: nowIso,
          open: price.current,
          high: price.current,
          low: price.current,
          close: price.current,
          volume: 0,
          source: 'finazon-refresh',
        }, { onConflict: 'symbol,timeframe,date' });
      if (barErr) {
        console.warn(`[refresh-fx-prices] Bar upsert skipped for ${symbol}: ${barErr.message}`);
      }

      const { error: updateErr } = await supabase
        .from('live_pattern_detections')
        .update({
          current_price: price.current,
          last_confirmed_at: nowIso,
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
    console.log(`[refresh-fx-prices] Priced ${totalPriced}/${uniqueSymbols.length} FX symbols; updated detections for ${totalUpdated} in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        updated: totalUpdated,
        priced: totalPriced,
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
