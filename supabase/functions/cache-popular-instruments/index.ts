import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Popular instruments to pre-cache for MTF analysis and backtesting
const POPULAR_INSTRUMENTS = [
  // Forex majors
  { symbol: 'EUR/USD', category: 'forex', yahooSymbol: 'EURUSD=X' },
  { symbol: 'GBP/USD', category: 'forex', yahooSymbol: 'GBPUSD=X' },
  { symbol: 'USD/JPY', category: 'forex', yahooSymbol: 'USDJPY=X' },
  { symbol: 'USD/CHF', category: 'forex', yahooSymbol: 'USDCHF=X' },
  { symbol: 'AUD/USD', category: 'forex', yahooSymbol: 'AUDUSD=X' },
  { symbol: 'USD/CAD', category: 'forex', yahooSymbol: 'USDCAD=X' },
  { symbol: 'NZD/USD', category: 'forex', yahooSymbol: 'NZDUSD=X' },
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

// Timeframes for MTF analysis - mapped to Yahoo intervals
const TIMEFRAME_CONFIGS = [
  { timeframe: '15m', interval: '15m', lookbackDays: 5 },
  { timeframe: '1h', interval: '1h', lookbackDays: 30 },
  { timeframe: '4h', interval: '1h', lookbackDays: 60, aggregateBars: 4 }, // Aggregate 4x 1h bars
  { timeframe: '1d', interval: '1d', lookbackDays: 180 },
  { timeframe: '1w', interval: '1wk', lookbackDays: 365 },
];

function aggregateToTimeframe(records: any[], aggregateBars: number): any[] {
  const aggregated: any[] = [];
  for (let i = 0; i < records.length; i += aggregateBars) {
    const chunk = records.slice(i, i + aggregateBars);
    if (chunk.length === aggregateBars) {
      aggregated.push({
        ...chunk[0],
        high: Math.max(...chunk.map(c => c.high)),
        low: Math.min(...chunk.map(c => c.low)),
        close: chunk[chunk.length - 1].close,
        volume: chunk.reduce((sum, c) => sum + (c.volume || 0), 0),
      });
    }
  }
  return aggregated;
}

async function fetchAndCacheInstrument(
  supabase: any,
  instrument: typeof POPULAR_INSTRUMENTS[0],
  tfConfig: typeof TIMEFRAME_CONFIGS[0]
): Promise<{ success: boolean; records: number; error?: string }> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - tfConfig.lookbackDays);

    const period1 = Math.floor(start.getTime() / 1000);
    const period2 = Math.floor(end.getTime() / 1000);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${instrument.yahooSymbol}?period1=${period1}&period2=${period2}&interval=${tfConfig.interval}`;
    
    console.log(`Fetching ${instrument.symbol} ${tfConfig.timeframe}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
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

    let records = timestamps
      .map((timestamp: number, index: number) => ({
        symbol: instrument.symbol,
        instrument_type: instrument.category,
        timeframe: tfConfig.timeframe,
        date: new Date(timestamp * 1000).toISOString(),
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index] || 0
      }))
      .filter((bar: any) => 
        bar.open !== null && bar.high !== null && bar.low !== null && bar.close !== null
      );

    // Aggregate if needed (e.g., 4h from 1h data)
    if (tfConfig.aggregateBars) {
      records = aggregateToTimeframe(records, tfConfig.aggregateBars);
    }

    if (records.length > 0) {
      // Delete old records for this symbol/timeframe first to avoid duplicates
      await supabase
        .from('historical_prices')
        .delete()
        .eq('symbol', instrument.symbol)
        .eq('timeframe', tfConfig.timeframe);

      // Insert fresh data
      const { error: insertError } = await supabase
        .from('historical_prices')
        .insert(records);

      if (insertError) {
        console.error(`Insert error for ${instrument.symbol}:`, insertError);
        return { success: false, records: 0, error: insertError.message };
      }

      console.log(`✅ Cached ${records.length} records for ${instrument.symbol} ${tfConfig.timeframe}`);
      return { success: true, records: records.length };
    }

    return { success: true, records: 0 };
  } catch (error) {
    console.error(`Error caching ${instrument.symbol} ${tfConfig.timeframe}:`, error);
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

    // Check if specific instruments were requested
    let instrumentsToCache = POPULAR_INSTRUMENTS;
    let timeframesToCache = TIMEFRAME_CONFIGS;
    
    try {
      const body = await req.json();
      if (body.symbols?.length) {
        instrumentsToCache = POPULAR_INSTRUMENTS.filter(i => 
          body.symbols.includes(i.symbol)
        );
      }
      if (body.timeframes?.length) {
        timeframesToCache = TIMEFRAME_CONFIGS.filter(t => 
          body.timeframes.includes(t.timeframe)
        );
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    const results: Array<{ instrument: string; timeframe: string; success: boolean; records: number; error?: string }> = [];

    // Process instruments sequentially to avoid rate limiting
    for (const instrument of instrumentsToCache) {
      for (const tfConfig of timeframesToCache) {
        const result = await fetchAndCacheInstrument(supabase, instrument, tfConfig);
        results.push({
          instrument: instrument.symbol,
          timeframe: tfConfig.timeframe,
          success: result.success,
          records: result.records,
          error: result.error
        });
        
        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

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
