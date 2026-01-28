import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeBracketLevels, BRACKET_LEVELS_VERSION, ROUNDING_CONFIG } from "../_shared/bracketLevels.ts";
import { ALL_INSTRUMENTS, type Instrument } from "../_shared/screenerInstruments.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to get instruments for a tier - now uses shared comprehensive instrument list
function getInstrumentsForTier(assetType: string, maxTickers: number): string[] {
  // Map asset type to shared instruments
  const assetMap: Record<string, Instrument[]> = {
    fx: ALL_INSTRUMENTS.fx,
    crypto: ALL_INSTRUMENTS.crypto,
    stocks: ALL_INSTRUMENTS.stocks,
    commodities: ALL_INSTRUMENTS.commodities,
    indices: ALL_INSTRUMENTS.indices,
    etfs: ALL_INSTRUMENTS.etfs,
  };
  
  const instruments = assetMap[assetType] || [];
  // Return yahoo symbols, limited by tier's maxTickers
  return instruments.slice(0, maxTickers).map(i => i.yahooSymbol);
}

// Legacy support - build from shared instruments
const BASE_INSTRUMENTS: Record<string, string[]> = {
  fx: ALL_INSTRUMENTS.fx.slice(0, 25).map(i => i.yahooSymbol),
  crypto: ALL_INSTRUMENTS.crypto.slice(0, 25).map(i => i.yahooSymbol),
  stocks: ALL_INSTRUMENTS.stocks.slice(0, 25).map(i => i.yahooSymbol),
  commodities: ALL_INSTRUMENTS.commodities.slice(0, 25).map(i => i.yahooSymbol),
};

const INSTRUMENTS_BY_TYPE = BASE_INSTRUMENTS;

const DEFAULT_ASSET_TYPE = 'fx';

// Base patterns (FREE tier) - 6 patterns
const BASE_PATTERNS = [
  'donchian-breakout-long', 'donchian-breakout-short',
  'double-top', 'double-bottom',
  'ascending-triangle', 'descending-triangle'
];

// Extended patterns (PLUS+ tier) - adds H&S, wedges
const EXTENDED_PATTERNS = [
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'rising-wedge', 'falling-wedge'
];

// Premium patterns (PRO/TEAM tier) - adds flags, cup & handle
const PREMIUM_PATTERNS = [
  'bull-flag', 'bear-flag', 'cup-and-handle', 'triple-top', 'triple-bottom'
];

