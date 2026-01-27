import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// ALL SCREENER INSTRUMENTS - Must match scan-live-patterns BASE_INSTRUMENTS
// These are pre-cached daily for instant screener loading
// =============================================================================

const SCREENER_INSTRUMENTS = {
  fx: [
    { symbol: 'EUR/USD', yahooSymbol: 'EURUSD=X' },
    { symbol: 'GBP/USD', yahooSymbol: 'GBPUSD=X' },
    { symbol: 'USD/JPY', yahooSymbol: 'USDJPY=X' },
    { symbol: 'AUD/USD', yahooSymbol: 'AUDUSD=X' },
    { symbol: 'USD/CAD', yahooSymbol: 'USDCAD=X' },
    { symbol: 'NZD/USD', yahooSymbol: 'NZDUSD=X' },
    { symbol: 'USD/CHF', yahooSymbol: 'USDCHF=X' },
    { symbol: 'EUR/GBP', yahooSymbol: 'EURGBP=X' },
    { symbol: 'EUR/JPY', yahooSymbol: 'EURJPY=X' },
    { symbol: 'GBP/JPY', yahooSymbol: 'GBPJPY=X' },
    { symbol: 'AUD/JPY', yahooSymbol: 'AUDJPY=X' },
    { symbol: 'EUR/AUD', yahooSymbol: 'EURAUD=X' },
    { symbol: 'EUR/CHF', yahooSymbol: 'EURCHF=X' },
    { symbol: 'AUD/NZD', yahooSymbol: 'AUDNZD=X' },
    { symbol: 'CAD/JPY', yahooSymbol: 'CADJPY=X' },
    { symbol: 'NZD/JPY', yahooSymbol: 'NZDJPY=X' },
    { symbol: 'GBP/AUD', yahooSymbol: 'GBPAUD=X' },
    { symbol: 'GBP/CAD', yahooSymbol: 'GBPCAD=X' },
    { symbol: 'AUD/CAD', yahooSymbol: 'AUDCAD=X' },
    { symbol: 'EUR/CAD', yahooSymbol: 'EURCAD=X' },
    { symbol: 'CHF/JPY', yahooSymbol: 'CHFJPY=X' },
    { symbol: 'GBP/CHF', yahooSymbol: 'GBPCHF=X' },
    { symbol: 'EUR/NZD', yahooSymbol: 'EURNZD=X' },
    { symbol: 'CAD/CHF', yahooSymbol: 'CADCHF=X' },
    { symbol: 'AUD/CHF', yahooSymbol: 'AUDCHF=X' },
  ],
  crypto: [
    { symbol: 'BTC/USD', yahooSymbol: 'BTC-USD' },
    { symbol: 'ETH/USD', yahooSymbol: 'ETH-USD' },
    { symbol: 'SOL/USD', yahooSymbol: 'SOL-USD' },
    { symbol: 'BNB/USD', yahooSymbol: 'BNB-USD' },
    { symbol: 'XRP/USD', yahooSymbol: 'XRP-USD' },
    { symbol: 'ADA/USD', yahooSymbol: 'ADA-USD' },
    { symbol: 'AVAX/USD', yahooSymbol: 'AVAX-USD' },
    { symbol: 'DOGE/USD', yahooSymbol: 'DOGE-USD' },
    { symbol: 'LINK/USD', yahooSymbol: 'LINK-USD' },
    { symbol: 'MATIC/USD', yahooSymbol: 'MATIC-USD' },
    { symbol: 'DOT/USD', yahooSymbol: 'DOT-USD' },
    { symbol: 'SHIB/USD', yahooSymbol: 'SHIB-USD' },
    { symbol: 'LTC/USD', yahooSymbol: 'LTC-USD' },
    { symbol: 'UNI/USD', yahooSymbol: 'UNI-USD' },
    { symbol: 'ATOM/USD', yahooSymbol: 'ATOM-USD' },
    { symbol: 'XLM/USD', yahooSymbol: 'XLM-USD' },
    { symbol: 'NEAR/USD', yahooSymbol: 'NEAR-USD' },
    { symbol: 'APT/USD', yahooSymbol: 'APT-USD' },
    { symbol: 'ARB/USD', yahooSymbol: 'ARB-USD' },
    { symbol: 'OP/USD', yahooSymbol: 'OP-USD' },
    { symbol: 'FIL/USD', yahooSymbol: 'FIL-USD' },
    { symbol: 'INJ/USD', yahooSymbol: 'INJ-USD' },
    { symbol: 'AAVE/USD', yahooSymbol: 'AAVE-USD' },
    { symbol: 'MKR/USD', yahooSymbol: 'MKR-USD' },
    { symbol: 'SAND/USD', yahooSymbol: 'SAND-USD' },
  ],
  stocks: [
    { symbol: 'AAPL', yahooSymbol: 'AAPL' },
    { symbol: 'MSFT', yahooSymbol: 'MSFT' },
    { symbol: 'GOOGL', yahooSymbol: 'GOOGL' },
    { symbol: 'AMZN', yahooSymbol: 'AMZN' },
    { symbol: 'META', yahooSymbol: 'META' },
    { symbol: 'TSLA', yahooSymbol: 'TSLA' },
    { symbol: 'NVDA', yahooSymbol: 'NVDA' },
    { symbol: 'JPM', yahooSymbol: 'JPM' },
    { symbol: 'V', yahooSymbol: 'V' },
    { symbol: 'JNJ', yahooSymbol: 'JNJ' },
    { symbol: 'WMT', yahooSymbol: 'WMT' },
    { symbol: 'PG', yahooSymbol: 'PG' },
    { symbol: 'UNH', yahooSymbol: 'UNH' },
    { symbol: 'HD', yahooSymbol: 'HD' },
    { symbol: 'BAC', yahooSymbol: 'BAC' },
    { symbol: 'MA', yahooSymbol: 'MA' },
    { symbol: 'DIS', yahooSymbol: 'DIS' },
    { symbol: 'NFLX', yahooSymbol: 'NFLX' },
    { symbol: 'ADBE', yahooSymbol: 'ADBE' },
    { symbol: 'CRM', yahooSymbol: 'CRM' },
    { symbol: 'PFE', yahooSymbol: 'PFE' },
    { symbol: 'KO', yahooSymbol: 'KO' },
    { symbol: 'PEP', yahooSymbol: 'PEP' },
    { symbol: 'MRK', yahooSymbol: 'MRK' },
    { symbol: 'CSCO', yahooSymbol: 'CSCO' },
  ],
  commodities: [
    { symbol: 'GC=F', yahooSymbol: 'GC=F' },  // Gold
    { symbol: 'SI=F', yahooSymbol: 'SI=F' },  // Silver
    { symbol: 'CL=F', yahooSymbol: 'CL=F' },  // Crude Oil
    { symbol: 'NG=F', yahooSymbol: 'NG=F' },  // Natural Gas
    { symbol: 'HG=F', yahooSymbol: 'HG=F' },  // Copper
    { symbol: 'PL=F', yahooSymbol: 'PL=F' },  // Platinum
    { symbol: 'PA=F', yahooSymbol: 'PA=F' },  // Palladium
    { symbol: 'ZC=F', yahooSymbol: 'ZC=F' },  // Corn
    { symbol: 'ZW=F', yahooSymbol: 'ZW=F' },  // Wheat
    { symbol: 'ZS=F', yahooSymbol: 'ZS=F' },  // Soybeans
    { symbol: 'KC=F', yahooSymbol: 'KC=F' },  // Coffee
    { symbol: 'SB=F', yahooSymbol: 'SB=F' },  // Sugar
    { symbol: 'CC=F', yahooSymbol: 'CC=F' },  // Cocoa
    { symbol: 'CT=F', yahooSymbol: 'CT=F' },  // Cotton
    { symbol: 'LE=F', yahooSymbol: 'LE=F' },  // Live Cattle
    { symbol: 'HE=F', yahooSymbol: 'HE=F' },  // Lean Hogs
    { symbol: 'GF=F', yahooSymbol: 'GF=F' },  // Feeder Cattle
    { symbol: 'ZO=F', yahooSymbol: 'ZO=F' },  // Oats
    { symbol: 'ZR=F', yahooSymbol: 'ZR=F' },  // Rice
    { symbol: 'ZL=F', yahooSymbol: 'ZL=F' },  // Soybean Oil
    { symbol: 'RB=F', yahooSymbol: 'RB=F' },  // Gasoline
    { symbol: 'HO=F', yahooSymbol: 'HO=F' },  // Heating Oil
    { symbol: 'BZ=F', yahooSymbol: 'BZ=F' },  // Brent Crude
    { symbol: 'ALI=F', yahooSymbol: 'ALI=F' }, // Aluminum
    { symbol: 'ZN=F', yahooSymbol: 'ZN=F' },  // 10-Year T-Note
  ],
};

