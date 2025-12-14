import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Top 20 most popular instruments to pre-cache
const POPULAR_INSTRUMENTS = [
  // Forex majors
  { symbol: 'EUR/USD', category: 'forex', yahooSymbol: 'EURUSD=X' },
  { symbol: 'GBP/USD', category: 'forex', yahooSymbol: 'GBPUSD=X' },
  { symbol: 'USD/JPY', category: 'forex', yahooSymbol: 'USDJPY=X' },
  { symbol: 'USD/CHF', category: 'forex', yahooSymbol: 'USDCHF=X' },
  { symbol: 'AUD/USD', category: 'forex', yahooSymbol: 'AUDUSD=X' },
  // Major stocks/ETFs
  { symbol: 'SPY', category: 'stocks', yahooSymbol: 'SPY' },
  { symbol: 'QQQ', category: 'stocks', yahooSymbol: 'QQQ' },
  { symbol: 'AAPL', category: 'stocks', yahooSymbol: 'AAPL' },
  { symbol: 'MSFT', category: 'stocks', yahooSymbol: 'MSFT' },
  { symbol: 'GOOGL', category: 'stocks', yahooSymbol: 'GOOGL' },
  { symbol: 'TSLA', category: 'stocks', yahooSymbol: 'TSLA' },
  { symbol: 'NVDA', category: 'stocks', yahooSymbol: 'NVDA' },
  // Crypto
  { symbol: 'BTC/USD', category: 'crypto', yahooSymbol: 'BTC-USD' },
  { symbol: 'ETH/USD', category: 'crypto', yahooSymbol: 'ETH-USD' },
  // Commodities
  { symbol: 'GC=F', category: 'commodities', yahooSymbol: 'GC=F' }, // Gold
  { symbol: 'CL=F', category: 'commodities', yahooSymbol: 'CL=F' }, // Oil
];

const TIMEFRAMES = ['1h', '1d'];

async function fetchAndCacheInstrument(
  supabase: any,
  instrument: typeof POPULAR_INSTRUMENTS[0],
  timeframe: string
): Promise<{ success: boolean; records: number; error?: string }> {
  try {
    const end = new Date();
    const start = new Date();
    
    // Fetch last 6 months for daily, 3 months for hourly
    if (timeframe === '1d') {
      start.setMonth(start.getMonth() - 6);
    } else {
      start.setMonth(start.getMonth() - 3);
    }

    const period1 = Math.floor(start.getTime() / 1000);
    const period2 = Math.floor(end.getTime() / 1000);
    const interval = timeframe === '1d' ? '1d' : '1h';

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${instrument.yahooSymbol}?period1=${period1}&period2=${period2}&interval=${interval}`;
    
    console.log(`Fetching ${instrument.symbol} ${timeframe}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Yahoo API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      throw new Error('No data returned from Yahoo Finance');
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators.quote[0];

    const records = timestamps
      .map((timestamp: number, index: number) => ({
        symbol: instrument.symbol,
        instrument_type: instrument.category,
        timeframe,
        date: new Date(timestamp * 1000).toISOString(),
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index]
      }))
      .filter((bar: any) => 
        bar.open !== null && bar.high !== null && bar.low !== null && bar.close !== null
      );

    if (records.length > 0) {
      const { error: insertError } = await supabase
        .from('historical_prices')
        .upsert(records, { onConflict: 'symbol,timeframe,date', ignoreDuplicates: true });

      if (insertError) {
        console.error(`Insert error for ${instrument.symbol}:`, insertError);
        return { success: false, records: 0, error: insertError.message };
      }

      console.log(`✅ Cached ${records.length} records for ${instrument.symbol} ${timeframe}`);
      return { success: true, records: records.length };
    }

    return { success: true, records: 0 };
  } catch (error) {
    console.error(`Error caching ${instrument.symbol}:`, error);
    return { success: false, records: 0, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🚀 Starting popular instruments cache job...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Array<{ instrument: string; timeframe: string; success: boolean; records: number }> = [];

    // Process instruments sequentially to avoid rate limiting
    for (const instrument of POPULAR_INSTRUMENTS) {
      for (const timeframe of TIMEFRAMES) {
        const result = await fetchAndCacheInstrument(supabase, instrument, timeframe);
        results.push({
          instrument: instrument.symbol,
          timeframe,
          success: result.success,
          records: result.records
        });
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Also clean up expired cache entries
    await supabase.rpc('cleanup_expired_backtest_cache');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const successCount = results.filter(r => r.success).length;
    const totalRecords = results.reduce((sum, r) => sum + r.records, 0);

    console.log(`✅ Cache job complete in ${duration}s: ${successCount}/${results.length} succeeded, ${totalRecords} records cached`);

    return new Response(JSON.stringify({
      success: true,
      duration: `${duration}s`,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
        recordsCached: totalRecords
      },
      details: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Cache job failed:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