// All patterns combined
const ALL_PATTERNS = [...BASE_PATTERNS];

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
  // Head and Shoulders (bearish reversal)
  'head-and-shoulders': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // Find local maxima (potential shoulders and head)
      const peaks: { index: number; value: number }[] = [];
      for (let i = 2; i < window.length - 2; i++) {
        if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
            highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
          peaks.push({ index: i, value: highs[i] });
        }
      }
      
      if (peaks.length < 3) return { detected: false, pivots: [] };
      
      // Find head (highest peak)
      let headIdx = 0;
      for (let i = 1; i < peaks.length; i++) {
        if (peaks[i].value > peaks[headIdx].value) headIdx = i;
      }
      
      // Head must not be at edges
      if (headIdx === 0 || headIdx === peaks.length - 1) return { detected: false, pivots: [] };
      
      const leftShoulder = peaks[headIdx - 1];
      const head = peaks[headIdx];
      const rightShoulder = peaks[headIdx + 1];
      
      // Validate pattern: head higher than shoulders, shoulders roughly equal
      const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value);
      const range = head.value - Math.min(leftShoulder.value, rightShoulder.value);
      const symmetryOk = shoulderDiff / range < 0.25; // Shoulders within 25% of each other
      const headHigherOk = head.value > leftShoulder.value * 1.02 && head.value > rightShoulder.value * 1.02;
      
      if (!symmetryOk || !headHigherOk) return { detected: false, pivots: [] };
      
      // Find neckline (lowest low between shoulders)
      let neckline = Infinity;
      let necklineIdx = leftShoulder.index;
      for (let i = leftShoulder.index; i <= rightShoulder.index; i++) {
        if (lows[i] < neckline) {
          neckline = lows[i];
          necklineIdx = i;
        }
      }
      
      // Confirmation: close below neckline
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < neckline * 0.998;
      
      return {
        detected,
        pivots: detected ? [
          { index: leftShoulder.index, price: leftShoulder.value, type: 'high', label: 'Left Shoulder' },
          { index: head.index, price: head.value, type: 'high', label: 'Head' },
          { index: rightShoulder.index, price: rightShoulder.value, type: 'high', label: 'Right Shoulder' },
          { index: necklineIdx, price: neckline, type: 'low', label: 'Neckline' }
        ] : []
      };
    },
    displayName: 'Head and Shoulders'
  },
  // Inverse Head and Shoulders (bullish reversal)
  'inverse-head-and-shoulders': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // Find local minima (potential shoulders and head)
      const troughs: { index: number; value: number }[] = [];
      for (let i = 2; i < window.length - 2; i++) {
        if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
            lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
          troughs.push({ index: i, value: lows[i] });
        }
      }
      
      if (troughs.length < 3) return { detected: false, pivots: [] };
      
      // Find head (lowest trough)
      let headIdx = 0;
      for (let i = 1; i < troughs.length; i++) {
        if (troughs[i].value < troughs[headIdx].value) headIdx = i;
      }
      
      // Head must not be at edges
      if (headIdx === 0 || headIdx === troughs.length - 1) return { detected: false, pivots: [] };
      
      const leftShoulder = troughs[headIdx - 1];
      const head = troughs[headIdx];
      const rightShoulder = troughs[headIdx + 1];
      
      // Validate pattern: head lower than shoulders, shoulders roughly equal
      const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value);
      const range = Math.max(leftShoulder.value, rightShoulder.value) - head.value;
      const symmetryOk = shoulderDiff / range < 0.25;
      const headLowerOk = head.value < leftShoulder.value * 0.98 && head.value < rightShoulder.value * 0.98;
      
      if (!symmetryOk || !headLowerOk) return { detected: false, pivots: [] };
      
      // Find neckline (highest high between shoulders)
      let neckline = -Infinity;
      let necklineIdx = leftShoulder.index;
      for (let i = leftShoulder.index; i <= rightShoulder.index; i++) {
        if (highs[i] > neckline) {
          neckline = highs[i];
          necklineIdx = i;
        }
      }
      
      // Confirmation: close above neckline
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > neckline * 1.002;
      
      return {
        detected,
        pivots: detected ? [
          { index: leftShoulder.index, price: leftShoulder.value, type: 'low', label: 'Left Shoulder' },
          { index: head.index, price: head.value, type: 'low', label: 'Head' },
          { index: rightShoulder.index, price: rightShoulder.value, type: 'low', label: 'Right Shoulder' },
          { index: necklineIdx, price: neckline, type: 'high', label: 'Neckline' }
        ] : []
      };
    },
    displayName: 'Inverse Head and Shoulders'
  },
  // Rising Wedge (bearish)
  'rising-wedge': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // Check for converging upward trendlines
      const firstHalf = window.slice(0, Math.floor(window.length / 2));
      const secondHalf = window.slice(Math.floor(window.length / 2));
      
      const firstHighs = firstHalf.map(d => d.high);
      const secondHighs = secondHalf.map(d => d.high);
      const firstLows = firstHalf.map(d => d.low);
      const secondLows = secondHalf.map(d => d.low);
      
      const avgFirstHigh = firstHighs.reduce((a, b) => a + b, 0) / firstHighs.length;
      const avgSecondHigh = secondHighs.reduce((a, b) => a + b, 0) / secondHighs.length;
      const avgFirstLow = firstLows.reduce((a, b) => a + b, 0) / firstLows.length;
      const avgSecondLow = secondLows.reduce((a, b) => a + b, 0) / secondLows.length;
      
      // Both trendlines rising
      const upperRising = avgSecondHigh > avgFirstHigh;
      const lowerRising = avgSecondLow > avgFirstLow;
      
      // Lines converging
      const firstRange = avgFirstHigh - avgFirstLow;
      const secondRange = avgSecondHigh - avgSecondLow;
      const converging = secondRange < firstRange * 0.85;
      
      // Breakdown below lower trendline
      const lastClose = closes[closes.length - 1];
      const detected = upperRising && lowerRising && converging && lastClose < avgSecondLow * 0.998;
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: avgFirstHigh, type: 'high', label: 'Upper Trend Start' },
          { index: window.length - 1, price: avgSecondHigh, type: 'high', label: 'Upper Trend End' },
          { index: 0, price: avgFirstLow, type: 'low', label: 'Lower Trend Start' },
          { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
        ] : []
      };
    },
    displayName: 'Rising Wedge'
  },
  // Falling Wedge (bullish)
  'falling-wedge': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const firstHalf = window.slice(0, Math.floor(window.length / 2));
      const secondHalf = window.slice(Math.floor(window.length / 2));
      
      const firstHighs = firstHalf.map(d => d.high);
      const secondHighs = secondHalf.map(d => d.high);
      const firstLows = firstHalf.map(d => d.low);
      const secondLows = secondHalf.map(d => d.low);
      
      const avgFirstHigh = firstHighs.reduce((a, b) => a + b, 0) / firstHighs.length;
      const avgSecondHigh = secondHighs.reduce((a, b) => a + b, 0) / secondHighs.length;
      const avgFirstLow = firstLows.reduce((a, b) => a + b, 0) / firstLows.length;
      const avgSecondLow = secondLows.reduce((a, b) => a + b, 0) / secondLows.length;
      
      // Both trendlines falling
      const upperFalling = avgSecondHigh < avgFirstHigh;
      const lowerFalling = avgSecondLow < avgFirstLow;
      
      // Lines converging
      const firstRange = avgFirstHigh - avgFirstLow;
      const secondRange = avgSecondHigh - avgSecondLow;
      const converging = secondRange < firstRange * 0.85;
      
      // Breakout above upper trendline
      const lastClose = closes[closes.length - 1];
      const detected = upperFalling && lowerFalling && converging && lastClose > avgSecondHigh * 1.002;
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: avgFirstHigh, type: 'high', label: 'Upper Trend Start' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' },
          { index: 0, price: avgFirstLow, type: 'low', label: 'Lower Trend Start' },
          { index: window.length - 1, price: avgSecondLow, type: 'low', label: 'Lower Trend End' }
        ] : []
      };
    },
    displayName: 'Falling Wedge'
  },
};

