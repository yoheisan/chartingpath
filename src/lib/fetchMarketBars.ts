import { supabase } from '@/integrations/supabase/client';

export interface OHLCBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface FetchBarsOptions {
  symbol: string;
  startDate: string;
  endDate: string;
  interval: string;
  includeOhlc?: boolean;
}

/** Check if a symbol is a crypto ticker (e.g. BTC-USD, ETH-USD) */
function isCryptoSymbol(symbol: string): boolean {
  return /^[A-Z0-9]+-USD$/i.test(symbol) || symbol.toUpperCase().endsWith('USDT');
}

/**
 * Fetch OHLC bars with provider routing:
 * - Crypto → Binance-first, Yahoo-fallback (skip EODHD entirely)
 * - Everything else → EODHD-first, Yahoo-fallback
 */
export async function fetchMarketBars(opts: FetchBarsOptions): Promise<OHLCBar[]> {
  const { symbol, startDate, endDate, interval, includeOhlc = true } = opts;

  // --- Crypto path: Binance → Yahoo (skip EODHD) ---
  if (isCryptoSymbol(symbol)) {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-binance', {
        body: { symbol, startDate, endDate, interval, includeOhlc },
      });

      if (!error && data?.bars?.length > 0) {
        console.log(`[fetchMarketBars] Binance returned ${data.bars.length} bars for ${symbol}`);
        return normaliseBars(data.bars);
      }

      if (error) {
        console.warn(`[fetchMarketBars] Binance error for ${symbol}, falling back to Yahoo:`, error.message ?? error);
      } else {
        console.warn(`[fetchMarketBars] Binance returned 0 bars for ${symbol}, falling back to Yahoo`);
      }
    } catch (e: any) {
      console.warn(`[fetchMarketBars] Binance exception for ${symbol}:`, e?.message ?? e);
    }

    // Crypto fallback: Yahoo
    const { data, error } = await supabase.functions.invoke('fetch-yahoo-finance', {
      body: { symbol, startDate, endDate, interval, includeOhlc },
    });
    if (error) throw new Error(error.message || `Failed to fetch bars for ${symbol}`);
    const bars = normaliseBars(data?.bars ?? []);
    console.log(`[fetchMarketBars] Yahoo returned ${bars.length} bars for ${symbol} (crypto fallback)`);
    return bars;
  }

  // --- Non-crypto path: EODHD → Yahoo ---
  try {
    const { data, error } = await supabase.functions.invoke('fetch-eodhd', {
      body: { symbol, startDate, endDate, interval, includeOhlc },
    });

    if (!error && data?.bars?.length > 0) {
      console.log(`[fetchMarketBars] EODHD returned ${data.bars.length} bars for ${symbol}`);
      return normaliseBars(data.bars);
    }

    if (error) {
      console.warn(`[fetchMarketBars] EODHD error for ${symbol}, falling back to Yahoo:`, error.message ?? error);
    } else {
      console.warn(`[fetchMarketBars] EODHD returned 0 bars for ${symbol}, falling back to Yahoo`);
    }
  } catch (e: any) {
    console.warn(`[fetchMarketBars] EODHD exception for ${symbol}:`, e?.message ?? e);
  }

  // Non-crypto fallback: Yahoo
  const { data, error } = await supabase.functions.invoke('fetch-yahoo-finance', {
    body: { symbol, startDate, endDate, interval, includeOhlc },
  });
  if (error) throw new Error(error.message || `Failed to fetch bars for ${symbol}`);
  const bars = normaliseBars(data?.bars ?? []);
  console.log(`[fetchMarketBars] Yahoo returned ${bars.length} bars for ${symbol}`);
  return bars;
}

/** Normalise heterogeneous bar shapes into { t, o, h, l, c, v } */
function normaliseBars(raw: any[]): OHLCBar[] {
  return raw.map((b: any) => ({
    t: b.t || b.date || (typeof b.timestamp === 'number' ? new Date(b.timestamp * 1000).toISOString() : b.timestamp) || '',
    o: Number(b.o ?? b.open ?? 0),
    h: Number(b.h ?? b.high ?? 0),
    l: Number(b.l ?? b.low ?? 0),
    c: Number(b.c ?? b.close ?? 0),
    v: Number(b.v ?? b.volume ?? 0),
  }));
}
