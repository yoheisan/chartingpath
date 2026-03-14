import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Dry-Run Detector Validation
 * 
 * Stage 1: Runs the 5 updated detectors (bull-flag, bear-flag, cup-and-handle, 
 * descending-triangle, ascending-triangle) against ~10 well-known tickers on 1D data.
 * Returns detection counts + sample pivots for human review before full re-seed.
 * 
 * Stage 2 (pilot): Can also run a small commodity-only pilot seed.
 */

// ============= TYPES =============
interface OHLCBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface PatternPivot {
  index: number;
  price: number;
  type: 'high' | 'low';
  label: string;
}

interface PatternDetectionResult {
  detected: boolean;
  pivots: PatternPivot[];
  patternStartIndex?: number;
  patternEndIndex?: number;
}

// ============= TEST TICKERS =============
const DRY_RUN_TICKERS = [
  { symbol: 'AAPL', name: 'Apple', type: 'stocks' },
  { symbol: 'TSLA', name: 'Tesla', type: 'stocks' },
  { symbol: 'MSFT', name: 'Microsoft', type: 'stocks' },
  { symbol: 'AMZN', name: 'Amazon', type: 'stocks' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'stocks' },
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto' },
  { symbol: 'EURUSD=X', name: 'EUR/USD', type: 'fx' },
  { symbol: 'GC=F', name: 'Gold', type: 'commodities' },
  { symbol: 'SPY', name: 'S&P 500 ETF', type: 'stocks' },
];

// ============= DETECTORS (copied from seeder — must match exactly) =============

function detectBullFlag(window: OHLCBar[]): PatternDetectionResult {
  if (window.length < 15) return { detected: false, pivots: [] };
  const closes = window.map(d => d.close);
  const highs = window.map(d => d.high);
  const lows = window.map(d => d.low);
  const len = window.length;
  
  const maxPoleEnd = Math.floor(len * 0.6);
  let bestPoleStart = 0, bestPoleEnd = 0, bestPoleGain = 0;
  for (let start = 0; start < Math.floor(len * 0.3); start++) {
    for (let end = start + 3; end <= maxPoleEnd; end++) {
      const gain = (closes[end] - closes[start]) / closes[start];
      if (gain > bestPoleGain) {
        bestPoleGain = gain;
        bestPoleStart = start;
        bestPoleEnd = end;
      }
    }
  }
  
  if (bestPoleGain < 0.04) return { detected: false, pivots: [] };
  
  const flagStart = bestPoleEnd + 1;
  const flagEnd = Math.min(len - 2, bestPoleEnd + Math.max(3, Math.floor((len - bestPoleEnd) * 0.6)));
  if (flagStart >= flagEnd || flagEnd >= len) return { detected: false, pivots: [] };
  
  const flagHighs = highs.slice(flagStart, flagEnd + 1);
  const flagLows = lows.slice(flagStart, flagEnd + 1);
  if (flagHighs.length < 2) return { detected: false, pivots: [] };
  
  const flagHigh = Math.max(...flagHighs);
  const flagLow = Math.min(...flagLows);
  const flagRange = (flagHigh - flagLow) / flagLow;
  
  const poleHeight = closes[bestPoleEnd] - closes[bestPoleStart];
  const retracement = (closes[bestPoleEnd] - flagLow) / poleHeight;
  
  if (flagRange > 0.06 || retracement > 0.50) return { detected: false, pivots: [] };
  
  const lastClose = closes[len - 1];
  const detected = lastClose > flagHigh * 1.002;
  
  return {
    detected,
    patternStartIndex: bestPoleStart,
    patternEndIndex: len - 1,
    pivots: detected ? [
      { index: bestPoleStart, price: closes[bestPoleStart], type: 'low', label: 'Pole Start' },
      { index: bestPoleEnd, price: closes[bestPoleEnd], type: 'high', label: 'Pole End' },
      { index: flagStart + flagHighs.indexOf(flagHigh), price: flagHigh, type: 'high', label: 'Flag High' },
      { index: len - 1, price: lastClose, type: 'high', label: 'Breakout' }
    ] : []
  };
}