// In-memory cache for scan results (persists within edge function instance)
// Results cache - keyed by scan parameters
const scanCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache for fast assets
const CACHE_TTL_MS_SLOW = 5 * 60 * 1000; // 5 minute cache for commodities

// Per-symbol data cache to avoid re-fetching
const symbolDataCache = new Map<string, { bars: any[]; timestamp: number }>();
const SYMBOL_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minute symbol cache

// =============================================================================
// SYMBOL MAPPING: Yahoo symbols to canonical DB symbols
// =============================================================================
const YAHOO_TO_DB_SYMBOL: Record<string, string> = {
  // Forex
  'EURUSD=X': 'EUR/USD', 'GBPUSD=X': 'GBP/USD', 'USDJPY=X': 'USD/JPY',
  'AUDUSD=X': 'AUD/USD', 'USDCAD=X': 'USD/CAD', 'NZDUSD=X': 'NZD/USD',
  'USDCHF=X': 'USD/CHF', 'EURGBP=X': 'EUR/GBP', 'EURJPY=X': 'EUR/JPY',
  'GBPJPY=X': 'GBP/JPY', 'AUDJPY=X': 'AUD/JPY', 'EURAUD=X': 'EUR/AUD',
  'EURCHF=X': 'EUR/CHF', 'AUDNZD=X': 'AUD/NZD', 'CADJPY=X': 'CAD/JPY',
  'NZDJPY=X': 'NZD/JPY', 'GBPAUD=X': 'GBP/AUD', 'GBPCAD=X': 'GBP/CAD',
  'AUDCAD=X': 'AUD/CAD', 'EURCAD=X': 'EUR/CAD', 'CHFJPY=X': 'CHF/JPY',
  'GBPCHF=X': 'GBP/CHF', 'EURNZD=X': 'EUR/NZD', 'CADCHF=X': 'CAD/CHF',
  'AUDCHF=X': 'AUD/CHF',
  // Crypto
  'BTC-USD': 'BTC/USD', 'ETH-USD': 'ETH/USD', 'SOL-USD': 'SOL/USD',
  'BNB-USD': 'BNB/USD', 'XRP-USD': 'XRP/USD', 'ADA-USD': 'ADA/USD',
  'AVAX-USD': 'AVAX/USD', 'DOGE-USD': 'DOGE/USD', 'LINK-USD': 'LINK/USD',
  'MATIC-USD': 'MATIC/USD', 'DOT-USD': 'DOT/USD', 'SHIB-USD': 'SHIB/USD',
  'LTC-USD': 'LTC/USD', 'UNI-USD': 'UNI/USD', 'ATOM-USD': 'ATOM/USD',
  'XLM-USD': 'XLM/USD', 'NEAR-USD': 'NEAR/USD', 'APT-USD': 'APT/USD',
  'ARB-USD': 'ARB/USD', 'OP-USD': 'OP/USD', 'FIL-USD': 'FIL/USD',
  'INJ-USD': 'INJ/USD', 'AAVE-USD': 'AAVE/USD', 'MKR-USD': 'MKR/USD',
  'SAND-USD': 'SAND/USD',
  // Stocks (same symbol)
  // Commodities (same symbol)
};

