import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { computeBracketLevels, BRACKET_LEVELS_VERSION, ROUNDING_CONFIG } from "../_shared/bracketLevels.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Instruments by asset type
const INSTRUMENTS_BY_TYPE: Record<string, string[]> = {
  fx: [
    'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X',
    'NZDUSD=X', 'USDCHF=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X',
    'AUDJPY=X', 'EURAUD=X', 'EURCHF=X', 'AUDNZD=X', 'CADJPY=X',
    'NZDJPY=X', 'GBPAUD=X', 'GBPCAD=X', 'AUDCAD=X', 'EURCAD=X',
    'CHFJPY=X', 'GBPCHF=X', 'EURNZD=X', 'CADCHF=X', 'AUDCHF=X'
  ],
  crypto: [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD',
    'ADA-USD', 'AVAX-USD', 'DOGE-USD', 'LINK-USD', 'MATIC-USD',
    'DOT-USD', 'SHIB-USD', 'LTC-USD', 'UNI-USD', 'ATOM-USD',
    'XLM-USD', 'NEAR-USD', 'APT-USD', 'ARB-USD', 'OP-USD',
    'FIL-USD', 'INJ-USD', 'AAVE-USD', 'MKR-USD', 'SAND-USD'
  ],
  stocks: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META',
    'TSLA', 'NVDA', 'JPM', 'V', 'JNJ',
    'WMT', 'PG', 'UNH', 'HD', 'BAC',
    'MA', 'DIS', 'NFLX', 'ADBE', 'CRM',
    'PFE', 'KO', 'PEP', 'MRK', 'CSCO'
  ],
  commodities: [
    'GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F',
    'PL=F', 'PA=F', 'ZC=F', 'ZW=F', 'ZS=F',
    'KC=F', 'SB=F', 'CC=F', 'CT=F', 'LE=F',
    'HE=F', 'GF=F', 'ZO=F', 'ZR=F', 'ZL=F'
  ]
};

const DEFAULT_ASSET_TYPE = 'fx';

// All patterns to scan
const ALL_PATTERNS = [
  'donchian-breakout-long', 'donchian-breakout-short',
  'double-top', 'double-bottom',
  'ascending-triangle', 'descending-triangle'
];

interface PatternPivot {
  index: number;
  price: number;
  type: 'high' | 'low';
  label: string;
  timestamp?: string;
}

interface PatternDetectionResult {
  detected: boolean;
  pivots: PatternPivot[];
}

