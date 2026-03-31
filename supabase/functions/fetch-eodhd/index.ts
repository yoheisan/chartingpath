import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EODHDRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  interval?: string; // 1h, d, w, m
  includeOhlc?: boolean;
}

interface OHLCBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

/**
 * Convert interval to EODHD format
 * EODHD supports: 1m, 5m, 1h for intraday; d, w, m for EOD
 */
function toEODHDInterval(interval: string): string {
  const mapping: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '5m', // EODHD doesn't have 15m, aggregate from 5m
    '30m': '5m', // Aggregate from 5m
    '1h': '1h',
    '4h': '1h', // Aggregate from 1h
    '1d': 'd',
    '1wk': 'w',
    '1mo': 'm',
    'd': 'd',
    'w': 'w',
    'm': 'm'
  };
  return mapping[interval] || 'd';
}

/**
 * Aggregate 5m bars into 15m or 30m bars
 */
function aggregate5mBars(bars: OHLCBar[], targetMinutes: number): OHLCBar[] {
  if (!bars || bars.length === 0) return [];
  
  const groupedBars = new Map<string, OHLCBar[]>();
  
  for (const bar of bars) {
    const date = new Date(bar.t);
    const minutes = date.getUTCHours() * 60 + date.getUTCMinutes();
    const windowStart = Math.floor(minutes / targetMinutes) * targetMinutes;
    
    const windowDate = new Date(date);
    windowDate.setUTCHours(Math.floor(windowStart / 60), windowStart % 60, 0, 0);
    const key = windowDate.toISOString();
    
    if (!groupedBars.has(key)) {
      groupedBars.set(key, []);
    }
    groupedBars.get(key)!.push(bar);
  }
  
  const aggregatedBars: OHLCBar[] = [];
  
  for (const [windowKey, windowBars] of groupedBars) {
    if (windowBars.length === 0) continue;
    windowBars.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
    
    aggregatedBars.push({
      t: windowKey,
      o: windowBars[0].o,
      h: Math.max(...windowBars.map(b => b.h)),
      l: Math.min(...windowBars.map(b => b.l)),
      c: windowBars[windowBars.length - 1].c,
      v: windowBars.reduce((sum, b) => sum + b.v, 0),
    });
  }
  
  aggregatedBars.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  return aggregatedBars;
}

/**
 * Aggregate 1h bars into 4h bars
 */
function aggregate1hTo4h(bars: OHLCBar[], symbol: string = ''): OHLCBar[] {
  if (!bars || bars.length === 0) return [];
  
  const groupedBars = new Map<string, OHLCBar[]>();
  
  for (const bar of bars) {
    const date = new Date(bar.t);
    const hour = date.getUTCHours();
    const windowStart = Math.floor(hour / 4) * 4;
    
    const windowDate = new Date(date);
    windowDate.setUTCHours(windowStart, 0, 0, 0);
    const key = windowDate.toISOString();
    
    if (!groupedBars.has(key)) {
      groupedBars.set(key, []);
    }
    groupedBars.get(key)!.push(bar);
  }
  
  const aggregatedBars: OHLCBar[] = [];
  
  for (const [windowKey, windowBars] of groupedBars) {
    if (windowBars.length === 0) continue;
    // Non-24h markets (stocks/ETFs/indices) trade ~6.5h — require 5 bars minimum
    // This threshold MUST match MIN_BARS_NON_24H across all aggregation paths
    const is24h = symbol.includes('-USD') || symbol.includes('=X') || symbol.includes('.CC') || symbol.includes('.FOREX');
    const minBars = is24h ? 4 : 5;
    if (windowBars.length < minBars) continue;
    
    windowBars.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
    
    aggregatedBars.push({
      t: windowKey,
      o: windowBars[0].o,
      h: Math.max(...windowBars.map(b => b.h)),
      l: Math.min(...windowBars.map(b => b.l)),
      c: windowBars[windowBars.length - 1].c,
      v: windowBars.reduce((sum, b) => sum + b.v, 0),
    });
  }
  
  aggregatedBars.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  return aggregatedBars;
}

/**
 * Convert symbol to EODHD format
 * EODHD uses: AAPL.US for stocks, BTC-USD for crypto, EURUSD.FOREX for forex
 */