function detectBearFlag(window: OHLCBar[]): PatternDetectionResult {
  if (window.length < 15) return { detected: false, pivots: [] };
  const closes = window.map(d => d.close);
  const highs = window.map(d => d.high);
  const lows = window.map(d => d.low);
  const len = window.length;
  
  const maxPoleEnd = Math.floor(len * 0.6);
  let bestPoleStart = 0, bestPoleEnd = 0, bestPoleDrop = 0;
  for (let start = 0; start < Math.floor(len * 0.3); start++) {
    for (let end = start + 3; end <= maxPoleEnd; end++) {
      const drop = (closes[start] - closes[end]) / closes[start];
      if (drop > bestPoleDrop) {
        bestPoleDrop = drop;
        bestPoleStart = start;
        bestPoleEnd = end;
      }
    }
  }
  
  if (bestPoleDrop < 0.04) return { detected: false, pivots: [] };
  
  const flagStart = bestPoleEnd + 1;
  const flagEnd = Math.min(len - 2, bestPoleEnd + Math.max(3, Math.floor((len - bestPoleEnd) * 0.6)));
  if (flagStart >= flagEnd || flagEnd >= len) return { detected: false, pivots: [] };
  
  const flagHighs = highs.slice(flagStart, flagEnd + 1);
  const flagLows = lows.slice(flagStart, flagEnd + 1);
  if (flagLows.length < 2) return { detected: false, pivots: [] };
  
  const flagHigh = Math.max(...flagHighs);
  const flagLow = Math.min(...flagLows);
  const flagRange = (flagHigh - flagLow) / flagLow;
  
  const poleHeight = closes[bestPoleStart] - closes[bestPoleEnd];
  const retracement = (flagHigh - closes[bestPoleEnd]) / poleHeight;
  
  if (flagRange > 0.06 || retracement > 0.50) return { detected: false, pivots: [] };
  
  const lastClose = closes[len - 1];
  const detected = lastClose < flagLow * 0.998;
  
  return {
    detected,
    patternStartIndex: bestPoleStart,
    patternEndIndex: len - 1,
    pivots: detected ? [
      { index: bestPoleStart, price: closes[bestPoleStart], type: 'high', label: 'Pole Start' },
      { index: bestPoleEnd, price: closes[bestPoleEnd], type: 'low', label: 'Pole End' },
      { index: flagStart + flagLows.indexOf(flagLow), price: flagLow, type: 'low', label: 'Flag Low' },
      { index: len - 1, price: lastClose, type: 'low', label: 'Breakdown' }
    ] : []
  };
}

// Debug counters for C&H filter analysis
const cahDebug = { total: 0, failPriorRise: 0, failStructure: 0, failRim: 0, failDepth: 0, failBreakout: 0, passed: 0 };

// Configurable C&H params — set from request body
let CAH_MIN_RANGE_RATIO = 0.30;
let CAH_MODE: 'range-relative' | 'hybrid' = 'range-relative';
let CAH_FIXED_MIN_DEPTH = 0.10; // Used in hybrid mode for non-FX