function getDbSymbol(yahooSymbol: string): string {
  return YAHOO_TO_DB_SYMBOL[yahooSymbol] || yahooSymbol;
}

/**
 * Load data from historical_prices DB cache first.
 * Returns a map of symbols that were found in DB cache.
 */
async function loadFromDbCache(
  supabase: any,
  symbols: string[],
  timeframe: string,
  minDays: number = 60
): Promise<Map<string, any[]>> {
  const results = new Map<string, any[]>();
  const dbSymbols = symbols.map(s => getDbSymbol(s));
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - minDays);
    
    // Check freshness - only use cache if updated today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('historical_prices')
      .select('symbol, date, open, high, low, close, volume, updated_at')
      .in('symbol', dbSymbols)
      .eq('timeframe', timeframe)
      .gte('date', cutoffDate.toISOString())
      .order('date', { ascending: true });
    
    if (error) {
      console.error('[loadFromDbCache] Query error:', error);
      return results;
    }
    
    if (!data || data.length === 0) {
      console.log('[loadFromDbCache] No cached data found');
      return results;
    }
    
    // Group by symbol
    const symbolGroups = new Map<string, any[]>();
    for (const row of data) {
      if (!symbolGroups.has(row.symbol)) {
        symbolGroups.set(row.symbol, []);
      }
      symbolGroups.get(row.symbol)!.push({
        date: row.date,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume || 0,
      });
    }
    
    // Map back to Yahoo symbols for screener compatibility
    const dbToYahoo = new Map<string, string>();
    for (const [yahoo, db] of Object.entries(YAHOO_TO_DB_SYMBOL)) {
      dbToYahoo.set(db, yahoo);
    }
    
    for (const [dbSymbol, bars] of symbolGroups) {
      // Find original Yahoo symbol
      const yahooSymbol = symbols.find(s => getDbSymbol(s) === dbSymbol);
      if (yahooSymbol && bars.length >= 20) {
        results.set(yahooSymbol, bars);
      }
    }
    
    console.log(`[loadFromDbCache] Found ${results.size}/${symbols.length} symbols in cache`);
    return results;
  } catch (err) {
    console.error('[loadFromDbCache] Error:', err);
    return results;
  }
}

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