// Pattern registry with detection logic
const PATTERN_REGISTRY: Record<string, { direction: 'long' | 'short'; displayName: string; detector: (w: any[]) => PatternDetectionResult }> = {
  'donchian-breakout-long': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 10) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const closes = window.map(d => d.close);
      const lookbackHighs = highs.slice(0, -2);
      const recentHigh = Math.max(...lookbackHighs);
      const recentHighIdx = lookbackHighs.indexOf(recentHigh);
      const currentClose = closes[closes.length - 1];
      const prevClose = closes[closes.length - 2];
      const detected = currentClose > recentHigh * 1.001 || prevClose > recentHigh * 1.001;
      return {
        detected,
        pivots: detected ? [
          { index: recentHighIdx, price: recentHigh, type: 'high', label: 'Breakout Level' },
          { index: window.length - 1, price: currentClose, type: 'high', label: 'Entry' }
        ] : []
      };
    },
    displayName: 'Donchian Breakout Long'
  },
  'donchian-breakout-short': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 10) return { detected: false, pivots: [] };
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      const lookbackLows = lows.slice(0, -2);
      const recentLow = Math.min(...lookbackLows);
      const recentLowIdx = lookbackLows.indexOf(recentLow);
      const currentClose = closes[closes.length - 1];
      const prevClose = closes[closes.length - 2];
      const detected = currentClose < recentLow * 0.999 || prevClose < recentLow * 0.999;
      return {
        detected,
        pivots: detected ? [
          { index: recentLowIdx, price: recentLow, type: 'low', label: 'Breakdown Level' },
          { index: window.length - 1, price: currentClose, type: 'low', label: 'Entry' }
        ] : []
      };
    },
    displayName: 'Donchian Breakout Short'
  },
  'double-top': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const range = highestHigh - lowestLow;
      const tolerance = range * 0.03;
      
      let firstTop = -1, secondTop = -1;
      for (let i = 2; i < window.length - 3; i++) {
        if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && 
            highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
          if (firstTop === -1) firstTop = i;
          else if (i - firstTop >= 3 && Math.abs(highs[i] - highs[firstTop]) <= tolerance) {
            secondTop = i;
            break;
          }
        }
      }
      
      if (firstTop === -1 || secondTop === -1) return { detected: false, pivots: [] };
      
      let necklineIdx = firstTop;
      let neckline = lows[firstTop];
      for (let i = firstTop; i <= secondTop; i++) {
        if (lows[i] < neckline) {
          neckline = lows[i];
          necklineIdx = i;
        }
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < neckline * 0.998;
      
      return {
        detected,
        pivots: detected ? [
          { index: firstTop, price: highs[firstTop], type: 'high', label: 'Top 1' },
          { index: secondTop, price: highs[secondTop], type: 'high', label: 'Top 2' },
          { index: necklineIdx, price: neckline, type: 'low', label: 'Neckline' }
        ] : []
      };
    },
    displayName: 'Double Top'
  },
  'double-bottom': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const range = highestHigh - lowestLow;
      const tolerance = range * 0.03;
      
      let firstBottom = -1, secondBottom = -1;
      for (let i = 2; i < window.length - 3; i++) {
        if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && 
            lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
          if (firstBottom === -1) firstBottom = i;
          else if (i - firstBottom >= 3 && Math.abs(lows[i] - lows[firstBottom]) <= tolerance) {
            secondBottom = i;
            break;
          }
        }
      }
      
      if (firstBottom === -1 || secondBottom === -1) return { detected: false, pivots: [] };
      
      let necklineIdx = firstBottom;
      let neckline = highs[firstBottom];
      for (let i = firstBottom; i <= secondBottom; i++) {
        if (highs[i] > neckline) {
          neckline = highs[i];
          necklineIdx = i;
        }
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > neckline * 1.002;
      
      return {
        detected,
        pivots: detected ? [
          { index: firstBottom, price: lows[firstBottom], type: 'low', label: 'Bottom 1' },
          { index: secondBottom, price: lows[secondBottom], type: 'low', label: 'Bottom 2' },
          { index: necklineIdx, price: neckline, type: 'high', label: 'Neckline' }
        ] : []
      };
    },
    displayName: 'Double Bottom'
  },
  'ascending-triangle': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const resistanceZone = Math.max(...highs.slice(0, -2));
      const resistanceTests = highs.filter(h => h > resistanceZone * 0.98 && h <= resistanceZone * 1.02).length;
      
      const recentLows = lows.slice(-10);
      let risingLows = true;
      for (let i = 1; i < recentLows.length; i++) {
        if (recentLows[i] < recentLows[i - 1] * 0.995) risingLows = false;
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = resistanceTests >= 2 && risingLows && lastClose > resistanceZone * 1.002;
      
      const resistanceIdx = highs.indexOf(resistanceZone);
      const lowestRecentLowIdx = window.length - 10 + recentLows.indexOf(Math.min(...recentLows));
      
      return {
        detected,
        pivots: detected ? [
          { index: resistanceIdx, price: resistanceZone, type: 'high', label: 'Resistance' },
          { index: lowestRecentLowIdx, price: Math.min(...recentLows), type: 'low', label: 'Rising Support' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' }
        ] : []
      };
    },
    displayName: 'Ascending Triangle'
  },
  'descending-triangle': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const supportZone = Math.min(...lows.slice(0, -2));
      const supportTests = lows.filter(l => l < supportZone * 1.02 && l >= supportZone * 0.98).length;
      
      const recentHighs = highs.slice(-10);
      let fallingHighs = true;
      for (let i = 1; i < recentHighs.length; i++) {
        if (recentHighs[i] > recentHighs[i - 1] * 1.005) fallingHighs = false;
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = supportTests >= 2 && fallingHighs && lastClose < supportZone * 0.998;
      
      const supportIdx = lows.indexOf(supportZone);
      const highestRecentHighIdx = window.length - 10 + recentHighs.indexOf(Math.max(...recentHighs));
      
      return {
        detected,
        pivots: detected ? [
          { index: supportIdx, price: supportZone, type: 'low', label: 'Support' },
          { index: highestRecentHighIdx, price: Math.max(...recentHighs), type: 'high', label: 'Falling Resistance' },
          { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
        ] : []
      };
    },
    displayName: 'Descending Triangle'
  },
};