function detectCupAndHandle(window: OHLCBar[], assetType?: string): PatternDetectionResult {
  if (window.length < 15) return { detected: false, pivots: [] };
  const closes = window.map(d => d.close);
  const highs = window.map(d => d.high);
  const lows = window.map(d => d.low);
  const len = window.length;
  
  cahDebug.total++;
  
  // Range-relative prior rise
  const windowHighAll = Math.max(...highs);
  const windowLowAll = Math.min(...lows);
  const windowRangeAll = windowHighAll - windowLowAll;
  
  const earlyLow = Math.min(...lows.slice(0, 5));
  const earlyHigh = Math.max(...highs.slice(0, 5));
  const priorRise = earlyHigh - earlyLow;
  const priorRiseRatio = windowRangeAll > 0 ? priorRise / windowRangeAll : 0;
  if (priorRiseRatio < 0.15) { cahDebug.failPriorRise++; return { detected: false, pivots: [] }; }
  
  const leftRimEnd = Math.max(3, Math.floor(len * 0.4));
  const leftRimSlice = highs.slice(0, leftRimEnd);
  const leftRim = Math.max(...leftRimSlice);
  const leftRimIdx = leftRimSlice.indexOf(leftRim);
  
  const cupSearchEnd = Math.max(leftRimIdx + 3, Math.floor(len * 0.85));
  const cupSearchStart = leftRimIdx + 1;
  if (cupSearchStart >= cupSearchEnd) { cahDebug.failStructure++; return { detected: false, pivots: [] }; }
  
  const cupSlice = lows.slice(cupSearchStart, cupSearchEnd);
  if (cupSlice.length < 2) { cahDebug.failStructure++; return { detected: false, pivots: [] }; }
  const cupBottom = Math.min(...cupSlice);
  const cupBottomIdx = cupSearchStart + cupSlice.indexOf(cupBottom);
  
  const rightRimStart = cupBottomIdx + 1;
  const rightRimEnd = Math.max(rightRimStart + 1, len - 2);
  if (rightRimStart >= rightRimEnd) { cahDebug.failStructure++; return { detected: false, pivots: [] }; }
  
  const rightRimSlice = highs.slice(rightRimStart, rightRimEnd);
  if (rightRimSlice.length === 0) { cahDebug.failStructure++; return { detected: false, pivots: [] }; }
  const rightRim = Math.max(...rightRimSlice);
  const rightRimIdx = rightRimStart + rightRimSlice.indexOf(rightRim);
  
  const rimDiff = Math.abs(leftRim - rightRim) / leftRim;
  const cupDepthPct = (Math.min(leftRim, rightRim) - cupBottom) / Math.min(leftRim, rightRim);
  
  const cupAbsDepth = Math.min(leftRim, rightRim) - cupBottom;
  const cupRangeRatio = windowRangeAll > 0 ? cupAbsDepth / windowRangeAll : 0;
  
  if (rimDiff > 0.10) { cahDebug.failRim++; return { detected: false, pivots: [] }; }
  
  // Depth check: hybrid vs universal range-relative
  if (CAH_MODE === 'hybrid') {
    const isFX = assetType === 'fx';
    if (isFX) {
      // FX: use range-relative
      if (cupRangeRatio < CAH_MIN_RANGE_RATIO || cupDepthPct > 0.40) { cahDebug.failDepth++; return { detected: false, pivots: [] }; }
    } else {
      // Non-FX: use fixed percentage depth
      if (cupDepthPct < CAH_FIXED_MIN_DEPTH || cupDepthPct > 0.40) { cahDebug.failDepth++; return { detected: false, pivots: [] }; }
    }
  } else {
    // Universal range-relative
    if (cupRangeRatio < CAH_MIN_RANGE_RATIO || cupDepthPct > 0.40) { cahDebug.failDepth++; return { detected: false, pivots: [] }; }
  }
  
  let handleLow = rightRim;
  let handleLowIdx = rightRimIdx;
  if (rightRimIdx + 1 < len - 1) {
    const handleLows = lows.slice(rightRimIdx + 1, len - 1);
    if (handleLows.length > 0) {
      handleLow = Math.min(...handleLows);
      handleLowIdx = rightRimIdx + 1 + handleLows.indexOf(handleLow);
      const handleDepth = (rightRim - handleLow) / (rightRim - cupBottom);
      if (handleDepth < 0.03 || handleDepth > 0.60) {
        handleLow = rightRim;
        handleLowIdx = rightRimIdx;
      }
    }
  }
  
  const lastClose = closes[len - 1];
  const detected = lastClose > rightRim * 1.001;
  
  return {
    detected,
    patternStartIndex: leftRimIdx,
    patternEndIndex: len - 1,
    pivots: detected ? [
      { index: leftRimIdx, price: leftRim, type: 'high', label: 'Left Rim' },
      { index: cupBottomIdx, price: cupBottom, type: 'low', label: 'Cup Bottom' },
      { index: rightRimIdx, price: rightRim, type: 'high', label: 'Right Rim' },
      ...(handleLowIdx !== rightRimIdx ? [{ index: handleLowIdx, price: handleLow, type: 'low' as const, label: 'Handle' }] : []),
      { index: len - 1, price: lastClose, type: 'high', label: 'Breakout' }
    ] : []
  };
}