// Parallel fetch with concurrency limit and per-symbol caching
// Now with DB-first approach: checks historical_prices table first
async function fetchDataBatchWithDbFallback(
  supabase: any,
  symbols: string[],
  startDate: string,
  endDate: string,
  interval: string = '1d',
  concurrency: number = 10
): Promise<Map<string, any[]>> {
  const results = new Map<string, any[]>();
  const now = Date.now();
  
  // Step 1: Check in-memory cache first (fastest)
  const symbolsAfterMemCache: string[] = [];
  for (const symbol of symbols) {
    const cacheKey = `${symbol}:${interval}`;
    const cached = symbolDataCache.get(cacheKey);
    
    if (cached && now - cached.timestamp < SYMBOL_CACHE_TTL_MS && cached.bars.length > 0) {
      results.set(symbol, cached.bars);
    } else {
      symbolsAfterMemCache.push(symbol);
    }
  }
  
  console.log(`[fetchData] Memory cache: ${results.size} hits, ${symbolsAfterMemCache.length} remaining`);
  
  if (symbolsAfterMemCache.length === 0) {
    return results;
  }
  
  // Step 2: Load from DB cache (fast - no external API)
  const dbCacheResults = await loadFromDbCache(supabase, symbolsAfterMemCache, interval, 90);
  
  // Add DB results and update memory cache
  const symbolsNeedingYahoo: string[] = [];
  for (const symbol of symbolsAfterMemCache) {
    const dbBars = dbCacheResults.get(symbol);
    if (dbBars && dbBars.length >= 20) {
      results.set(symbol, dbBars);
      // Also store in memory cache
      const cacheKey = `${symbol}:${interval}`;
      symbolDataCache.set(cacheKey, { bars: dbBars, timestamp: now });
    } else {
      symbolsNeedingYahoo.push(symbol);
    }
  }
  
  console.log(`[fetchData] DB cache: ${dbCacheResults.size} hits, ${symbolsNeedingYahoo.length} need Yahoo fetch`);
  
  if (symbolsNeedingYahoo.length === 0) {
    return results;
  }
  
  // Step 3: Fetch remaining from Yahoo Finance (slowest)
  for (let i = 0; i < symbolsNeedingYahoo.length; i += concurrency) {
    const batch = symbolsNeedingYahoo.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(symbol => fetchYahooDataSingle(symbol, startDate, endDate, interval))
    );
    
    batchResults.forEach((result, idx) => {
      const symbol = batch[idx];
      if (result.status === 'fulfilled' && result.value.length > 0) {
        results.set(symbol, result.value);
        // Cache the successful fetch
        const cacheKey = `${symbol}:${interval}`;
        symbolDataCache.set(cacheKey, { bars: result.value, timestamp: now });
      }
    });
  }
  
  console.log(`[fetchData] Final total: ${results.size}/${symbols.length} symbols loaded`);
  return results;
}

