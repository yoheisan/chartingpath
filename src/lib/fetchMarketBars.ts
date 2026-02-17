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

/**
 * Fetch OHLC bars using EODHD-first, Yahoo-fallback strategy.
 * Returns normalised bars in CompressedBar format { t, o, h, l, c, v }.
 */
export async function fetchMarketBars(opts: FetchBarsOptions): Promise<OHLCBar[]> {
  const { symbol, startDate, endDate, interval, includeOhlc = true } = opts;

  // --- 1. Try EODHD first ---
  try {
    const { data, error } = await supabase.functions.invoke('fetch-eodhd', {
      body: { symbol, startDate, endDate, interval, includeOhlc },
    });

    if (!error && data?.bars?.length > 0) {
      console.log(`[fetchMarketBars] EODHD returned ${data.bars.length} bars for ${symbol}`);
      return normaliseBars(data.bars);
    }

    // EODHD returned 0 bars or an error response (e.g. 404) – fall through
    if (error) {
      console.warn(`[fetchMarketBars] EODHD error for ${symbol}, falling back to Yahoo:`, error.message ?? error);
    } else {
      console.warn(`[fetchMarketBars] EODHD returned 0 bars for ${symbol}, falling back to Yahoo`);
    }
  } catch (e: any) {
    console.warn(`[fetchMarketBars] EODHD exception for ${symbol}:`, e?.message ?? e);
  }

  // --- 2. Fallback to Yahoo Finance ---
  const { data, error } = await supabase.functions.invoke('fetch-yahoo-finance', {
    body: { symbol, startDate, endDate, interval, includeOhlc },
  });

  if (error) {
    throw new Error(error.message || `Failed to fetch bars for ${symbol}`);
  }

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
