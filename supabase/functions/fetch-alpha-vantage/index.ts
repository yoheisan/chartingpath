import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlphaVantageRequest {
  symbol: string;
  startDate?: string;
  endDate?: string;
  outputSize?: 'compact' | 'full'; // compact = 100 data points, full = 20+ years
}

interface OHLCBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!ALPHA_VANTAGE_API_KEY) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }

    const {
      symbol,
      startDate,
      endDate,
      outputSize = 'full',
    }: AlphaVantageRequest = await req.json();

    console.log(`Fetching Alpha Vantage data for ${symbol} (${outputSize})`);

    // Use TIME_SERIES_DAILY_ADJUSTED for accurate data including splits/dividends
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&outputsize=${outputSize}&apikey=${ALPHA_VANTAGE_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API errors
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
    }

    if (data['Note']) {
      // Rate limit hit
      console.warn('Alpha Vantage rate limit:', data['Note']);
      throw new Error('Alpha Vantage rate limit reached. Please try again in a minute.');
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('No time series data returned from Alpha Vantage');
    }

    // Convert to OHLC bars
    const allBars: OHLCBar[] = Object.entries(timeSeries)
      .map(([date, values]: [string, any]) => ({
        t: date,
        o: parseFloat(values['1. open']),
        h: parseFloat(values['2. high']),
        l: parseFloat(values['3. low']),
        c: parseFloat(values['5. adjusted close']), // Use adjusted close for accuracy
        v: parseInt(values['6. volume'], 10),
      }))
      .filter(bar => !isNaN(bar.o) && !isNaN(bar.h) && !isNaN(bar.l) && !isNaN(bar.c))
      .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime()); // Sort ascending

    // Filter by date range if provided
    let filteredBars = allBars;
    if (startDate || endDate) {
      const startTs = startDate ? new Date(startDate).getTime() : 0;
      const endTs = endDate ? new Date(endDate).getTime() : Infinity;
      
      filteredBars = allBars.filter(bar => {
        const barTs = new Date(bar.t).getTime();
        return barTs >= startTs && barTs <= endTs;
      });
    }

    console.log(`Successfully fetched ${filteredBars.length} data points for ${symbol} from Alpha Vantage`);

    // Return in compatible format
    const priceFrame = {
      index: filteredBars.map(bar => bar.t),
      columns: [symbol],
      data: filteredBars.map(bar => [bar.c]),
      bars: filteredBars,
      meta: {
        provider: 'alpha_vantage',
        symbol,
        currency: data['Meta Data']?.['4. Currency'] || 'USD',
        timezone: data['Meta Data']?.['5. Time Zone'] || 'US/Eastern',
      }
    };

    return new Response(
      JSON.stringify(priceFrame),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error fetching Alpha Vantage data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to fetch data from Alpha Vantage'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
