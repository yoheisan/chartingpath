import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YahooFinanceRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  interval?: string; // 1d, 1wk, 1mo, 1h, etc.
  includeOhlc?: boolean;
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
    
    console.log(`Fetching Yahoo Finance data for ${symbol} from ${startDate} to ${endDate} with interval ${interval}`);

    // Convert dates to Unix timestamps
    const period1 = Math.floor(new Date(startDate).getTime() / 1000);
    const period2 = Math.floor(new Date(endDate).getTime() / 1000);

    // Yahoo Finance query URL
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}&events=history`;

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

    // Optional: OHLC bars for candlestick rendering
    const ohlcBars = includeOhlc
      ? timestamps
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
          .filter(Boolean)
      : null;
    
    // Format data into PriceFrame format
    const priceFrame: Record<string, unknown> = {
      index: timestamps.map((ts: number) => new Date(ts * 1000).toISOString().split('T')[0]),
      columns: [symbol],
      data: timestamps.map((ts: number, idx: number) => [
        quotes.close[idx] || quotes.open[idx] || 0
      ]),
      meta: {
        provider: 'yahoo_finance',
        interval: interval,
        currency: result.meta.currency,
        exchangeName: result.meta.exchangeName,
        instrumentType: result.meta.instrumentType,
        dataGranularity: result.meta.dataGranularity
      }
    };

    if (includeOhlc) {
      priceFrame.bars = ohlcBars || [];
    }

    console.log(`Successfully fetched ${priceFrame.index.length} data points for ${symbol}`);

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
