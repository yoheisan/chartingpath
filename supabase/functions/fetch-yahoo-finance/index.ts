import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YahooFinanceRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  interval?: string; // 1d, 1wk, 1mo, 1h, 4h, etc.
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
 * Aggregate 1h bars into larger timeframe bars
 * @param bars - Array of 1h OHLC bars
 * @param hoursPerBar - Number of hours to aggregate (4 or 8)
 */
function aggregate1hBars(bars: OHLCBar[], hoursPerBar: number): OHLCBar[] {
  if (!bars || bars.length === 0) return [];
  
  // Group bars by N-hour window
  const groupedBars = new Map<string, OHLCBar[]>();
  
  for (const bar of bars) {
    const date = new Date(bar.t);
    const hour = date.getUTCHours();
    // Determine N-hour window start
    const windowStart = Math.floor(hour / hoursPerBar) * hoursPerBar;
    
    // Create key for this N-hour window
    const windowDate = new Date(date);
    windowDate.setUTCHours(windowStart, 0, 0, 0);
    const key = windowDate.toISOString();
    
    if (!groupedBars.has(key)) {
      groupedBars.set(key, []);
    }
    groupedBars.get(key)!.push(bar);
  }
  
  // Aggregate each group into a single bar
  const aggregatedBars: OHLCBar[] = [];
  
  for (const [windowKey, windowBars] of groupedBars) {
    if (windowBars.length === 0) continue;
    
    // Sort bars by time to ensure correct OHLC
    windowBars.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
    
    const aggregated: OHLCBar = {
      t: windowKey, // Use window start time
      o: windowBars[0].o, // Open of first bar
      h: Math.max(...windowBars.map(b => b.h)), // Highest high
      l: Math.min(...windowBars.map(b => b.l)), // Lowest low
      c: windowBars[windowBars.length - 1].c, // Close of last bar
      v: windowBars.reduce((sum, b) => sum + b.v, 0), // Sum of volumes
    };
    
    aggregatedBars.push(aggregated);
  }
  
  // Sort by time ascending
  aggregatedBars.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  
  return aggregatedBars;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      symbol,
      startDate,
      endDate,
      interval = '1d',
      includeOhlc = false,
    }: YahooFinanceRequest = await req.json();
    
    // Determine if we need to aggregate from 1h data
    const needs4hAggregation = interval === '4h';
    const needs8hAggregation = interval === '8h';
    const needsAggregation = needs4hAggregation || needs8hAggregation;
    const yahooInterval = needsAggregation ? '1h' : interval;
    
    console.log(`Fetching Yahoo Finance data for ${symbol} from ${startDate} to ${endDate} with interval ${interval}${needsAggregation ? ` (fetching 1h for ${interval} aggregation)` : ''}`);

    // Convert dates to Unix timestamps
    const period1 = Math.floor(new Date(startDate).getTime() / 1000);
    const period2 = Math.floor(new Date(endDate).getTime() / 1000);

    // Yahoo Finance query URL - use yahooInterval (1h if 4h requested)
    // IMPORTANT: symbol must be URL-encoded because index tickers include special chars (e.g. ^GSPC)
    const encodedSymbol = encodeURIComponent(symbol);
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?period1=${period1}&period2=${period2}&interval=${yahooInterval}&events=history`;

    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      throw new Error('No data returned from Yahoo Finance');
    }

    const result = data.chart.result[0];
    const timestamps: number[] = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];

    if (!Array.isArray(timestamps) || timestamps.length === 0 || !quotes) {
      throw new Error('Yahoo Finance returned an empty time series');
    }

    // Build OHLC bars
    let ohlcBars: OHLCBar[] = timestamps
      .map((ts: number, idx: number) => {
        const o = quotes.open?.[idx];
        const h = quotes.high?.[idx];
        const l = quotes.low?.[idx];
        const c = quotes.close?.[idx];
        const v = quotes.volume?.[idx] ?? 0;

        // Filter out null/undefined points
        if (
          !Number.isFinite(o) ||
          !Number.isFinite(h) ||
          !Number.isFinite(l) ||
          !Number.isFinite(c)
        ) {
          return null;
        }

        return {
          t: new Date(ts * 1000).toISOString(),
          o: Number(o),
          h: Number(h),
          l: Number(l),
          c: Number(c),
          v: Number(v) || 0,
        };
      })
      .filter((bar): bar is OHLCBar => bar !== null);
    
    // Aggregate to 4h or 8h if needed
    if (needs4hAggregation && ohlcBars.length > 0) {
      console.log(`Aggregating ${ohlcBars.length} 1h bars into 4h bars`);
      ohlcBars = aggregate1hBars(ohlcBars, 4);
      console.log(`Result: ${ohlcBars.length} 4h bars`);
    } else if (needs8hAggregation && ohlcBars.length > 0) {
      console.log(`Aggregating ${ohlcBars.length} 1h bars into 8h bars`);
      ohlcBars = aggregate1hBars(ohlcBars, 8);
      console.log(`Result: ${ohlcBars.length} 8h bars`);
    }
    
    // Format data into PriceFrame format
    const priceFrame: Record<string, unknown> = {
      index: ohlcBars.map(bar => bar.t.split('T')[0]),
      columns: [symbol],
      data: ohlcBars.map(bar => [bar.c]),
      meta: {
        provider: 'yahoo_finance',
        interval: interval, // Return requested interval (4h)
        currency: result.meta.currency,
        exchangeName: result.meta.exchangeName,
        instrumentType: result.meta.instrumentType,
        dataGranularity: interval, // Use requested granularity
        aggregated: needsAggregation,
        aggregatedFrom: needsAggregation ? '1h' : undefined,
      }
    };

    if (includeOhlc) {
      priceFrame.bars = ohlcBars;
    }

    console.log(`Successfully fetched ${ohlcBars.length} data points for ${symbol} (${interval})`);

    return new Response(
      JSON.stringify(priceFrame),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch data from Yahoo Finance'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