async function fetchYahooDataSingle(symbol: string, startDate: string, endDate: string, interval: string = '1d'): Promise<any[]> {
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

// Legacy single-fetch function for compatibility
async function fetchYahooData(symbol: string, startDate: string, endDate: string, interval: string = '1d'): Promise<any[]> {
  return fetchYahooDataSingle(symbol, startDate, endDate, interval);
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
  
  // Batch upsert detected patterns for performance
  const now = new Date().toISOString();
  
  // Separate into existing (update) and new (insert) patterns
  const patternsToUpdate: { id: string; pattern: any; key: string }[] = [];
  const patternsToInsert: any[] = [];
  
  for (const pattern of detectedPatterns) {
    const key = `${pattern.instrument}|${pattern.patternId}|${timeframe}`;
    const existing = existingMap.get(key);
    
    if (existing) {
      patternsToUpdate.push({ id: existing.id, pattern, key });
      patternKeys.set(key, new Date(existing.first_detected_at));
    } else {
      patternsToInsert.push({
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
        quality_reasons: pattern.quality?.reasons || [],
        _key: `${pattern.instrument}|${pattern.patternId}|${timeframe}` // For mapping later
      });
    }
  }
  
  // Batch update existing patterns (parallel)
  if (patternsToUpdate.length > 0) {
    const updatePromises = patternsToUpdate.map(({ id, pattern }) => 
      supabase
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
        .eq('id', id)
    );
    await Promise.allSettled(updatePromises);
    console.log(`[persistPatterns] Batch updated ${patternsToUpdate.length} existing patterns`);
  }
  
  // Batch insert new patterns
  if (patternsToInsert.length > 0) {
    const insertData = patternsToInsert.map(({ _key, ...data }) => data);
    const { data: inserted, error: insertError } = await supabase
      .from('live_pattern_detections')
      .insert(insertData)
      .select('instrument, pattern_id, first_detected_at');
    
    if (insertError) {
      console.error('[persistPatterns] Batch insert error:', insertError);
      // Fallback: try one by one for conflict handling
      for (const pattern of patternsToInsert) {
        const { _key, ...data } = pattern;
        const { data: single, error } = await supabase
          .from('live_pattern_detections')
          .upsert(data, { onConflict: 'instrument,pattern_id,timeframe,status' })
          .select('first_detected_at')
          .single();
        
        if (!error && single) {
          patternKeys.set(_key, new Date(single.first_detected_at));
          console.log(`[persistPatterns] New pattern: ${data.instrument} - ${data.pattern_name}`);
        }
      }
    } else if (inserted) {
      console.log(`[persistPatterns] Batch inserted ${inserted.length} new patterns`);
      for (const ins of inserted) {
        const key = `${ins.instrument}|${ins.pattern_id}|${timeframe}`;
        patternKeys.set(key, new Date(ins.first_detected_at));
      }
    }
  }
  
  return patternKeys;
}

/**
 * Fast path: Read pre-cached patterns from live_pattern_detections table
 * This avoids the expensive live scan entirely when fresh data exists
 * 
 * Returns patterns if found, or empty array with isFresh=true if no patterns but cache is fresh
 */
async function readCachedPatternsFromDb(
  supabase: any,
  assetType: string,
  timeframe: string,
  allowedPatterns: string[],
  limit: number,
  maxTickers: number
): Promise<{ patterns: any[]; instrumentsScanned: number; isFresh: boolean } | null> {
  try {
    // Get list of instruments for this tier to count properly
    const instruments = getInstrumentsForTier(assetType, maxTickers);
    
    // Query patterns updated within last 2 hours (more aggressive caching)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: cachedPatterns, error } = await supabase
      .from('live_pattern_detections')
      .select('*')
      .eq('asset_type', assetType)
      .eq('timeframe', timeframe)
      .eq('status', 'active')
      .in('pattern_id', allowedPatterns)
      .in('instrument', instruments)
      .gte('last_confirmed_at', twoHoursAgo)
      .order('last_confirmed_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[scan-live-patterns] DB cache read error:', error);
      return null;
    }
    
    // Check if we have ANY recent activity (even invalidated patterns) to know cache is fresh
    if (!cachedPatterns || cachedPatterns.length === 0) {
      // Check if there's any recent scan activity for this asset type
      const { data: anyRecent } = await supabase
        .from('live_pattern_detections')
        .select('last_confirmed_at')
        .eq('asset_type', assetType)
        .eq('timeframe', timeframe)
        .gte('updated_at', twoHoursAgo)
        .limit(1);
      
      if (anyRecent && anyRecent.length > 0) {
        // Cache is fresh, just no patterns detected - return empty immediately
        console.log('[scan-live-patterns] DB fast path: Cache fresh, no patterns for', assetType);
        return { patterns: [], instrumentsScanned: instruments.length, isFresh: true };
      }
      
      console.log('[scan-live-patterns] No fresh cached patterns in DB, will run live scan');
      return null;
    }
    
    console.log(`[scan-live-patterns] DB fast path: Found ${cachedPatterns.length} cached patterns for ${assetType}`);
    
    // Transform DB rows to API response format
    const patterns = cachedPatterns.map((row: any) => ({
      instrument: row.instrument,
      patternId: row.pattern_id,
      patternName: row.pattern_name,
      direction: row.direction as 'long' | 'short',
      signalTs: row.first_detected_at,
      quality: row.quality_score ? { score: row.quality_score, reasons: row.quality_reasons || [] } : { score: 'B', reasons: [] },
      tradePlan: {
        entryType: 'bar_close',
        entry: row.entry_price,
        stopLoss: row.stop_loss_price,
        takeProfit: row.take_profit_price,
        rr: row.risk_reward_ratio,
      },
      bars: row.bars || [],
      visualSpec: row.visual_spec || {},
      currentPrice: row.current_price,
      prevClose: row.prev_close,
      changePercent: row.change_percent,
    }));
    
    return { patterns, instrumentsScanned: instruments.length, isFresh: true };
  } catch (err) {
    console.error('[scan-live-patterns] DB cache read exception:', err);
    return null;
  }
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
    let maxTickers = parseInt(url.searchParams.get('maxTickers') || '25');
    let allowedPatterns: string[] = BASE_PATTERNS;
    let forceRefresh = false;
    
    // Override with body params if provided
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.limit) limit = parseInt(body.limit);
        if (body.timeframe) timeframe = body.timeframe;
        if (body.assetType) assetType = body.assetType;
        if (body.maxTickers) maxTickers = parseInt(body.maxTickers);
        if (body.allowedPatterns && Array.isArray(body.allowedPatterns)) {
          allowedPatterns = body.allowedPatterns;
        }
        if (body.forceRefresh) forceRefresh = true;
      } catch {
        // Body parsing failed, use query params
      }
    }
    
  // Get instruments based on tier (maxTickers)
    const instruments = getInstrumentsForTier(assetType, maxTickers);
    
    // Get total instruments in the full universe (for accurate UI display)
    const assetMap: Record<string, number> = {
      fx: ALL_INSTRUMENTS.fx.length,
      crypto: ALL_INSTRUMENTS.crypto.length,
      stocks: ALL_INSTRUMENTS.stocks.length,
      commodities: ALL_INSTRUMENTS.commodities.length,
      indices: ALL_INSTRUMENTS.indices.length,
      etfs: ALL_INSTRUMENTS.etfs.length,
    };
    const totalInstrumentsInUniverse = assetMap[assetType] || instruments.length;
    
    // Filter patterns based on tier allowedPatterns
    const patternsToScan = ALL_PATTERNS.filter(p => allowedPatterns.includes(p));
    // Also add extended patterns if allowed
    const extendedPatternsToScan = [...EXTENDED_PATTERNS, ...PREMIUM_PATTERNS].filter(p => allowedPatterns.includes(p));
    const allPatternsToScan = [...patternsToScan, ...extendedPatternsToScan];
    
    // FAST PATH: Try to read from live_pattern_detections DB table first (sub-second)
    // This avoids the slow Yahoo Finance scanning entirely
    if (!forceRefresh) {
      const dbCached = await readCachedPatternsFromDb(
        supabase,
        assetType,
        timeframe,
        allPatternsToScan,
        limit,
        maxTickers
      );
      
      // Return immediately if cache is fresh (even if empty - no patterns detected is valid)
      if (dbCached && dbCached.isFresh) {
        const marketOpen = isMarketOpen(assetType);
        const responseData = {
          success: true,
          patterns: dbCached.patterns,
          scannedAt: new Date().toISOString(),
          instrumentsScanned: dbCached.instrumentsScanned,
          totalInUniverse: totalInstrumentsInUniverse,
          assetType,
          marketOpen,
          marketStatus: marketOpen ? 'open' : 'closed',
          source: 'db_cache', // Indicate this came from fast path
        };
        
        console.log(`[scan-live-patterns] Fast path: Returning ${dbCached.patterns.length} patterns from DB cache (isFresh=${dbCached.isFresh})`);
        return new Response(JSON.stringify(responseData), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          },
        });
      }
    }
    
    // SLOW PATH: Memory cache check before live scanning
    const cacheKey = `${assetType}:${timeframe}:${maxTickers}:${allowedPatterns.sort().join(',')}`;
    const cacheTtl = assetType === 'commodities' ? CACHE_TTL_MS_SLOW : CACHE_TTL_MS;
    const cached = scanCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTtl && !forceRefresh) {
      console.log('[scan-live-patterns] Returning memory cached result');
      return new Response(JSON.stringify(cached.data), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      });
    }
    
    console.log('[scan-live-patterns] Starting parallel scan:', {
      limit,
      timeframe,
      assetType,
      instrumentCount: instruments.length,
      patternCount: allPatternsToScan.length,
      patterns: allPatternsToScan
    });
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // 90 days of data
    
    // DB-FIRST FETCH: Check historical_prices DB cache, then fall back to Yahoo
    // This dramatically speeds up loading for daily charts since data is pre-cached
    const fetchConcurrency = 25;
    const instrumentDataMap = await fetchDataBatchWithDbFallback(
      supabase,
      instruments,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      timeframe,
      fetchConcurrency
    );
    
    console.log(`[scan-live-patterns] Fetched data for ${instrumentDataMap.size}/${instruments.length} instruments`);
    
    const detectedPatterns: any[] = [];
    
    // Process all instruments with their pre-fetched data
    for (const instrument of instruments) {
      const bars = instrumentDataMap.get(instrument);
      if (!bars || bars.length < 20) continue;
      
      for (const patternId of allPatternsToScan) {
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
    
    const responseData = {
      success: true,
      patterns: setups,
      scannedAt: new Date().toISOString(),
      instrumentsScanned: instruments.length,
      totalInUniverse: totalInstrumentsInUniverse,
      assetType,
      marketOpen,
      marketStatus: marketOpen ? 'open' : 'closed',
    };
    
    // Cache the successful response
    scanCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    
    return new Response(JSON.stringify(responseData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
    
  } catch (error) {
    console.error('[scan-live-patterns] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
