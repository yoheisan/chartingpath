import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendRequest {
  symbol: string;
  timeframes?: string[];
}

interface TimeframeTrend {
  timeframe: string;
  label: string;
  trend: 'up' | 'down' | 'flat';
  ema20: number;
  ema50: number;
  currentPrice: number;
  category: 'micro' | 'macro';
  dataPoints: number;
}

interface CachedResult {
  trends: TimeframeTrend[];
  summary: {
    upCount: number;
    downCount: number;
    flatCount: number;
    bias: 'bullish' | 'bearish' | 'mixed';
  };
  cachedAt: string;
  dataSource: 'database' | 'live';
}

// In-memory cache for results (5 min TTL)
const resultCache = new Map<string, { data: CachedResult; expiry: number }>();

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  return ema;
}

function determineTrend(currentPrice: number, ema20: number, ema50: number): 'up' | 'down' | 'flat' {
  const threshold = 0.001; // 0.1% threshold for "flat"
  const priceAboveEma20 = currentPrice > ema20 * (1 + threshold);
  const priceBelowEma20 = currentPrice < ema20 * (1 - threshold);
  const ema20AboveEma50 = ema20 > ema50 * (1 + threshold);
  const ema20BelowEma50 = ema20 < ema50 * (1 - threshold);
  
  if (priceAboveEma20 && ema20AboveEma50) return 'up';
  if (priceBelowEma20 && ema20BelowEma50) return 'down';
  return 'flat';
}

function getTimeframeLabel(tf: string): { label: string; category: 'micro' | 'macro' } {
  switch (tf) {
    case '15m': return { label: '15M', category: 'micro' };
    case '1h': return { label: '1H', category: 'micro' };
    case '4h': return { label: '4H', category: 'micro' };
    case '1d': return { label: 'D', category: 'macro' };
    case '1w': return { label: 'W', category: 'macro' };
    default: return { label: tf, category: 'macro' };
  }
}

// Normalize symbol for database lookup
function normalizeSymbol(symbol: string): string {
  // Handle forex pairs - ensure format is XXX/YYY
  if (symbol.includes('/')) {
    return symbol.toUpperCase();
  }
  // Handle Yahoo forex format (EURUSD=X -> EUR/USD)
  if (symbol.endsWith('=X')) {
    const base = symbol.replace('=X', '');
    if (base.length === 6) {
      return `${base.slice(0, 3)}/${base.slice(3)}`;
    }
  }
  // Handle concatenated forex (EURUSD -> EUR/USD)
  if (symbol.length === 6 && !symbol.includes('/')) {
    const upperSymbol = symbol.toUpperCase();
    const currencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD'];
    const first = upperSymbol.slice(0, 3);
    const second = upperSymbol.slice(3);
    if (currencies.includes(first) && currencies.includes(second)) {
      return `${first}/${second}`;
    }
  }
  return symbol.toUpperCase();
}

function getCacheKey(symbol: string, timeframes: string[]): string {
  return `${symbol}:${timeframes.sort().join(',')}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, timeframes = ['15m', '1h', '4h', '1d', '1w'] }: TrendRequest = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedSymbol = normalizeSymbol(symbol);
    const cacheKey = getCacheKey(normalizedSymbol, timeframes);
    
    // Check in-memory cache first
    const cached = resultCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      console.log(`Cache hit for ${normalizedSymbol}`);
      return new Response(JSON.stringify({
        success: true,
        symbol: normalizedSymbol,
        trends: cached.data.trends,
        summary: cached.data.summary,
        updatedAt: cached.data.cachedAt,
        dataSource: cached.data.dataSource,
        fromCache: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Analyzing MTF trend for ${normalizedSymbol} using database...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const trends: TimeframeTrend[] = [];

    // Fetch all timeframes in parallel from database
    const results = await Promise.all(
      timeframes.map(async (tf) => {
        try {
          const { data: priceData, error } = await supabase
            .from('historical_prices')
            .select('close, date')
            .eq('symbol', normalizedSymbol)
            .eq('timeframe', tf)
            .order('date', { ascending: true })
            .limit(100);

          if (error) {
            console.error(`DB error for ${tf}:`, error);
            return null;
          }

          if (!priceData || priceData.length < 20) {
            console.log(`Insufficient data for ${normalizedSymbol} ${tf}: ${priceData?.length || 0} bars`);
            return null;
          }

          const closes = priceData.map(p => p.close);
          const currentPrice = closes[closes.length - 1];
          const ema20 = calculateEMA(closes, 20);
          const ema50 = calculateEMA(closes, Math.min(50, closes.length));
          const trend = determineTrend(currentPrice, ema20, ema50);
          const { label, category } = getTimeframeLabel(tf);

          console.log(`${tf}: ${trend} (${closes.length} bars, price=${currentPrice.toFixed(5)})`);

          return {
            timeframe: tf,
            label,
            trend,
            ema20: Math.round(ema20 * 100000) / 100000,
            ema50: Math.round(ema50 * 100000) / 100000,
            currentPrice: Math.round(currentPrice * 100000) / 100000,
            category,
            dataPoints: closes.length
          } as TimeframeTrend;
        } catch (error) {
          console.error(`Error analyzing ${tf}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    for (const result of results) {
      if (result) trends.push(result);
    }

    if (trends.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No data available',
          message: `No cached data found for ${normalizedSymbol}. Please run the cache-popular-instruments function first or wait for the scheduled cache refresh.`,
          symbol: normalizedSymbol
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate summary
    const upCount = trends.filter(t => t.trend === 'up').length;
    const downCount = trends.filter(t => t.trend === 'down').length;
    const flatCount = trends.filter(t => t.trend === 'flat').length;
    
    let bias: 'bullish' | 'bearish' | 'mixed' = 'mixed';
    if (upCount > downCount && upCount > flatCount) bias = 'bullish';
    else if (downCount > upCount && downCount > flatCount) bias = 'bearish';

    const result: CachedResult = {
      trends,
      summary: { upCount, downCount, flatCount, bias },
      cachedAt: new Date().toISOString(),
      dataSource: 'database'
    };

    // Cache for 5 minutes
    resultCache.set(cacheKey, { data: result, expiry: Date.now() + 5 * 60 * 1000 });

    console.log(`✅ MTF analysis complete for ${normalizedSymbol}: ${bias} (${upCount} up, ${downCount} down, ${flatCount} flat)`);

    return new Response(JSON.stringify({
      success: true,
      symbol: normalizedSymbol,
      trends,
      summary: result.summary,
      updatedAt: result.cachedAt,
      dataSource: 'database',
      fromCache: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('MTF Analysis Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