function detectDescendingTriangle(window: OHLCBar[]): PatternDetectionResult {
  if (window.length < 20) return { detected: false, pivots: [] };
  const highs = window.map(d => d.high);
  const lows = window.map(d => d.low);
  const closes = window.map(d => d.close);
  
  const earlyHigh = Math.max(...highs.slice(0, 5));
  const midLow = Math.min(...lows.slice(5, 15));
  const priorDrop = (earlyHigh - midLow) / earlyHigh;
  if (priorDrop < 0.02) return { detected: false, pivots: [] };
  
  const supportZone = Math.min(...lows.slice(0, -2));
  const supportTests = lows.filter(l => l < supportZone * 1.02 && l >= supportZone * 0.98).length;
  if (supportTests < 3) return { detected: false, pivots: [] };
  
  const recentHighs = highs.slice(-10);
  let fallingHighCount = 0;
  for (let i = 1; i < recentHighs.length; i++) {
    if (recentHighs[i] < recentHighs[i - 1] * 0.999) fallingHighCount++;
  }
  if (fallingHighCount < 2) return { detected: false, pivots: [] };
  
  const lastClose = closes[closes.length - 1];
  const detected = lastClose < supportZone * 0.998;
  
  const supportIdx = lows.indexOf(supportZone);
  const highestRecentHighIdx = window.length - 10 + recentHighs.indexOf(Math.max(...recentHighs));
  
  return {
    detected,
    patternStartIndex: 0,
    patternEndIndex: window.length - 1,
    pivots: detected ? [
      { index: supportIdx, price: supportZone, type: 'low', label: 'Support' },
      { index: highestRecentHighIdx, price: Math.max(...recentHighs), type: 'high', label: 'Falling Resistance' },
      { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
    ] : []
  };
}

function detectAscendingTriangle(window: OHLCBar[]): PatternDetectionResult {
  if (window.length < 20) return { detected: false, pivots: [] };
  const highs = window.map(d => d.high);
  const lows = window.map(d => d.low);
  const closes = window.map(d => d.close);
  
  const earlyLow = Math.min(...lows.slice(0, 5));
  const midHigh = Math.max(...highs.slice(5, 15));
  const priorRise = (midHigh - earlyLow) / earlyLow;
  if (priorRise < 0.02) return { detected: false, pivots: [] };
  
  const resistanceZone = Math.max(...highs.slice(0, -2));
  const resistanceTests = highs.filter(h => h > resistanceZone * 0.98 && h <= resistanceZone * 1.02).length;
  if (resistanceTests < 3) return { detected: false, pivots: [] };
  
  const recentLows = lows.slice(-10);
  let risingLowCount = 0;
  for (let i = 1; i < recentLows.length; i++) {
    if (recentLows[i] > recentLows[i - 1] * 1.001) risingLowCount++;
  }
  if (risingLowCount < 2) return { detected: false, pivots: [] };
  
  const lastClose = closes[closes.length - 1];
  const detected = lastClose > resistanceZone * 1.002;
  
  const resistanceIdx = highs.indexOf(resistanceZone);
  const lowestRecentLowIdx = window.length - 10 + recentLows.indexOf(Math.min(...recentLows));
  
  return {
    detected,
    patternStartIndex: 0,
    patternEndIndex: window.length - 1,
    pivots: detected ? [
      { index: resistanceIdx, price: resistanceZone, type: 'high', label: 'Resistance' },
      { index: lowestRecentLowIdx, price: Math.min(...recentLows), type: 'low', label: 'Rising Support' },
      { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' }
    ] : []
  };
}

// ============= DETECTOR REGISTRY =============
const TARGET_DETECTORS: Record<string, {
  direction: 'long' | 'short';
  displayName: string;
  detector: (w: OHLCBar[]) => PatternDetectionResult;
}> = {
  'bull-flag': { direction: 'long', displayName: 'Bull Flag', detector: detectBullFlag },
  'bear-flag': { direction: 'short', displayName: 'Bear Flag', detector: detectBearFlag },
  'cup-and-handle': { direction: 'long', displayName: 'Cup & Handle', detector: detectCupAndHandle },
  'descending-triangle': { direction: 'short', displayName: 'Descending Triangle', detector: detectDescendingTriangle },
  'ascending-triangle': { direction: 'long', displayName: 'Ascending Triangle', detector: detectAscendingTriangle },
};

// ============= DATA FETCHING =============
async function fetchYahooDaily(symbol: string): Promise<OHLCBar[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5);
  
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  const encodedSymbol = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`[Yahoo] ${symbol} error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    if (!data.chart?.result?.[0]) return [];
    
    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    return timestamps.map((ts: number, idx: number) => ({
      date: new Date(ts * 1000).toISOString(),
      open: quotes.open?.[idx] || 0,
      high: quotes.high?.[idx] || 0,
      low: quotes.low?.[idx] || 0,
      close: quotes.close?.[idx] || 0,
      volume: quotes.volume?.[idx] || 0,
    })).filter((b: OHLCBar) => b.close > 0);
  } catch (error) {
    console.error(`[Yahoo] Error fetching ${symbol}:`, error);
    return [];
  }
}

// ============= MAIN HANDLER =============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      tickers = DRY_RUN_TICKERS,
      patterns = Object.keys(TARGET_DETECTORS),
      lookback = 40,  // Default lookback window for 1D
      timeframe = '1d'
    } = body;

    console.log(`=== DETECTOR DRY-RUN VALIDATION ===`);
    console.log(`Tickers: ${tickers.map((t: any) => t.symbol).join(', ')}`);
    console.log(`Patterns: ${patterns.join(', ')}`);
    console.log(`Lookback: ${lookback}, Timeframe: ${timeframe}`);

    const results: Record<string, {
      symbol: string;
      name: string;
      barsLoaded: number;
      patterns: Record<string, {
        detections: number;
        samples: Array<{
          windowEndDate: string;
          pivots: PatternPivot[];
          poleGainOrDrop?: string;
        }>;
      }>;
    }> = {};

    const summary: Record<string, { totalDetections: number; tickersWithDetections: number }> = {};
    for (const pid of patterns) {
      summary[pid] = { totalDetections: 0, tickersWithDetections: 0 };
    }

    // Process each ticker
    for (const ticker of tickers) {
      console.log(`\n--- Processing ${ticker.symbol} (${ticker.name}) ---`);
      
      const bars = await fetchYahooDaily(ticker.symbol);
      if (bars.length < lookback + 10) {
        console.log(`  Skipped: only ${bars.length} bars (need ${lookback + 10}+)`);
        results[ticker.symbol] = {
          symbol: ticker.symbol,
          name: ticker.name,
          barsLoaded: bars.length,
          patterns: {}
        };
        continue;
      }

      console.log(`  Loaded ${bars.length} daily bars (${bars[0].date.split('T')[0]} → ${bars[bars.length - 1].date.split('T')[0]})`);

      const tickerPatterns: Record<string, { detections: number; samples: any[] }> = {};

      for (const patternId of patterns) {
        const patternDef = TARGET_DETECTORS[patternId];
        if (!patternDef) continue;

        let detectionCount = 0;
        const samples: any[] = [];

        // Slide the window across all bars
        for (let i = lookback; i < bars.length; i++) {
          const window = bars.slice(i - lookback, i + 1);
          const result = patternDef.detector(window);

          if (result.detected) {
            detectionCount++;
            
            // Keep up to 5 samples with pivot details
            if (samples.length < 5) {
              samples.push({
                windowEndDate: bars[i].date.split('T')[0],
                windowEndPrice: bars[i].close,
                pivotCount: result.pivots.length,
                pivots: result.pivots.map(p => ({
                  label: p.label,
                  price: Math.round(p.price * 100) / 100,
                  type: p.type,
                  barOffset: p.index  // offset within the lookback window
                })),
                patternSpan: result.patternStartIndex !== undefined && result.patternEndIndex !== undefined
                  ? `bars ${result.patternStartIndex}-${result.patternEndIndex} of ${window.length}`
                  : 'N/A'
              });
            }
          }
        }

        tickerPatterns[patternId] = { detections: detectionCount, samples };
        
        if (detectionCount > 0) {
          summary[patternId].totalDetections += detectionCount;
          summary[patternId].tickersWithDetections++;
        }

        console.log(`  ${patternDef.displayName}: ${detectionCount} detections`);
        if (patternId === 'cup-and-handle') {
          console.log(`  C&H Debug: total=${cahDebug.total} failPriorRise=${cahDebug.failPriorRise} failStructure=${cahDebug.failStructure} failRim=${cahDebug.failRim} failDepth=${cahDebug.failDepth} passed=${cahDebug.passed}`);
          // Reset for next ticker
          cahDebug.total = 0; cahDebug.failPriorRise = 0; cahDebug.failStructure = 0; cahDebug.failRim = 0; cahDebug.failDepth = 0; cahDebug.passed = 0;
        }
      }

      results[ticker.symbol] = {
        symbol: ticker.symbol,
        name: ticker.name,
        barsLoaded: bars.length,
        patterns: tickerPatterns
      };

      // Small delay between tickers to be respectful to Yahoo
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Build summary table
    const summaryTable = Object.entries(summary).map(([pid, s]) => ({
      pattern: TARGET_DETECTORS[pid]?.displayName || pid,
      totalDetections: s.totalDetections,
      tickersWithDetections: s.tickersWithDetections,
      avgPerTicker: s.tickersWithDetections > 0 
        ? Math.round(s.totalDetections / tickers.length * 10) / 10
        : 0,
      assessment: s.totalDetections === 0 ? '🔴 ZERO — needs investigation'
        : s.totalDetections < 5 ? '🟡 LOW — may need further tuning'
        : s.totalDetections < 50 ? '🟢 REASONABLE — expected for 10 tickers'
        : s.totalDetections > 500 ? '🟡 HIGH — check for over-detection'
        : '🟢 GOOD'
    }));

    console.log(`\n=== SUMMARY ===`);
    for (const row of summaryTable) {
      console.log(`${row.pattern}: ${row.totalDetections} total (${row.assessment})`);
    }

    return new Response(JSON.stringify({
      validation: 'dry-run',
      timeframe,
      lookback,
      tickerCount: tickers.length,
      summary: summaryTable,
      cahFilterDebug: { ...cahDebug },
      detailedResults: results,
      nextStep: 'Review detection counts and sample pivots. If reasonable, proceed to pilot stage with commodity asset class.'
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Dry-run error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