function toEODHDSymbol(symbol: string): { eodhSymbol: string; exchange: string } {
  // Crypto: BTC-USD format → BTC-USD.CC (CryptoCompare exchange on EODHD)
  if (symbol.includes('-USD') && !symbol.startsWith('^') && !symbol.includes('=')) {
    const crypto = symbol.replace('-USD', '');
    return { eodhSymbol: `${crypto}-USD.CC`, exchange: 'CC' };
  }
  
  // Forex: EURUSD=X format -> EURUSD.FOREX
  if (symbol.includes('=X')) {
    const pair = symbol.replace('=X', '');
    return { eodhSymbol: `${pair}.FOREX`, exchange: 'FOREX' };
  }
  
  // Futures/Commodities: GC=F format -> GC.COMM
  if (symbol.includes('=F')) {
    const commodity = symbol.replace('=F', '');
    return { eodhSymbol: `${commodity}.COMM`, exchange: 'COMM' };
  }
  
  // Indices: ^GSPC format -> GSPC.INDX
  if (symbol.startsWith('^')) {
    const index = symbol.replace('^', '');
    const indexMapping: Record<string, string> = {
      'GSPC': 'GSPC.INDX',
      'DJI': 'DJI.INDX',
      'IXIC': 'IXIC.INDX',
      'NDX': 'NDX.INDX',
      'RUT': 'RUT.INDX',
      'VIX': 'VIX.INDX',
      'FTSE': 'FTSE.INDX',
      'GDAXI': 'GDAXI.INDX',
      'N225': 'N225.INDX',
      'HSI': 'HSI.INDX',
    };
    return { eodhSymbol: indexMapping[index] || `${index}.INDX`, exchange: 'INDX' };
  }

  // Dollar Index: DX-Y.NYB is not supported by EODHD — signal 404 to fall back to Yahoo
  if (symbol.includes('DX-Y')) {
    return { eodhSymbol: '__UNSUPPORTED__', exchange: 'NYB' };
  }

  // Hong Kong stocks: 0700.HK → 0700.HK (EODHD uses same format)
  if (symbol.endsWith('.HK')) {
    return { eodhSymbol: symbol, exchange: 'HK' };
  }

  // Singapore stocks: D05.SI → D05.SG (EODHD uses .SG for SGX)
  if (symbol.endsWith('.SI')) {
    const base = symbol.replace('.SI', '');
    return { eodhSymbol: `${base}.SG`, exchange: 'SG' };
  }

  // Thailand stocks: PTT.BK → PTT.BK (EODHD uses same format)
  if (symbol.endsWith('.BK')) {
    return { eodhSymbol: symbol, exchange: 'BK' };
  }

  // Shanghai/Shenzhen indices: 000001.SS → 000001.SHG, 399001.SZ → 399001.SHE
  if (symbol.endsWith('.SS')) {
    const base = symbol.replace('.SS', '');
    return { eodhSymbol: `${base}.SHG`, exchange: 'SHG' };
  }
  if (symbol.endsWith('.SZ')) {
    const base = symbol.replace('.SZ', '');
    return { eodhSymbol: `${base}.SHE`, exchange: 'SHE' };
  }

  // Default: US stocks
  return { eodhSymbol: `${symbol}.US`, exchange: 'US' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
  
  if (!EODHD_API_KEY) {
    console.error('[fetch-eodhd] EODHD_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: 'EODHD API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const {
      symbol,
      startDate,
      endDate,
      interval = '1d',
      includeOhlc = false,
    }: EODHDRequest = await req.json();
    
    const needs4hAggregation = interval === '4h';
    const needs15mAggregation = interval === '15m';
    const needs30mAggregation = interval === '30m';
    const eodhInterval = toEODHDInterval(interval);
    const { eodhSymbol, exchange } = toEODHDSymbol(symbol);

    // Symbol explicitly marked as unsupported — return empty 200 so caller falls through to Yahoo
    if (eodhSymbol === '__UNSUPPORTED__') {
      console.log(`[fetch-eodhd] Symbol ${symbol} not supported by EODHD, returning empty for Yahoo fallback`);
      return new Response(
        JSON.stringify({ bars: [], index: [], columns: [symbol], data: [], meta: { provider: 'eodhd', unsupported: true } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure minimum 30-day window — EODHD returns 404 for very short ranges on some instruments
    const isIntraday = ['1m', '5m', '1h'].includes(eodhInterval);
    let effectiveStartDate = startDate;
    if (!isIntraday) {
      const end = new Date(endDate);
      const start = new Date(startDate);
      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 30) {
        const minStart = new Date(end);
        minStart.setDate(minStart.getDate() - 30);
        effectiveStartDate = minStart.toISOString().split('T')[0];
        console.log(`[fetch-eodhd] Expanded date range from ${startDate} to ${effectiveStartDate} (min 30d window)`);
      }
    }
    
    console.log(`[fetch-eodhd] Fetching ${eodhSymbol} from ${effectiveStartDate} to ${endDate} @ ${eodhInterval}${needs4hAggregation ? ' (will aggregate to 4h)' : ''}`);

    let eodhUrl: string;
    if (isIntraday) {
      // EODHD intraday API requires Unix timestamps (numbers) for from/to
      const fromTs = Math.floor(new Date(effectiveStartDate).getTime() / 1000);
      const toTs = Math.floor(new Date(endDate).getTime() / 1000);
      eodhUrl = `https://eodhd.com/api/intraday/${eodhSymbol}?api_token=${EODHD_API_KEY}&interval=${eodhInterval}&from=${fromTs}&to=${toTs}&fmt=json`;
    } else {
      eodhUrl = `https://eodhd.com/api/eod/${eodhSymbol}?api_token=${EODHD_API_KEY}&from=${effectiveStartDate}&to=${endDate}&period=${eodhInterval}&fmt=json`;
    }

    const response = await fetch(eodhUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetch-eodhd] API error ${response.status} for ${eodhSymbol}: ${errorText}`);
      // Return 200 with empty bars so calling code can fall back to Yahoo Finance without error tracking noise
      return new Response(
        JSON.stringify({ bars: [], index: [], columns: [symbol], data: [], meta: { provider: 'eodhd', apiError: response.status } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`[fetch-eodhd] No data returned for ${eodhSymbol}, signalling empty for Yahoo fallback`);
      return new Response(
        JSON.stringify({ bars: [], index: [], columns: [symbol], data: [], meta: { provider: 'eodhd', noData: true } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse EODHD response format
    let ohlcBars: OHLCBar[];
    
    if (isIntraday) {
      // Intraday format: { timestamp, gmtoffset, datetime, open, high, low, close, volume }
      ohlcBars = data
        .filter((bar: any) => bar.close && Number.isFinite(bar.close))
        .map((bar: any) => ({
          t: bar.datetime || new Date(bar.timestamp * 1000).toISOString(),
          o: Number(bar.open),
          h: Number(bar.high),
          l: Number(bar.low),
          c: Number(bar.close),
          v: Number(bar.volume) || 0,
        }));
    } else {
      // EOD format: { date, open, high, low, close, adjusted_close, volume }
      ohlcBars = data
        .filter((bar: any) => bar.close && Number.isFinite(bar.close))
        .map((bar: any) => ({
          t: new Date(bar.date).toISOString(),
          o: Number(bar.open),
          h: Number(bar.high),
          l: Number(bar.low),
          c: Number(bar.adjusted_close || bar.close),
          v: Number(bar.volume) || 0,
        }));
    }
    
    // Aggregate if needed
    if (needs4hAggregation && ohlcBars.length > 0) {
      console.log(`[fetch-eodhd] Aggregating ${ohlcBars.length} 1h bars to 4h`);
      ohlcBars = aggregate1hTo4h(ohlcBars, symbol);
      console.log(`[fetch-eodhd] Result: ${ohlcBars.length} 4h bars`);
    } else if (needs15mAggregation && ohlcBars.length > 0) {
      console.log(`[fetch-eodhd] Aggregating ${ohlcBars.length} 5m bars to 15m`);
      ohlcBars = aggregate5mBars(ohlcBars, 15);
      console.log(`[fetch-eodhd] Result: ${ohlcBars.length} 15m bars`);
    } else if (needs30mAggregation && ohlcBars.length > 0) {
      console.log(`[fetch-eodhd] Aggregating ${ohlcBars.length} 5m bars to 30m`);
      ohlcBars = aggregate5mBars(ohlcBars, 30);
      console.log(`[fetch-eodhd] Result: ${ohlcBars.length} 30m bars`);
    }
    
    // Format response compatible with Yahoo Finance format
    const priceFrame: Record<string, unknown> = {
      index: ohlcBars.map(bar => bar.t.split('T')[0]),
      columns: [symbol],
      data: ohlcBars.map(bar => [bar.c]),
      meta: {
        provider: 'eodhd',
        interval: interval,
        exchange: exchange,
        symbol: eodhSymbol,
        aggregated: needs4hAggregation,
      }
    };

    if (includeOhlc) {
      priceFrame.bars = ohlcBars;
    }

    console.log(`[fetch-eodhd] Successfully fetched ${ohlcBars.length} bars for ${symbol} (${interval})`);

    return new Response(
      JSON.stringify(priceFrame),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[fetch-eodhd] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to fetch data from EODHD'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
