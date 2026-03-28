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

/** Check if interval is intraday (EODHD doesn't reliably support these) */
function isIntradayInterval(interval: string): boolean {
  return ['1m', '5m', '15m', '30m', '1h', '4h', '8h'].includes(interval);
}

/** Get the actual fetch interval for providers (4h/8h must be fetched as 1h then aggregated) */
export function getProviderInterval(interval: string): string {
  if (interval === '4h' || interval === '8h') return '1h';
  return interval;
}

/** Aggregate 1h bars into N-hour bars (4h or 8h) */
export function aggregateHourlyBars(bars: OHLCBar[], hours: number): OHLCBar[] {
  if (bars.length === 0 || hours <= 1) return bars;
  
  const result: OHLCBar[] = [];
  for (let i = 0; i < bars.length; i += hours) {
    const chunk = bars.slice(i, i + hours);
    if (chunk.length === 0) break;
    
    result.push({
      t: chunk[0].t,
      o: chunk[0].o,
      h: Math.max(...chunk.map(b => b.h)),
      l: Math.min(...chunk.map(b => b.l)),
      c: chunk[chunk.length - 1].c,
      v: chunk.reduce((sum, b) => sum + b.v, 0),
    });
  }
  return result;
}

// ── Provider Health Tracker ──────────────────────────────────────────
// Tracks failures per provider; if a provider fails 3+ times in 5 min,
// skip it and go directly to fallback.
interface ProviderHealth {
  failures: number;
  lastFailureAt: number;
}

const providerHealth = new Map<string, ProviderHealth>();
const HEALTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILURES = 3;

function recordProviderFailure(provider: string) {
  const now = Date.now();
  const entry = providerHealth.get(provider);
  if (!entry || now - entry.lastFailureAt > HEALTH_WINDOW_MS) {
    providerHealth.set(provider, { failures: 1, lastFailureAt: now });
  } else {
    entry.failures++;
    entry.lastFailureAt = now;
  }
}

function recordProviderSuccess(provider: string) {
  providerHealth.delete(provider);
}

function isProviderHealthy(provider: string): boolean {
  const entry = providerHealth.get(provider);
  if (!entry) return true;
  if (Date.now() - entry.lastFailureAt > HEALTH_WINDOW_MS) {
    providerHealth.delete(provider);
    return true;
  }
  return entry.failures < MAX_FAILURES;
}

/**
 * Fetch OHLC bars with provider routing:
 * - Crypto → Binance-first, Yahoo-fallback (skip EODHD entirely)
 * - Intraday non-crypto → Yahoo directly (EODHD returns 403/empty for these)
 * - Daily/weekly non-crypto → EODHD-first, Yahoo-fallback
 * - Provider health tracking: skip providers with 3+ failures in last 5 min
 */
export async function fetchMarketBars(opts: FetchBarsOptions): Promise<OHLCBar[]> {
  const { symbol, startDate, endDate, interval, includeOhlc = true } = opts;
  
  // For 4h/8h, fetch 1h bars then aggregate
  const needsAggregation = interval === '4h' || interval === '8h';
  const fetchInterval = getProviderInterval(interval);
  const aggHours = interval === '8h' ? 8 : interval === '4h' ? 4 : 0;

  const rawBars = await fetchMarketBarsRaw({ symbol, startDate, endDate, interval: fetchInterval, includeOhlc });
  
  if (needsAggregation && rawBars.length > 0) {
    const aggregated = aggregateHourlyBars(rawBars, aggHours);
    console.log(`[fetchMarketBars] Aggregated ${rawBars.length} 1h bars → ${aggregated.length} ${interval} bars for ${symbol}`);
    return aggregated;
  }
  
  return rawBars;
}

async function fetchMarketBarsRaw(opts: FetchBarsOptions): Promise<OHLCBar[]> {
  const { symbol, startDate, endDate, interval, includeOhlc = true } = opts;

  // --- Crypto path: Binance → Yahoo (skip EODHD) ---
  if (isCryptoSymbol(symbol)) {
    if (isProviderHealthy('binance')) {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-binance', {
          body: { symbol, startDate, endDate, interval, includeOhlc },
        });

        if (!error && data?.bars?.length > 0) {
          console.log(`[fetchMarketBars] Binance returned ${data.bars.length} bars for ${symbol}`);
          recordProviderSuccess('binance');
          return normaliseBars(data.bars);
        }

        if (error) {
          console.warn(`[fetchMarketBars] Binance error for ${symbol}:`, error.message ?? error);
          recordProviderFailure('binance');
        } else {
          console.warn(`[fetchMarketBars] Binance returned 0 bars for ${symbol}`);
          recordProviderFailure('binance');
        }
      } catch (e: any) {
        console.warn(`[fetchMarketBars] Binance exception for ${symbol}:`, e?.message ?? e);
        recordProviderFailure('binance');
      }
    } else {
      console.log(`[fetchMarketBars] Skipping Binance (unhealthy) for ${symbol}`);
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

  // --- Non-crypto (all timeframes): EODHD → Yahoo fallback ---
  if (isProviderHealthy('eodhd')) {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-eodhd', {
        body: { symbol, startDate, endDate, interval, includeOhlc },
      });

      if (!error && data?.bars?.length > 0) {
        console.log(`[fetchMarketBars] EODHD returned ${data.bars.length} bars for ${symbol}`);
        recordProviderSuccess('eodhd');
        return normaliseBars(data.bars);
      }

      if (error) {
        console.warn(`[fetchMarketBars] EODHD error for ${symbol}:`, error.message ?? error);
        recordProviderFailure('eodhd');
      } else {
        console.warn(`[fetchMarketBars] EODHD returned 0 bars for ${symbol}`);
        recordProviderFailure('eodhd');
      }
    } catch (e: any) {
      console.warn(`[fetchMarketBars] EODHD exception for ${symbol}:`, e?.message ?? e);
      recordProviderFailure('eodhd');
    }
  } else {
    console.log(`[fetchMarketBars] Skipping EODHD (unhealthy) for ${symbol}`);
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