function calculateATR(bars: any[], period: number = 14): number {
  if (bars.length < period + 1) return 0;
  const recentBars = bars.slice(-period - 1);
  let atrSum = 0;
  for (let i = 1; i < recentBars.length; i++) {
    const high = recentBars[i].high;
    const low = recentBars[i].low;
    const prevClose = recentBars[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    atrSum += tr;
  }
  return atrSum / period;
}

async function fetchYahooData(symbol: string, startDate: string, endDate: string, interval: string = '1d'): Promise<any[]> {
  try {
    const yahooInterval = interval === '4h' ? '1h' : interval === '1h' ? '1h' : '1d';
    const period1 = Math.floor(new Date(startDate).getTime() / 1000);
    const period2 = Math.floor(new Date(endDate).getTime() / 1000);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=${yahooInterval}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result || !result.timestamp) return [];
    
    const timestamps = result.timestamp;
    const quotes = result.indicators?.quote?.[0];
    if (!quotes) return [];
    
    const bars: any[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.open[i] != null && quotes.high[i] != null && quotes.low[i] != null && quotes.close[i] != null) {
        bars.push({
          date: new Date(timestamps[i] * 1000).toISOString(),
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i] || 0,
        });
      }
    }
    
    return bars;
  } catch (error) {
    console.error(`[fetchYahooData] Error for ${symbol}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Support both query params and body
    const url = new URL(req.url);
    let limit = parseInt(url.searchParams.get('limit') || '30');
    let timeframe = url.searchParams.get('timeframe') || '1d';
    let assetType = url.searchParams.get('assetType') || DEFAULT_ASSET_TYPE;
    
    // Override with body params if provided
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.limit) limit = parseInt(body.limit);
        if (body.timeframe) timeframe = body.timeframe;
        if (body.assetType) assetType = body.assetType;
      } catch {
        // Body parsing failed, use query params
      }
    }
    
    const instruments = INSTRUMENTS_BY_TYPE[assetType] || INSTRUMENTS_BY_TYPE[DEFAULT_ASSET_TYPE];
    
    console.log('[scan-live-patterns] Starting scan, limit:', limit, 'timeframe:', timeframe, 'assetType:', assetType);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // 90 days of data
    
    const setups: any[] = [];
    
    for (const instrument of instruments) {
      if (setups.length >= limit) break;
      
      const bars = await fetchYahooData(
        instrument,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        timeframe
      );
      
      if (bars.length < 20) continue;
      
      for (const patternId of ALL_PATTERNS) {
        if (setups.length >= limit) break;
        
        const pattern = PATTERN_REGISTRY[patternId];
        if (!pattern) continue;
        
        const window = bars.slice(-20);
        const detectionResult = pattern.detector(window);
        
        if (detectionResult.detected) {
          const lastBar = bars[bars.length - 1];
          const signalTs = lastBar.date;
          const atr = calculateATR(bars, 14);
          
          const bracketLevels = computeBracketLevels({
            direction: pattern.direction,
            entryPrice: lastBar.close,
            stopPercent: (atr / lastBar.close) * 100 * 2,
            targetPercent: (atr / lastBar.close) * 100 * 4,
            atr,
            atrMultiplier: 2.0,
            stopLossMethod: 'atr',
            takeProfitMethod: 'ratio',
          });
          
          const entryPrice = lastBar.close;
          
          // Visual spec - last 60 bars for compact view
          const visualBars = bars.slice(-60);
          const compressedBars = visualBars.map(b => ({
            t: b.date,
            o: Number(b.open.toFixed(6)),
            h: Number(b.high.toFixed(6)),
            l: Number(b.low.toFixed(6)),
            c: Number(b.close.toFixed(6)),
            v: b.volume || 0,
          }));
          
          const allLows = visualBars.map(b => b.low);
          const allHighs = visualBars.map(b => b.high);
          const minPrice = Math.min(...allLows, bracketLevels.stopLossPrice, bracketLevels.takeProfitPrice, entryPrice);
          const maxPrice = Math.max(...allHighs, bracketLevels.stopLossPrice, bracketLevels.takeProfitPrice, entryPrice);
          
          // Map pivots to visual window
          const windowOffset = bars.length - 20;
          const visualOffset = bars.length - 60;
          
          const pivotsWithTimestamps = detectionResult.pivots.map(pivot => {
            const absoluteIndex = windowOffset + pivot.index;
            const visualIndex = absoluteIndex - visualOffset;
            const bar = bars[absoluteIndex];
            return {
              ...pivot,
              index: Math.max(0, visualIndex),
              timestamp: bar?.date || signalTs
            };
          }).filter(p => p.index >= 0 && p.index < visualBars.length);
          
          const visualSpec = {
            version: '2.0.0',
            symbol: instrument,
            timeframe,
            patternId,
            signalTs,
            window: { startTs: visualBars[0]?.date || signalTs, endTs: visualBars[visualBars.length - 1]?.date || signalTs },
            yDomain: { min: minPrice * 0.97, max: maxPrice * 1.03 },
            overlays: [
              { type: 'hline', id: 'entry', price: entryPrice, label: 'Entry', style: 'primary' },
              { type: 'hline', id: 'sl', price: bracketLevels.stopLossPrice, label: 'Stop', style: 'destructive' },
              { type: 'hline', id: 'tp', price: bracketLevels.takeProfitPrice, label: 'Target', style: 'positive' },
            ],
            pivots: pivotsWithTimestamps,
          };
          
          setups.push({
            instrument,
            patternId,
            patternName: pattern.displayName,
            direction: pattern.direction,
            signalTs,
            quality: { score: 'B', reasons: ['Pattern detected on latest bar'] },
            tradePlan: {
              entryType: 'bar_close',
              entry: entryPrice,
              stopLoss: bracketLevels.stopLossPrice,
              takeProfit: bracketLevels.takeProfitPrice,
              rr: bracketLevels.riskRewardRatio,
            },
            bars: compressedBars,
            visualSpec,
          });
          
          console.log(`[scan-live-patterns] Found: ${instrument} - ${pattern.displayName}`);
        }
      }
    }
    
    console.log(`[scan-live-patterns] Scan complete. Found ${setups.length} patterns.`);
    
    return new Response(JSON.stringify({
      success: true,
      patterns: setups,
      scannedAt: new Date().toISOString(),
      instrumentsScanned: instruments.length,
      assetType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[scan-live-patterns] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
