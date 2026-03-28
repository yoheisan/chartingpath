import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PATTERN_REGISTRY, calculateATR, BASE_PATTERNS } from "../_shared/patternDetectors.ts";
import { resolveToYahooSymbol, getSymbolVariants } from "../_shared/symbolResolver.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetectionRequest {
  symbol: string;
  timeframe: '1h' | '4h' | '1d' | '1wk';
  lookbackDays?: number;
}

interface CompressedBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface DetectedPattern {
  id: string;
  pattern_id: string;
  pattern_name: string;
  direction: 'bullish' | 'bearish';
  detected_at: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  quality_score: string;
  quality_reasons: string[];
  bars: CompressedBar[];
  visual_spec: {
    entryLine: { price: number };
    stopLossLine: { price: number };
    takeProfitLine: { price: number };
    pivots: Array<{ index: number; price: number; type: string; label: string }>;
  };
  outcome: string | null;
  outcome_pnl_percent: number | null;
}

// Fetch data from Yahoo Finance with symbol resolution
async function fetchYahooData(symbol: string, timeframe: string, lookbackDays: number): Promise<CompressedBar[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  // Yahoo interval mapping
  const intervalMap: Record<string, string> = {
    '1h': '1h',
    '4h': '1h', // We'll aggregate 1h to 4h
    '1d': '1d',
    '1wk': '1wk',
  };

  const yahooInterval = intervalMap[timeframe] || '1d';
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);

  // Try multiple symbol variants
  const symbolVariants = getSymbolVariants(symbol);
  
  for (const variant of symbolVariants) {
    const encodedSymbol = encodeURIComponent(variant);
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?period1=${period1}&period2=${period2}&interval=${yahooInterval}&events=history`;

    console.log(`Trying Yahoo data: ${yahooUrl}`);

    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.log(`Failed with ${variant}: ${response.status}`);
      continue;
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      console.log(`No data from Yahoo for ${variant}`);
      continue;
    }

    console.log(`Success with symbol variant: ${variant}`);
    
    const result = data.chart.result[0];
    const timestamps: number[] = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];

    if (!timestamps.length || !quotes) {
      continue;
    }

    const bars: CompressedBar[] = timestamps
      .map((ts: number, idx: number) => {
        const o = quotes.open?.[idx];
        const h = quotes.high?.[idx];
        const l = quotes.low?.[idx];
        const c = quotes.close?.[idx];
        const v = quotes.volume?.[idx] ?? 0;

        if (!Number.isFinite(o) || !Number.isFinite(h) || !Number.isFinite(l) || !Number.isFinite(c)) {
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
      .filter((b): b is CompressedBar => b !== null);

    // Aggregate to 4H or 8H if needed
    if (timeframe === '4h' && bars.length > 0) {
      return aggregateHourlyBars(bars, 4);
    }
    if (timeframe === '8h' && bars.length > 0) {
      return aggregateHourlyBars(bars, 8);
    }

    return bars;
  }

  // All variants failed
}

// Aggregate 1H bars to 4H or 8H (UTC-anchored, skip partial bars)
// 4H boundaries: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
// 8H boundaries: 00:00, 08:00, 16:00 UTC
//
// OHLCV rules: O=first open, H=max highs, L=min lows, C=last close, V=sum
// Partial bars at period end are skipped entirely.
//
// Expected aggregation test case (4H):
//   Input 1H bars:
//     Bar1: O=1.0800 H=1.0850 L=1.0780 C=1.0820 V=1000
//     Bar2: O=1.0820 H=1.0900 L=1.0810 C=1.0880 V=1200
//     Bar3: O=1.0880 H=1.0920 L=1.0860 C=1.0870 V=800
//     Bar4: O=1.0870 H=1.0890 L=1.0830 C=1.0840 V=1100
//   Expected 4H bar:
//     O=1.0800, H=1.0920, L=1.0780, C=1.0840, V=4100
function aggregateHourlyBars(hourlyBars: CompressedBar[], period: 4 | 8): CompressedBar[] {
  const grouped = new Map<string, CompressedBar[]>();
  
  for (const bar of hourlyBars) {
    const d = new Date(bar.t);
    const periodStart = Math.floor(d.getUTCHours() / period) * period;
    const boundary = new Date(d);
    boundary.setUTCHours(periodStart, 0, 0, 0);
    const key = boundary.toISOString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(bar);
  }
  
  const aggregated: CompressedBar[] = [];
  for (const [key, wBars] of grouped) {
    if (wBars.length < period) continue; // skip partial bars
    wBars.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
    aggregated.push({
      t: key,
      o: wBars[0].o,
      h: Math.max(...wBars.map(b => b.h)),
      l: Math.min(...wBars.map(b => b.l)),
      c: wBars[wBars.length - 1].c,
      v: wBars.reduce((sum, b) => sum + b.v, 0),
    });
  }
  
  aggregated.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  return aggregated;
}

// Run pattern detection with sliding window and track historical outcomes
function detectPatternsWithHistory(bars: CompressedBar[], timeframe: string): DetectedPattern[] {
  const detected: DetectedPattern[] = [];
  const windowSize = 25; // Slightly smaller window for hourly data
  
  // Minimum bars needed for pattern formation + outcome tracking
  if (bars.length < windowSize + 10) {
    console.log(`Not enough bars for detection: ${bars.length}`);
    return [];
  }

  console.log(`Starting detection with ${bars.length} bars, window size ${windowSize}`);
  
  const detectedWindows = new Set<string>(); // Prevent duplicate detections
  
  // Convert CompressedBar format to detector-expected format
  const normalizedBars = bars.map(b => ({
    open: b.o,
    high: b.h,
    low: b.l,
    close: b.c,
    volume: b.v,
    date: b.t,
  }));

  // Slide window through historical data
  for (let endIdx = windowSize; endIdx < normalizedBars.length - 5; endIdx += 3) { // Skip by 3 to find more patterns
    const window = normalizedBars.slice(endIdx - windowSize, endIdx);
    const futureBars = normalizedBars.slice(endIdx, Math.min(endIdx + 50, normalizedBars.length));
    
    // Check each pattern
    for (const patternId of BASE_PATTERNS) {
      const config = PATTERN_REGISTRY[patternId];
      if (!config) continue;

      // Skip if we already detected this pattern in nearby window
      const windowKey = `${patternId}-${Math.floor(endIdx / 10)}`;
      if (detectedWindows.has(windowKey)) continue;

      try {
        const result = config.detector(window);
        
        if (result.detected) {
          detectedWindows.add(windowKey);
          
          // Calculate ATR-based levels
          const atr = calculateATR(window);
          const entryBar = window[window.length - 1];
          const entryPrice = entryBar.close;
          
          // Ensure valid ATR
          if (atr <= 0 || !Number.isFinite(atr)) {
            console.log(`Invalid ATR for ${patternId} at ${endIdx}`);
            continue;
          }
          
          const isLong = config.direction === 'long';
          const stopLoss = isLong ? entryPrice - atr * 2 : entryPrice + atr * 2;
          const takeProfit = isLong ? entryPrice + atr * 4 : entryPrice - atr * 4;
          
          // Track outcome using future bars
          const outcome = trackOutcome(futureBars, entryPrice, stopLoss, takeProfit, isLong);
          
          // Calculate quality score
          const qualityReasons: string[] = [];
          if (atr > 0) qualityReasons.push('Valid ATR');
          if (result.pivots.length >= 2) qualityReasons.push('Clear pivots');
          
          const qualityScore = qualityReasons.length >= 2 ? 'A' : qualityReasons.length === 1 ? 'B' : 'C';
          
          console.log(`Detected ${patternId} at index ${endIdx}, outcome: ${outcome.result}`);
          
          // Convert window back to CompressedBar format for output
          const compressedWindow = window.map(b => ({
            t: b.date,
            o: b.open,
            h: b.high,
            l: b.low,
            c: b.close,
            v: b.volume,
          }));
          
          detected.push({
            id: `${patternId}-${endIdx}-${Date.now()}`,
            pattern_id: patternId,
            pattern_name: config.displayName,
            direction: isLong ? 'bullish' : 'bearish',
            detected_at: entryBar.date,
            entry_price: entryPrice,
            stop_loss_price: stopLoss,
            take_profit_price: takeProfit,
            risk_reward_ratio: 2, // 4 ATR TP / 2 ATR SL
            quality_score: qualityScore,
            quality_reasons: qualityReasons,
            bars: compressedWindow,
            visual_spec: {
              entryLine: { price: entryPrice },
              stopLossLine: { price: stopLoss },
              takeProfitLine: { price: takeProfit },
              pivots: result.pivots,
            },
            outcome: outcome.result,
            outcome_pnl_percent: outcome.pnl,
          });
        }
      } catch (e) {
        console.error(`Error detecting ${patternId}:`, e);
      }
    }
  }

  console.log(`Total patterns detected: ${detected.length}`);
  return detected;
}

// Normalized bar type for internal use
interface NormalizedBar {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
}

// Track if pattern hit TP, SL, or is still open
function trackOutcome(
  futureBars: NormalizedBar[],
  entry: number,
  sl: number,
  tp: number,
  isLong: boolean
): { result: string | null; pnl: number | null } {
  for (const bar of futureBars) {
    if (isLong) {
      if (bar.low <= sl) return { result: 'hit_sl', pnl: ((sl - entry) / entry) * 100 };
      if (bar.high >= tp) return { result: 'hit_tp', pnl: ((tp - entry) / entry) * 100 };
    } else {
      if (bar.high >= sl) return { result: 'hit_sl', pnl: ((entry - sl) / entry) * 100 };
      if (bar.low <= tp) return { result: 'hit_tp', pnl: ((entry - tp) / entry) * 100 };
    }
  }
  return { result: null, pnl: null };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, timeframe, lookbackDays = 60 }: DetectionRequest = await req.json();
    
    console.log(`On-demand pattern detection for ${symbol} on ${timeframe} timeframe`);
    
    // Determine lookback based on timeframe
    const effectiveLookback = timeframe === '1h' ? 30 : timeframe === '4h' ? 60 : lookbackDays;
    
    // Fetch price data
    const bars = await fetchYahooData(symbol, timeframe, effectiveLookback);
    
    if (bars.length < 30) {
      return new Response(
        JSON.stringify({ 
          patterns: [], 
          message: `Insufficient data: only ${bars.length} bars available`,
          bars_fetched: bars.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetched ${bars.length} bars for ${symbol}`);
    
    // Run pattern detection
    const patterns = detectPatternsWithHistory(bars, timeframe);
    
    console.log(`Detected ${patterns.length} patterns for ${symbol} on ${timeframe}`);

    return new Response(
      JSON.stringify({ 
        patterns,
        bars_fetched: bars.length,
        timeframe,
        symbol
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in detect-patterns-ondemand:', error);
    return new Response(
      JSON.stringify({ error: error.message, patterns: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
