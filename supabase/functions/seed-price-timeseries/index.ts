import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ALL_INSTRUMENTS } from "../_shared/screenerInstruments.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Background Price Timeseries Seeder
 * 
 * Seeds raw OHLCV bars (1m, 5m, 15m, 1h, 4h) into historical_prices table.
 * Designed for LOW-PRIORITY background execution during off-peak hours (12:00–04:00 UTC).
 * 
 * Does NOT run pattern detection — only persists raw price data for future use.
 * 
 * Provider routing:
 * - Crypto: Binance (free, 1000 candles/request, 730+ days for 1h+)
 * - FX: EODHD (primary) → Yahoo fallback (last resort)
 * - Stocks/ETFs/Indices: EODHD (primary) → Yahoo fallback (last resort)
 */

interface SeedRequest {
  partition?: string;       // fx, crypto, stocks, commodities, indices, etfs
  timeframes?: string[];    // 1m, 5m, 15m, 1h, 4h
  maxSymbols?: number;      // limit symbols per run (default: 10)
  offset?: number;          // pagination offset
  forceRefresh?: boolean;   // bypass existing bar count skip logic
}

interface OHLCBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Provider limits by timeframe
const TIMEFRAME_LIMITS: Record<string, { yahooDays: number; binanceDays: number; eodhdDays: number }> = {
  '1m':  { yahooDays: 7,   binanceDays: 30,  eodhdDays: 7 },
  '5m':  { yahooDays: 7,   binanceDays: 60,  eodhdDays: 7 },
  '15m': { yahooDays: 60,  binanceDays: 200, eodhdDays: 60 },
  '1h':  { yahooDays: 729, binanceDays: 730, eodhdDays: 120 },
  '4h':  { yahooDays: 729, binanceDays: 730, eodhdDays: 120 },
  '8h':  { yahooDays: 729, binanceDays: 730, eodhdDays: 365 },
  '1d':  { yahooDays: 1825, binanceDays: 1825, eodhdDays: 3650 },
};

const BINANCE_INTERVALS: Record<string, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '8h': '8h', '1d': '1d',
};

const YAHOO_INTERVALS: Record<string, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '1h', '8h': '1h', '1d': '1d',
};

// ============= PROVIDERS =============

async function fetchBinanceBars(symbol: string, timeframe: string, lookbackDays: number): Promise<OHLCBar[]> {
  const binanceSymbol = symbol.replace('-USD', '').replace('-', '') + 'USDT';
  const interval = BINANCE_INTERVALS[timeframe];
  if (!interval) return [];

  const endMs = Date.now();
  const startMs = endMs - lookbackDays * 24 * 60 * 60 * 1000;
  const allBars: OHLCBar[] = [];
  let currentStart = startMs;

  try {
    while (currentStart < endMs) {
      const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&startTime=${currentStart}&endTime=${endMs}&limit=1000`;
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`[seed-prices] Binance error for ${binanceSymbol}: ${response.status}`);
        return allBars;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`[seed-prices] Binance returned empty data for ${binanceSymbol}@${interval}`);
        break;
      }

      for (const k of data) {
        allBars.push({
          date: new Date(k[0]).toISOString(),
          open: Number(k[1]), high: Number(k[2]),
          low: Number(k[3]), close: Number(k[4]),
          volume: Number(k[5]),
        });
      }

      currentStart = data[data.length - 1][0] + 1;
      if (data.length < 1000) break;
      await new Promise(r => setTimeout(r, 100));
    }
    return allBars;
  } catch { return allBars; }
}

async function fetchYahooBars(symbol: string, timeframe: string, lookbackDays: number): Promise<OHLCBar[]> {
  const interval = YAHOO_INTERVALS[timeframe];
  if (!interval) return [];

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  const encoded = encodeURIComponent(symbol);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?period1=${period1}&period2=${period2}&interval=${interval}&events=history`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    if (!response.ok) return [];

    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];

    const timestamps = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};

    let bars = timestamps.map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString(),
      open: q.open?.[i] || 0, high: q.high?.[i] || 0,
      low: q.low?.[i] || 0, close: q.close?.[i] || 0,
      volume: q.volume?.[i] || 0,
    })).filter((b: OHLCBar) => b.close > 0);

    // Aggregate 1h → 4h/8h if needed
    if (timeframe === '4h') {
      bars = aggregate(bars, 4);
    } else if (timeframe === '8h') {
      bars = aggregate(bars, 8);
    }

    return bars;
  } catch { return []; }
}

// Non-24h markets require MIN_BARS_NON_24H=5 bars per period.
// This threshold MUST match all other aggregation paths.
const MIN_BARS_NON_24H = 5;