// Timeframe config - primarily daily for screener
const TIMEFRAME_CONFIGS = [
  { timeframe: '1d', interval: '1d', lookbackDays: 120 }, // 4 months of daily data for patterns
];

interface CacheResult {
  success: boolean;
  records: number;
  error?: string;
}

async function fetchAndCacheInstrument(
  supabase: any,
  instrument: { symbol: string; yahooSymbol: string },
  category: string,
  tfConfig: typeof TIMEFRAME_CONFIGS[0]
): Promise<CacheResult> {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - tfConfig.lookbackDays);

    const period1 = Math.floor(start.getTime() / 1000);
    const period2 = Math.floor(end.getTime() / 1000);

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${instrument.yahooSymbol}?period1=${period1}&period2=${period2}&interval=${tfConfig.interval}`;
    
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

    if (records.length > 0) {
      // Delete old records for this symbol/timeframe first
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
  console.log('🚀 Starting screener instruments cache job...');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if specific category was requested
    let categoriesToCache = ['fx', 'crypto', 'stocks', 'commodities'];
    
    try {
      const body = await req.json();
      if (body.categories?.length) {
        categoriesToCache = body.categories;
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    const results: Array<{ 
      instrument: string; 
      category: string;
      timeframe: string; 
      success: boolean; 
      records: number; 
      error?: string 
    }> = [];

    // Process all instruments sequentially to avoid rate limiting
    for (const category of categoriesToCache) {
      const instruments = SCREENER_INSTRUMENTS[category as keyof typeof SCREENER_INSTRUMENTS] || [];
      console.log(`📊 Caching ${instruments.length} ${category} instruments...`);
      
      for (const instrument of instruments) {
        for (const tfConfig of TIMEFRAME_CONFIGS) {
          const result = await fetchAndCacheInstrument(supabase, instrument, category, tfConfig);
          results.push({
            instrument: instrument.symbol,
            category,
            timeframe: tfConfig.timeframe,
            success: result.success,
            records: result.records,
            error: result.error
          });
          
          // Delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
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
