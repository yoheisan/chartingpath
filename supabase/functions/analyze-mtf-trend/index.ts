import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
}

interface CachedResult {
  trends: TimeframeTrend[];
  summary: {
    upCount: number;
    downCount: number;
    flatCount: number;
    bias: string;
  };
  cachedAt: string;
}

// In-memory cache with 5-minute TTL
const cache = new Map<string, { data: CachedResult; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Calculate EMA from price array
function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices.reduce((a, b) => a + b, 0) / prices.length;
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

// Determine trend based on price and EMAs
function determineTrend(currentPrice: number, ema20: number, ema50: number): 'up' | 'down' | 'flat' {
  const threshold = 0.002; // 0.2% threshold for flat
  
  const aboveBoth = currentPrice > ema20 && currentPrice > ema50;
  const belowBoth = currentPrice < ema20 && currentPrice < ema50;
  const ema20AboveEma50 = ema20 > ema50 * (1 + threshold);
  const ema20BelowEma50 = ema20 < ema50 * (1 - threshold);
  
  if (aboveBoth && ema20AboveEma50) return 'up';
  if (belowBoth && ema20BelowEma50) return 'down';
  return 'flat';
}

// Map timeframe to Yahoo Finance interval and lookback days (reduced for speed)
function getTimeframeConfig(tf: string): { interval: string; lookbackDays: number; label: string; category: 'micro' | 'macro' } {
  switch (tf) {
    case '5m': return { interval: '5m', lookbackDays: 2, label: '5M', category: 'micro' };
    case '15m': return { interval: '15m', lookbackDays: 5, label: '15M', category: 'micro' };
    case '1h': return { interval: '1h', lookbackDays: 14, label: '1H', category: 'micro' };
    case '4h': return { interval: '1h', lookbackDays: 60, label: '4H', category: 'micro' }; // Use 1h and aggregate
    case '8h': return { interval: '1h', lookbackDays: 100, label: '8H', category: 'micro' }; // Use 1h and aggregate
    case '1d': return { interval: '1d', lookbackDays: 60, label: 'D', category: 'macro' };
    case '1w': return { interval: '1wk', lookbackDays: 200, label: 'W', category: 'macro' };
    case '1M': return { interval: '1mo', lookbackDays: 800, label: 'M', category: 'macro' };
    default: return { interval: '1d', lookbackDays: 60, label: tf, category: 'macro' };
  }
}

// Fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function fetchPricesForTimeframe(symbol: string, tf: string): Promise<number[]> {
  const config = getTimeframeConfig(tf);
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - config.lookbackDays);
  
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  
  // Format symbol for Yahoo Finance
  let yahooSymbol = symbol.replace('/', '').replace('-', '');
  
  // Handle forex pairs
  if (symbol.includes('/')) {
    yahooSymbol = symbol.replace('/', '') + '=X';
  }
  
  // Handle crypto
  if (['BTC', 'ETH', 'ADA', 'SOL', 'LINK', 'DOT', 'UNI', 'AVAX'].some(c => symbol.startsWith(c + '/'))) {
    yahooSymbol = symbol.split('/')[0] + '-USD';
  }
  
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=${config.interval}&events=history`;
  
  // 5 second timeout per request
  const response = await fetchWithTimeout(yahooUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }, 5000);
  
  if (!response.ok) {
    console.error(`Failed to fetch ${tf} data: ${response.statusText}`);
    return [];
  }
  
  const data = await response.json();
  
  if (!data.chart?.result?.[0]?.indicators?.quote?.[0]?.close) {
    console.error(`No data for ${tf}`);
    return [];
  }
  
  const closes = data.chart.result[0].indicators.quote[0].close.filter((p: number | null) => p !== null) as number[];
  
  // Aggregate for 4h and 8h timeframes
  if (tf === '4h') {
    return aggregatePrices(closes, 4);
  } else if (tf === '8h') {
    return aggregatePrices(closes, 8);
  }
  
  return closes;
}

function aggregatePrices(prices: number[], periodBars: number): number[] {
  const aggregated: number[] = [];
  for (let i = periodBars - 1; i < prices.length; i += periodBars) {
    aggregated.push(prices[i]);
  }
  return aggregated;
}

function getCacheKey(symbol: string, timeframes: string[]): string {
  return `${symbol.toUpperCase()}_${timeframes.sort().join(',')}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, timeframes = ['5m', '15m', '1h', '4h', '8h', '1d', '1w', '1M'] }: TrendRequest = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ success: false, error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(symbol, timeframes);
    const cached = cache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`Cache hit for ${symbol}`);
      return new Response(
        JSON.stringify({
          success: true,
          symbol,
          trends: cached.data.trends,
          summary: cached.data.summary,
          updatedAt: cached.data.cachedAt,
          fromCache: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing MTF trend for ${symbol} across ${timeframes.length} timeframes`);

    const trends: TimeframeTrend[] = [];

    // Process ALL timeframes in parallel for maximum speed
    const batchResults = await Promise.all(
      timeframes.map(async (tf) => {
        try {
          const config = getTimeframeConfig(tf);
          const prices = await fetchPricesForTimeframe(symbol, tf);
          
          if (prices.length < 20) {
            console.log(`Insufficient data for ${tf}: ${prices.length} bars`);
            return {
              timeframe: tf,
              label: config.label,
              trend: 'flat' as const,
              ema20: 0,
              ema50: 0,
              currentPrice: prices[prices.length - 1] || 0,
              category: config.category
            };
          }

          const currentPrice = prices[prices.length - 1];
          const ema20 = calculateEMA(prices, 20);
          const ema50 = calculateEMA(prices, Math.min(50, prices.length));
          const trend = determineTrend(currentPrice, ema20, ema50);

          console.log(`${tf}: Price=${currentPrice.toFixed(4)}, EMA20=${ema20.toFixed(4)}, EMA50=${ema50.toFixed(4)}, Trend=${trend}`);

          return {
            timeframe: tf,
            label: config.label,
            trend,
            ema20,
            ema50,
            currentPrice,
            category: config.category
          };
        } catch (err) {
          console.error(`Error processing ${tf}:`, err);
          const config = getTimeframeConfig(tf);
          return {
            timeframe: tf,
            label: config.label,
            trend: 'flat' as const,
            ema20: 0,
            ema50: 0,
            currentPrice: 0,
            category: config.category
          };
        }
      })
    );
    trends.push(...batchResults);

    // Calculate overall bias
    const upCount = trends.filter(t => t.trend === 'up').length;
    const downCount = trends.filter(t => t.trend === 'down').length;
    const total = trends.length;
    
    let bias: 'bullish' | 'bearish' | 'mixed' = 'mixed';
    if (upCount > total * 0.5) bias = 'bullish';
    else if (downCount > total * 0.5) bias = 'bearish';

    const summary = {
      upCount,
      downCount,
      flatCount: total - upCount - downCount,
      bias
    };

    // Cache the result
    const cachedAt = new Date().toISOString();
    cache.set(cacheKey, {
      data: { trends, summary, cachedAt },
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    console.log(`Analysis complete: ${upCount} up, ${downCount} down, bias=${bias} (cached for 5 min)`);

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        trends,
        summary,
        updatedAt: cachedAt,
        fromCache: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('MTF Analysis error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Analysis failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});