function aggregate(bars: OHLCBar[], factor: number, is24hMarket: boolean = true): OHLCBar[] {
  const minBars = is24hMarket ? factor : MIN_BARS_NON_24H;
  const grouped = new Map<string, OHLCBar[]>();
  
  for (const bar of bars) {
    const d = new Date(bar.date);
    const utcHour = d.getUTCHours();
    const periodStart = Math.floor(utcHour / factor) * factor;
    const boundary = new Date(d);
    boundary.setUTCHours(periodStart, 0, 0, 0);
    const key = boundary.toISOString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(bar);
  }
  
  const result: OHLCBar[] = [];
  for (const [key, wBars] of grouped) {
    if (wBars.length < minBars) continue;
    wBars.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    result.push({
      date: key,
      open: wBars[0].open,
      high: Math.max(...wBars.map(b => b.high)),
      low: Math.min(...wBars.map(b => b.low)),
      close: wBars[wBars.length - 1].close,
      volume: wBars.reduce((s, b) => s + b.volume, 0),
    });
  }
  
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return result;
}

function toEODHDSymbol(symbol: string): string {
  if (symbol.includes('-USD')) return `${symbol.replace('-USD', '')}-USD.CC`;
  if (symbol.includes('=X')) return `${symbol.replace('=X', '')}.FOREX`;
  if (symbol.includes('=F')) return `${symbol.replace('=F', '')}.COMM`;
  if (symbol.startsWith('^')) return `${symbol.replace('^', '')}.INDX`;
  return `${symbol}.US`;
}

async function fetchEODHDBars(symbol: string, timeframe: string, lookbackDays: number): Promise<OHLCBar[]> {
  const apiKey = Deno.env.get('EODHD_API_KEY');
  if (!apiKey) return [];

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const eodhSymbol = toEODHDSymbol(symbol);

  const isIntraday = ['1m', '5m', '15m', '1h', '4h', '8h'].includes(timeframe);
  const eodhInterval = (timeframe === '4h' || timeframe === '8h') ? '1h' : timeframe;

  let url: string;
  if (isIntraday) {
    url = `https://eodhd.com/api/intraday/${eodhSymbol}?api_token=${apiKey}&interval=${eodhInterval}&from=${startDate.toISOString().split('T')[0]}&to=${endDate.toISOString().split('T')[0]}&fmt=json`;
  } else {
    // Daily bars via EODHD EOD endpoint
    url = `https://eodhd.com/api/eod/${eodhSymbol}?api_token=${apiKey}&from=${startDate.toISOString().split('T')[0]}&to=${endDate.toISOString().split('T')[0]}&fmt=json`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    let bars = data.filter((b: any) => b.close && Number.isFinite(b.close)).map((b: any) => ({
      date: b.datetime || new Date(b.timestamp * 1000).toISOString(),
      open: Number(b.open), high: Number(b.high),
      low: Number(b.low), close: Number(b.close),
      volume: Number(b.volume) || 0,
    }));

    if (timeframe === '4h') bars = aggregate(bars, 4);
    else if (timeframe === '8h') bars = aggregate(bars, 8);
    return bars;
  } catch { return []; }
}

// ============= SMART ROUTING =============

function getAssetType(symbol: string): string {
  if (symbol.includes('-USD') && !symbol.includes('=')) return 'crypto';
  if (symbol.includes('=X')) return 'fx';
  if (symbol.includes('=F')) return 'commodities';
  if (symbol.startsWith('^')) return 'indices';
  return 'stocks';
}

async function fetchBarsForSymbol(symbol: string, timeframe: string): Promise<OHLCBar[]> {
  const limits = TIMEFRAME_LIMITS[timeframe] || TIMEFRAME_LIMITS['1h'];
  const isCrypto = symbol.includes('-USD') && !symbol.includes('=');
  const isFX = symbol.includes('=X');

  if (isCrypto) {
    // Binance first (deepest history for crypto)
    let bars = await fetchBinanceBars(symbol, timeframe, limits.binanceDays);
    if (bars.length === 0) bars = await fetchYahooBars(symbol, timeframe, limits.yahooDays);
    return bars;
  }

  if (isFX) {
    // EODHD first for FX (primary source), Yahoo as last-resort fallback
    let bars = await fetchEODHDBars(symbol, timeframe, limits.eodhdDays);
    if (bars.length === 0) bars = await fetchYahooBars(symbol, timeframe, limits.yahooDays);
    return bars;
  }

  // Stocks/ETFs/Indices: EODHD → Yahoo
  let bars = await fetchEODHDBars(symbol, timeframe, limits.eodhdDays);
  if (bars.length === 0) bars = await fetchYahooBars(symbol, timeframe, limits.yahooDays);
  return bars;
}

// ============= PERSISTENCE =============

