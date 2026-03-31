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

/** 
 * Aggregate 1h bars into N-hour bars (4h or 8h) with UTC-anchored boundaries.
 * 
 * For 24-hour markets (crypto, FX), bars are anchored to fixed UTC periods:
 *   4H: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
 *   8H: 00:00, 08:00, 16:00 UTC
 * 
 * Partial bars (incomplete periods) are dropped to prevent distorted OHLC.
 *
 * Expected aggregation test case:
 *   Input 1H bars:
 *     Bar1: O=1.0800 H=1.0850 L=1.0780 C=1.0820 V=1000
 *     Bar2: O=1.0820 H=1.0900 L=1.0810 C=1.0880 V=1200
 *     Bar3: O=1.0880 H=1.0920 L=1.0860 C=1.0870 V=800
 *     Bar4: O=1.0870 H=1.0890 L=1.0830 C=1.0840 V=1100
 *   Expected 4H bar:
 *     O=1.0800 (bar1 open)
 *     H=1.0920 (max of all highs)
 *     L=1.0780 (min of all lows)
 *     C=1.0840 (bar4 close)
 *     V=4100   (sum of volumes)
 */
export function aggregateHourlyBars(bars: OHLCBar[], hours: number, options?: { minBarsPerPeriod?: number }): OHLCBar[] {
  if (bars.length === 0 || hours <= 1) return bars;
  
  // For non-24h markets (stocks/ETFs), trading sessions are shorter than 8h,
  // so we can't require exactly N bars per period. Default to 2 for safety.
  const minBars = options?.minBarsPerPeriod ?? hours;
  
  // Group bars by UTC-anchored period boundaries
  const grouped = new Map<string, OHLCBar[]>();
  
  for (const bar of bars) {
    const d = new Date(bar.t);
    const utcHour = d.getUTCHours();
    const periodStart = Math.floor(utcHour / hours) * hours;
    
    const boundary = new Date(d);
    boundary.setUTCHours(periodStart, 0, 0, 0);
    const key = boundary.toISOString();
    
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(bar);
  }
  
  const result: OHLCBar[] = [];
  
  for (const [key, windowBars] of grouped) {
    // Skip periods with too few bars
    if (windowBars.length < minBars) continue;
    
    // Sort by time to ensure correct OHLC ordering
    windowBars.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
    
    result.push({
      t: key, // Period start timestamp
      o: windowBars[0].o, // Open = first bar's open
      h: Math.max(...windowBars.map(b => b.h)), // High = max of all highs
      l: Math.min(...windowBars.map(b => b.l)), // Low = min of all lows
      c: windowBars[windowBars.length - 1].c, // Close = last bar's close
      v: windowBars.reduce((sum, b) => sum + b.v, 0), // Volume = sum
    });
  }
  
  result.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
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
    // For non-24h markets (stocks/ETFs/indices), sessions are shorter than 8h
    // so we can't require exactly N bars per period
    const is24h = isCryptoSymbol(symbol) || symbol.endsWith('=X');
    const minBarsPerPeriod = is24h ? aggHours : 2;
    const aggregated = aggregateHourlyBars(rawBars, aggHours, { minBarsPerPeriod });
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
