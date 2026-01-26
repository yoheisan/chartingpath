import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

/**
 * Check if the market for a given asset type is currently open.
 * Used for UI indication only - does NOT filter out patterns.
 */
function isMarketOpen(assetType: string): boolean {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  
  // Crypto is 24/7
  if (assetType === 'crypto') {
    return true;
  }
  
  // FX, stocks, commodities are closed on weekends
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return !isWeekend;
}


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

/**
 * Upsert pattern detections to database for lifecycle tracking.
 * Returns patterns with their original first_detected_at timestamp.
 */
async function persistPatterns(
  supabase: any,
  detectedPatterns: any[],
  assetType: string,
  timeframe: string
): Promise<Map<string, Date>> {
  const patternKeys = new Map<string, Date>();
  
  if (detectedPatterns.length === 0) return patternKeys;
  
  // Build unique keys for each detected pattern
  const detectedKeys = new Set(
    detectedPatterns.map(p => `${p.instrument}|${p.patternId}|${timeframe}`)
  );
  
  // Fetch existing active patterns for this asset type
  const { data: existingPatterns, error: fetchError } = await supabase
    .from('live_pattern_detections')
    .select('id, instrument, pattern_id, timeframe, first_detected_at, status')
    .eq('asset_type', assetType)
    .eq('timeframe', timeframe)
    .eq('status', 'active');
  
  if (fetchError) {
    console.error('[persistPatterns] Error fetching existing patterns:', fetchError);
    return patternKeys;
  }
  
  // Build map of existing patterns
  const existingMap = new Map<string, { id: string; first_detected_at: string }>();
  for (const ep of existingPatterns || []) {
    const key = `${ep.instrument}|${ep.pattern_id}|${ep.timeframe}`;
    existingMap.set(key, { id: ep.id, first_detected_at: ep.first_detected_at });
  }
  
  // Mark patterns that are no longer detected as invalidated
  const patternsToInvalidate: string[] = [];
  for (const [key, existing] of existingMap) {
    if (!detectedKeys.has(key)) {
      patternsToInvalidate.push(existing.id);
    }
  }
  
  if (patternsToInvalidate.length > 0) {
    const { error: invalidateError } = await supabase
      .from('live_pattern_detections')
      .update({ status: 'invalidated', updated_at: new Date().toISOString() })
      .in('id', patternsToInvalidate);
    
    if (invalidateError) {
      console.error('[persistPatterns] Error invalidating patterns:', invalidateError);
    } else {
      console.log(`[persistPatterns] Invalidated ${patternsToInvalidate.length} stale patterns`);
    }
  }
  
  // Upsert detected patterns
  const now = new Date().toISOString();
  
  for (const pattern of detectedPatterns) {
    const key = `${pattern.instrument}|${pattern.patternId}|${timeframe}`;
    const existing = existingMap.get(key);
    
    if (existing) {
      // Pattern still active - update last_confirmed_at and price data
      const { error: updateError } = await supabase
        .from('live_pattern_detections')
        .update({
          last_confirmed_at: now,
          current_price: pattern.currentPrice,
          prev_close: pattern.prevClose,
          change_percent: pattern.changePercent,
          bars: pattern.bars,
          visual_spec: pattern.visualSpec,
          updated_at: now
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.error(`[persistPatterns] Error updating pattern ${key}:`, updateError);
      }
      
      // Use original first_detected_at
      patternKeys.set(key, new Date(existing.first_detected_at));
    } else {
      // New pattern - insert with current timestamp as first_detected_at
      const { data: inserted, error: insertError } = await supabase
        .from('live_pattern_detections')
        .insert({
          instrument: pattern.instrument,
          pattern_id: pattern.patternId,
          pattern_name: pattern.patternName,
          direction: pattern.direction,
          timeframe,
          asset_type: assetType,
          first_detected_at: now,
          last_confirmed_at: now,
          status: 'active',
          entry_price: pattern.tradePlan.entry,
          stop_loss_price: pattern.tradePlan.stopLoss,
          take_profit_price: pattern.tradePlan.takeProfit,
          risk_reward_ratio: pattern.tradePlan.rr,
          visual_spec: pattern.visualSpec,
          bars: pattern.bars,
          current_price: pattern.currentPrice,
          prev_close: pattern.prevClose,
          change_percent: pattern.changePercent,
          quality_score: pattern.quality?.score || 'B',
          quality_reasons: pattern.quality?.reasons || []
        })
        .select('first_detected_at')
        .single();
      
      if (insertError) {
        // Handle unique constraint violation (race condition)
        if (insertError.code === '23505') {
          console.log(`[persistPatterns] Pattern ${key} already exists, fetching...`);
          const { data: refetch } = await supabase
            .from('live_pattern_detections')
            .select('first_detected_at')
            .eq('instrument', pattern.instrument)
            .eq('pattern_id', pattern.patternId)
            .eq('timeframe', timeframe)
            .eq('status', 'active')
            .single();
          if (refetch) {
            patternKeys.set(key, new Date(refetch.first_detected_at));
          }
        } else {
          console.error(`[persistPatterns] Error inserting pattern ${key}:`, insertError);
        }
      } else if (inserted) {
        patternKeys.set(key, new Date(inserted.first_detected_at));
        console.log(`[persistPatterns] New pattern detected: ${pattern.instrument} - ${pattern.patternName}`);
      }
    }
  }
  
  return patternKeys;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
    
    const detectedPatterns: any[] = [];
    
    for (const instrument of instruments) {
      const bars = await fetchYahooData(
        instrument,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        timeframe
      );
      
      if (bars.length < 20) continue;
      
      for (const patternId of ALL_PATTERNS) {
        const pattern = PATTERN_REGISTRY[patternId];
        if (!pattern) continue;
        
        const window = bars.slice(-20);
        const detectionResult = pattern.detector(window);
        
        if (detectionResult.detected) {
          const lastBar = bars[bars.length - 1];
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
              timestamp: bar?.date || lastBar.date
            };
          }).filter(p => p.index >= 0 && p.index < visualBars.length);
          
          const visualSpec = {
            version: '2.0.0',
            symbol: instrument,
            timeframe,
            patternId,
            signalTs: lastBar.date,
            window: { startTs: visualBars[0]?.date || lastBar.date, endTs: visualBars[visualBars.length - 1]?.date || lastBar.date },
            yDomain: { min: minPrice * 0.97, max: maxPrice * 1.03 },
            overlays: [
              { type: 'hline', id: 'entry', price: entryPrice, label: 'Entry', style: 'primary' },
              { type: 'hline', id: 'sl', price: bracketLevels.stopLossPrice, label: 'Stop', style: 'destructive' },
              { type: 'hline', id: 'tp', price: bracketLevels.takeProfitPrice, label: 'Target', style: 'positive' },
            ],
            pivots: pivotsWithTimestamps,
          };
          
          // Calculate % change from previous session close
          const prevBar = bars.length >= 2 ? bars[bars.length - 2] : null;
          const prevClose = prevBar ? prevBar.close : null;
          const currentClose = lastBar.close;
          const changePercent = prevClose && prevClose !== 0 
            ? ((currentClose - prevClose) / prevClose) * 100 
            : null;
          
          detectedPatterns.push({
            instrument,
            patternId,
            patternName: pattern.displayName,
            direction: pattern.direction,
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
            currentPrice: currentClose,
            prevClose: prevClose,
            changePercent: changePercent !== null ? Number(changePercent.toFixed(2)) : null,
          });
          
          console.log(`[scan-live-patterns] Found: ${instrument} - ${pattern.displayName}`);
        }
      }
    }
    
    // Persist patterns and get their original first_detected_at timestamps
    const patternTimestamps = await persistPatterns(supabase, detectedPatterns, assetType, timeframe);
    
    // Build final response with accurate signalTs from database
    const setups = detectedPatterns.slice(0, limit).map(pattern => {
      const key = `${pattern.instrument}|${pattern.patternId}|${timeframe}`;
      const firstDetectedAt = patternTimestamps.get(key);
      
      return {
        ...pattern,
        // Use the persisted first_detected_at as signalTs for accurate age calculation
        signalTs: firstDetectedAt ? firstDetectedAt.toISOString() : pattern.visualSpec.signalTs,
        visualSpec: {
          ...pattern.visualSpec,
          // Also update signalTs in visualSpec for consistency
          signalTs: firstDetectedAt ? firstDetectedAt.toISOString() : pattern.visualSpec.signalTs,
        }
      };
    });
    
    const marketOpen = isMarketOpen(assetType);
    console.log(`[scan-live-patterns] Scan complete. Found ${setups.length} patterns. Market open: ${marketOpen}`);
    
    return new Response(JSON.stringify({
      success: true,
      patterns: setups,
      scannedAt: new Date().toISOString(),
      instrumentsScanned: instruments.length,
      assetType,
      marketOpen,
      marketStatus: marketOpen ? 'open' : 'closed',
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