async function persistBars(
  supabase: any,
  symbol: string,
  timeframe: string,
  assetType: string,
  bars: OHLCBar[]
): Promise<number> {
  if (bars.length === 0) return 0;

  const CHUNK = 500;
  let persisted = 0;

  for (let i = 0; i < bars.length; i += CHUNK) {
    const chunk = bars.slice(i, i + CHUNK);
    const rows = chunk.map(bar => ({
      symbol,
      timeframe,
      instrument_type: assetType,
      date: bar.date,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: Math.floor(bar.volume || 0),
    }));

    const { error } = await supabase
      .from('historical_prices')
      .upsert(rows, { onConflict: 'symbol,timeframe,date', ignoreDuplicates: true });

    if (!error) persisted += chunk.length;
    else console.warn(`[seed-prices] Upsert error for ${symbol}@${timeframe}: ${error.message}`);
  }

  return persisted;
}

// ============= CHECK EXISTING COVERAGE =============

async function getExistingBarCount(
  supabase: any,
  symbol: string,
  timeframe: string
): Promise<number> {
  const { count, error } = await supabase
    .from('historical_prices')
    .select('id', { count: 'exact', head: true })
    .eq('symbol', symbol)
    .eq('timeframe', timeframe);

  if (error) return 0;
  return count || 0;
}

// ============= MAIN HANDLER =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: SeedRequest = {};
    try { body = await req.json(); } catch {}

    const partition = body.partition || 'crypto';
    const timeframes = body.timeframes || ['15m'];
    const maxSymbols = body.maxSymbols || 10;
    const offset = body.offset || 0;
    const forceRefresh = body.forceRefresh || false;

    console.log(`[seed-prices] Starting: partition=${partition}, timeframes=${timeframes.join(',')}, max=${maxSymbols}, offset=${offset}, forceRefresh=${forceRefresh}`);

    // Get instruments for partition
    const instrumentList = ALL_INSTRUMENTS[partition as keyof typeof ALL_INSTRUMENTS] || [];
    const symbols = instrumentList.slice(offset, offset + maxSymbols);
    const hasMore = offset + maxSymbols < instrumentList.length;

    const results: Array<{ symbol: string; timeframe: string; bars: number; skipped: boolean }> = [];
    let totalPersisted = 0;

    for (const inst of symbols) {
      const symbol = inst.yahooSymbol;
      const assetType = getAssetType(symbol);

      for (const tf of timeframes) {
        const limits = TIMEFRAME_LIMITS[tf];
        if (!limits) continue;

        // Check if we already have data (skip if already seeded) — unless forceRefresh
        let existing = 0;
        if (!forceRefresh) {
          existing = await getExistingBarCount(supabase, symbol, tf);
          const expectedBars = estimateExpectedBars(tf, limits.yahooDays);
          if (existing > expectedBars * 0.8) {
            results.push({ symbol, timeframe: tf, bars: existing, skipped: true });
            continue;
          }
        }

        console.log(`[seed-prices] Fetching ${symbol}@${tf} (existing: ${existing} bars)`);
        const bars = await fetchBarsForSymbol(symbol, tf);

        if (bars.length > 0) {
          const persisted = await persistBars(supabase, symbol, tf, assetType, bars);
          totalPersisted += persisted;
          results.push({ symbol, timeframe: tf, bars: persisted, skipped: false });
          console.log(`[seed-prices] Persisted ${persisted} bars for ${symbol}@${tf}`);
        } else {
          results.push({ symbol, timeframe: tf, bars: 0, skipped: false });
        }

        // Rate limit: 500ms between fetches to avoid provider throttling
        await new Promise(r => setTimeout(r, 500));
      }

      // 1s between symbols
      await new Promise(r => setTimeout(r, 1000));
    }

    const durationMs = Date.now() - startTime;

    console.log(`[seed-prices] Complete: ${totalPersisted} bars persisted in ${(durationMs / 1000).toFixed(1)}s`);

    // Log analytics
    try {
      await supabase.from('analytics_events').insert({
        event_name: 'price_timeseries_seeding',
        properties: {
          partition, timeframes, totalPersisted,
          symbolsProcessed: symbols.length,
          durationMs, hasMore,
          nextOffset: hasMore ? offset + maxSymbols : null,
        }
      });
    } catch {}

    return new Response(JSON.stringify({
      success: true,
      partition,
      timeframes,
      totalPersisted,
      symbolsProcessed: symbols.length,
      hasMore,
      nextOffset: hasMore ? offset + maxSymbols : null,
      durationSeconds: (durationMs / 1000).toFixed(1),
      results: results.slice(0, 50),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[seed-prices] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function estimateExpectedBars(timeframe: string, lookbackDays: number): number {
  const barsPerDay: Record<string, number> = {
    '1m': 1440, '5m': 288, '15m': 96, '1h': 24, '4h': 6, '8h': 3, '1d': 1,
  };
  return (barsPerDay[timeframe] || 24) * lookbackDays;
}
