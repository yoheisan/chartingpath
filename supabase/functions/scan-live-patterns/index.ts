import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeBracketLevels, BRACKET_LEVELS_VERSION, ROUNDING_CONFIG } from "../_shared/bracketLevels.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base instruments (FREE tier) - 25 per class
const BASE_INSTRUMENTS: Record<string, string[]> = {
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
    'HE=F', 'GF=F', 'ZO=F', 'ZR=F', 'ZL=F',
    'RB=F', 'HO=F', 'BZ=F', 'ALI=F', 'ZN=F'
  ]
};

// Extended instruments (PLUS+ tier) - 50 per class
const EXTENDED_INSTRUMENTS: Record<string, string[]> = {
  fx: [
    'USDZAR=X', 'USDMXN=X', 'USDTRY=X', 'USDSEK=X', 'USDNOK=X',
    'USDDKK=X', 'USDSGD=X', 'USDHKD=X', 'USDPLN=X', 'USDCZK=X',
    'USDHUF=X', 'USDRUB=X', 'USDCNH=X', 'USDINR=X', 'USDTHB=X',
    'EURSEK=X', 'EURNOK=X', 'EURDKK=X', 'EURPLN=X', 'EURCZK=X',
    'EURHUF=X', 'EURTRY=X', 'GBPNZD=X', 'GBPZAR=X', 'AUDSGD=X'
  ],
  crypto: [
    'SUI-USD', 'SEI-USD', 'TIA-USD', 'PEPE-USD', 'WIF-USD',
    'BONK-USD', 'JUP-USD', 'PYTH-USD', 'RENDER-USD', 'FET-USD',
    'TAO-USD', 'AR-USD', 'STX-USD', 'IMX-USD', 'AXS-USD',
    'MANA-USD', 'GALA-USD', 'ENJ-USD', 'ICP-USD', 'VET-USD',
    'ALGO-USD', 'HBAR-USD', 'EGLD-USD', 'FLOW-USD', 'THETA-USD'
  ],
  stocks: [
    'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN',
    'IBM', 'ORCL', 'SAP', 'NOW', 'SNOW',
    'PLTR', 'UBER', 'ABNB', 'SQ', 'PYPL',
    'GS', 'MS', 'C', 'WFC', 'AXP',
    'CVX', 'XOM', 'COP', 'SLB', 'EOG'
  ],
  commodities: [
    'NQ=F', 'ES=F', 'YM=F', 'RTY=F', 'VIX=F',
    'GE=F', 'ZT=F', 'ZF=F', 'ZB=F', 'UB=F',
    'DX=F', '6E=F', '6J=F', '6B=F', '6C=F',
    '6A=F', '6N=F', '6S=F', 'MGC=F', 'SIL=F',
    'MCL=F', 'MNQ=F', 'MES=F', 'M2K=F', 'MYM=F'
  ]
};

