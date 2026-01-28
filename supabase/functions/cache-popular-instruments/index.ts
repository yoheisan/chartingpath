import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  ALL_INSTRUMENTS, 
  AssetCategory,
  type Instrument 
} from '../_shared/screenerInstruments.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Timeframe config - 5 years of daily data for comprehensive backtesting
const LOOKBACK_DAYS = 1825; // 5 years of daily data (as available per asset)

interface CacheResult {
  success: boolean;
  records: number;
  error?: string;
}

async function fetchAndCacheInstrument(
  supabase: any,
  instrument: Instrument,
  category: string
): Promise<CacheResult> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - LOOKBACK_DAYS);

    const period1 = Math.floor(start.getTime() / 1000);
    const period2 = Math.floor(end.getTime() / 1000);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${instrument.yahooSymbol}?period1=${period1}&period2=${period2}&interval=1d`;
    
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

    const records = timestamps
      .map((timestamp: number, index: number) => ({
        symbol: instrument.symbol,
        instrument_type: category,
        timeframe: '1d',
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

    if (records.length > 0) {
      // Delete old records for this symbol first
      await supabase
        .from('historical_prices')
        .delete()
        .eq('symbol', instrument.symbol)
        .eq('timeframe', '1d');

      // Insert in chunks to avoid payload size limits (5 years = ~1300 records per symbol)
      const CHUNK_SIZE = 500;
      for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const { error: insertError } = await supabase
          .from('historical_prices')
          .insert(chunk);

        if (insertError) {
          console.error(`Insert error for ${instrument.symbol} chunk ${i}:`, insertError);
          return { success: false, records: 0, error: insertError.message };
        }
      }

      return { success: true, records: records.length };
    }

    return { success: true, records: 0 };
  } catch (error) {
    console.error(`Error caching ${instrument.symbol}:`, error);
    return { success: false, records: 0, error: error.message };
  }
}

async function processCategoryBatch(
  supabase: any,
  category: AssetCategory,
  instruments: Instrument[],
  delayMs: number = 150
): Promise<{ category: string; succeeded: number; failed: number; records: number }> {
  let succeeded = 0;
  let failed = 0;
  let totalRecords = 0;

  for (const instrument of instruments) {
    const result = await fetchAndCacheInstrument(supabase, instrument, category);
    if (result.success) {
      succeeded++;
      totalRecords += result.records;
    } else {
      failed++;
    }
    // Rate limit delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return { category, succeeded, failed, records: totalRecords };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🚀 Starting comprehensive instrument cache job...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for category filter
    let categoriesToCache: AssetCategory[] = ['fx', 'crypto', 'stocks', 'commodities', 'indices', 'etfs'];
    
    try {
      const body = await req.json();
      if (body.categories?.length) {
        categoriesToCache = body.categories;
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Calculate total instruments
    const totalInstruments = categoriesToCache.reduce(
      (sum, cat) => sum + (ALL_INSTRUMENTS[cat]?.length || 0), 
      0
    );
    
    console.log(`📊 Caching ${totalInstruments} instruments across ${categoriesToCache.length} categories...`);

    const results: Array<{ 
      category: string; 
      succeeded: number; 
      failed: number; 
      records: number 
    }> = [];

    // Process each category sequentially to avoid overwhelming Yahoo Finance
    for (const category of categoriesToCache) {
      const instruments = ALL_INSTRUMENTS[category] || [];
      console.log(`\n📈 Processing ${category}: ${instruments.length} instruments...`);
      
      const categoryResult = await processCategoryBatch(supabase, category, instruments);
      results.push(categoryResult);
      
      console.log(`✓ ${category}: ${categoryResult.succeeded}/${instruments.length} succeeded, ${categoryResult.records} records`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalSucceeded = results.reduce((sum, r) => sum + r.succeeded, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const totalRecords = results.reduce((sum, r) => sum + r.records, 0);

    console.log(`\n✅ Cache job complete in ${duration}s`);
    console.log(`📊 Summary: ${totalSucceeded}/${totalInstruments} instruments, ${totalRecords} total records`);

    return new Response(JSON.stringify({
      success: true,
      duration: `${duration}s`,
      summary: {
        totalInstruments,
        succeeded: totalSucceeded,
        failed: totalFailed,
        recordsCached: totalRecords
      },
      byCategory: results
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