// Premium instruments (PRO/TEAM tier) - 75-100 per class
const PREMIUM_INSTRUMENTS: Record<string, string[]> = {
  fx: [
    'USDIDR=X', 'USDPHP=X', 'USDMYR=X', 'USDKRW=X', 'USDTWD=X',
    'USDCLP=X', 'USDCOP=X', 'USDBRL=X', 'USDARS=X', 'USDPEN=X',
    'EURILS=X', 'EURRUB=X', 'EURRON=X', 'EURBGN=X', 'EURHRK=X',
    'GBPMXN=X', 'GBPSGD=X', 'GBPHKD=X', 'AUDHKD=X', 'NZDSGD=X',
    'CADMXN=X', 'CHFSGD=X', 'JPYKRW=X', 'SGDHKD=X', 'ZARJPY=X'
  ],
  crypto: [
    'RNDR-USD', 'AGIX-USD', 'OCEAN-USD', 'WLD-USD', 'ONDO-USD',
    'ETHFI-USD', 'ENA-USD', 'W-USD', 'STRK-USD', 'MANTA-USD',
    'DYM-USD', 'ALT-USD', 'PIXEL-USD', 'PORTAL-USD', 'AEVO-USD',
    'BOME-USD', 'SLERF-USD', 'MEW-USD', 'POPCAT-USD', 'BRETT-USD',
    'TURBO-USD', 'FLOKI-USD', 'LUNC-USD', 'USTC-USD', 'ORDI-USD'
  ],
  stocks: [
    'LLY', 'NVO', 'UNH', 'MRK', 'ABBV',
    'PFE', 'TMO', 'ABT', 'DHR', 'BMY',
    'SCHW', 'BLK', 'SPGI', 'ICE', 'CME',
    'MMC', 'AON', 'TRV', 'PGR', 'AIG',
    'F', 'GM', 'TM', 'RIVN', 'LCID'
  ],
  commodities: [
    'LHc1', 'FCc1', 'LSUc1', 'LCOc1', 'WBSc1',
    'OJc1', 'LBc1', 'CTc1', 'KCc1', 'SBc1',
    'CCc1', 'RRc1', 'RSc1', 'ZMc1', 'ZLc1',
    'OBc1', 'EHc1', 'NGLc1', 'PGc1', 'CLBc1',
    'PAc1', 'PLc1', 'HGc1', 'SIc1', 'GCc1'
  ]
};

// Helper to get instruments for a tier
function getInstrumentsForTier(assetType: string, maxTickers: number): string[] {
  const base = BASE_INSTRUMENTS[assetType] || [];
  const extended = EXTENDED_INSTRUMENTS[assetType] || [];
  const premium = PREMIUM_INSTRUMENTS[assetType] || [];
  
  const all = [...base, ...extended, ...premium];
  return all.slice(0, maxTickers);
}

// Legacy support
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
const scanCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

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

// Parallel fetch with concurrency limit to avoid rate limiting
async function fetchYahooDataBatch(
  symbols: string[],
  startDate: string,
  endDate: string,
  interval: string = '1d',
  concurrency: number = 10
): Promise<Map<string, any[]>> {
  const results = new Map<string, any[]>();
  
  // Process in parallel batches
  for (let i = 0; i < symbols.length; i += concurrency) {
    const batch = symbols.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(symbol => fetchYahooDataSingle(symbol, startDate, endDate, interval))
    );
    
    batchResults.forEach((result, idx) => {
      const symbol = batch[idx];
      if (result.status === 'fulfilled' && result.value.length > 0) {
        results.set(symbol, result.value);
      }
    });
  }
  
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
    let maxTickers = parseInt(url.searchParams.get('maxTickers') || '25');
    let allowedPatterns: string[] = BASE_PATTERNS;
    
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
      } catch {
        // Body parsing failed, use query params
      }
    }
    
    // Get instruments based on tier (maxTickers)
    const instruments = getInstrumentsForTier(assetType, maxTickers);
    
    // Filter patterns based on tier allowedPatterns
    const patternsToScan = ALL_PATTERNS.filter(p => allowedPatterns.includes(p));
    // Also add extended patterns if allowed
    const extendedPatternsToScan = [...EXTENDED_PATTERNS, ...PREMIUM_PATTERNS].filter(p => allowedPatterns.includes(p));
    const allPatternsToScan = [...patternsToScan, ...extendedPatternsToScan];
    
    // Check cache first
    const cacheKey = `${assetType}:${timeframe}:${maxTickers}:${allowedPatterns.sort().join(',')}`;
    const cached = scanCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log('[scan-live-patterns] Returning cached result');
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
    
    // PARALLEL FETCH: Fetch all instrument data concurrently
    const instrumentDataMap = await fetchYahooDataBatch(
      instruments,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      timeframe,
      15 // 15 concurrent requests
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
      assetType,
      marketOpen,
      marketStatus: marketOpen ? 'open' : 'closed',
    };
    
    // Cache the successful response
    scanCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    
    return new Response(JSON.stringify(responseData), {
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
