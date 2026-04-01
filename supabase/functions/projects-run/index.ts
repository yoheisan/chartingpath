import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeBracketLevels, BRACKET_LEVELS_VERSION, ROUNDING_CONFIG } from "../_shared/bracketLevels.ts";
import { 
  estimateCredits as calculateCredits, 
  getTierCaps, 
  validateProjectInputs,
  PLANS_CONFIG,
  type PlanTier,
  type EstimateCreditsInput,
  type ProjectType
} from "../_shared/plans.ts";
import { 
  validateLookback, 
  clampLookback, 
  type Timeframe 
} from "../_shared/dataCoverageContract.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= PREDEFINED UNIVERSES =============
const PREDEFINED_UNIVERSES: Record<string, Record<string, string[]>> = {
  crypto: {
    top10: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'DOGE-USD', 'LINK-USD', 'MATIC-USD'],
    top25: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'DOGE-USD', 'LINK-USD', 'MATIC-USD',
            'DOT-USD', 'LTC-USD', 'UNI-USD', 'ATOM-USD', 'NEAR-USD', 'APT-USD', 'ARB-USD', 'OP-USD', 'FIL-USD', 'VET-USD',
            'INJ-USD', 'IMX-USD', 'SUI-USD', 'SEI-USD', 'TIA-USD'],
  },
  fx: {
    majors: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X', 'EURJPY=X'],
    majors_crosses: ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X',
                     'EURGBP=X', 'EURJPY=X', 'GBPJPY=X', 'AUDJPY=X', 'EURCHF=X', 'GBPCHF=X', 'EURAUD=X',
                     'AUDCAD=X', 'NZDJPY=X', 'CADJPY=X', 'AUDNZD=X', 'EURNZD=X', 'GBPAUD=X'],
  },
  stocks: {
    sp500_leaders: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ',
                    'V', 'PG', 'JPM', 'HD', 'MA', 'CVX', 'MRK', 'ABBV', 'LLY', 'PEP', 'KO', 'AVGO', 'COST', 'WMT', 'MCD'],
    sp500_50: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'UNH', 'JNJ',
               'V', 'PG', 'JPM', 'HD', 'MA', 'CVX', 'MRK', 'ABBV', 'LLY', 'PEP', 
               'KO', 'AVGO', 'COST', 'WMT', 'MCD', 'CSCO', 'TMO', 'ACN', 'ABT', 'DHR',
               'ADBE', 'CRM', 'AMD', 'TXN', 'NKE', 'ORCL', 'PFE', 'COP', 'QCOM', 'NFLX',
               'INTC', 'INTU', 'HON', 'IBM', 'AMGN', 'UPS', 'LOW', 'GE', 'BA', 'CAT'],
  },
};

// ============= ASSET-CLASS THRESHOLD SCALING =============
// FX and crypto have much smaller percentage moves than stocks.
// Detectors use percentage-based thresholds calibrated for equities (~3-10%).
// This scaling factor adjusts those thresholds for other asset classes.
function getAssetThresholdScale(symbol: string): number {
  const s = symbol.toUpperCase();
  // FX pairs: typical daily move 0.3-1%, need ~5x smaller thresholds
  if (s.endsWith('=X') || /^[A-Z]{6}$/.test(s)) return 0.2;
  // Crypto: volatile but still smaller than stock % thresholds for structural patterns
  if (s.endsWith('-USD') || s.includes('BTC') || s.includes('ETH')) return 0.6;
  // Commodities
  if (s.endsWith('=F')) return 0.4;
  // Stocks / indices: default calibration
  return 1.0;
}

// ============= PATTERN PIVOT DATA =============
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

// Pattern registry with detection logic - now returns pivots for chart annotation
// Detectors accept an optional `scale` (0-1) that shrinks %-based thresholds for FX/commodities.
const WEDGE_PATTERN_REGISTRY: Record<string, { direction: 'long' | 'short'; displayName: string; detector: (w: any[], scale?: number) => PatternDetectionResult }> = {
  'donchian-breakout-long': {
    direction: 'long',
    detector: (window, scale = 1) => {
      if (window.length < 10) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const closes = window.map(d => d.close);
      const lookbackHighs = highs.slice(0, -2);
      const recentHigh = Math.max(...lookbackHighs);
      const recentHighIdx = lookbackHighs.indexOf(recentHigh);
      const currentClose = closes[closes.length - 1];
      const prevClose = closes[closes.length - 2];
      const thresh = 1 + 0.001 * scale;
      const detected = currentClose > recentHigh * thresh || prevClose > recentHigh * thresh;
      const pivots: PatternPivot[] = detected ? [
        { index: window.length - 1, price: recentHigh, type: 'high', label: 'Breakout Level' },
        { index: window.length - 1, price: currentClose, type: 'high', label: 'Entry' }
      ] : [];
      return { detected, pivots };
    },
    displayName: 'Donchian Breakout (Long)'
  },
  'donchian-breakout-short': {
    direction: 'short',
    detector: (window, scale = 1) => {
      if (window.length < 10) return { detected: false, pivots: [] };
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      const lookbackLows = lows.slice(0, -2);
      const recentLow = Math.min(...lookbackLows);
      const recentLowIdx = lookbackLows.indexOf(recentLow);
      const currentClose = closes[closes.length - 1];
      const prevClose = closes[closes.length - 2];
      const thresh = 1 - 0.001 * scale;
      const detected = currentClose < recentLow * thresh || prevClose < recentLow * thresh;
      const pivots: PatternPivot[] = detected ? [
        { index: window.length - 1, price: recentLow, type: 'low', label: 'Breakdown Level' },
        { index: window.length - 1, price: currentClose, type: 'low', label: 'Entry' }
      ] : [];
      return { detected, pivots };
    },
    displayName: 'Donchian Breakout (Short)'
  },
  'double-top': {
    direction: 'short',
    detector: (window, scale = 1) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const peaks = findPeaks(highs);
      if (peaks.length < 2) return { detected: false, pivots: [] };
      const lastTwoIdx = peaks.slice(-2);
      const lastTwo = lastTwoIdx.map(i => highs[i]);
      const diff = Math.abs(lastTwo[0] - lastTwo[1]) / lastTwo[0];
      // Bulkowski standard: peaks within 3% tolerance, scaled for asset class
      const detected = diff < 0.03 * scale;
      const pivots: PatternPivot[] = detected ? [
        { index: lastTwoIdx[0], price: lastTwo[0], type: 'high', label: 'Top 1' },
        { index: lastTwoIdx[1], price: lastTwo[1], type: 'high', label: 'Top 2' }
      ] : [];
      return { detected, pivots };
    },
    displayName: 'Double Top (Short)'
  },
  'double-bottom': {
    direction: 'long',
    detector: (window, scale = 1) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const lows = window.map(d => d.low);
      const troughs = findTroughs(lows);
      if (troughs.length < 2) return { detected: false, pivots: [] };
      const lastTwoIdx = troughs.slice(-2);
      const lastTwo = lastTwoIdx.map(i => lows[i]);
      const diff = Math.abs(lastTwo[0] - lastTwo[1]) / lastTwo[0];
      // Bulkowski standard: troughs within 3% tolerance, scaled for asset class
      const detected = diff < 0.03 * scale;
      const pivots: PatternPivot[] = detected ? [
        { index: lastTwoIdx[0], price: lastTwo[0], type: 'low', label: 'Bottom 1' },
        { index: lastTwoIdx[1], price: lastTwo[1], type: 'low', label: 'Bottom 2' }
      ] : [];
      return { detected, pivots };
    },
    displayName: 'Double Bottom (Long)'
  },
  'ascending-triangle': {
    direction: 'long',
    detector: (window, scale = 1) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const lows = window.map(d => d.low);
      const highs = window.map(d => d.high);
      const trend = calculateTrend(lows.slice(-15));
      const highRange = Math.max(...highs.slice(-15)) / Math.min(...highs.slice(-15));
      // Flat resistance (range scaled), rising lows (any positive trend)
      const detected = trend > 0 && highRange < (1 + 0.08 * scale);
      const pivots: PatternPivot[] = [];
      if (detected) {
        const maxHigh = Math.max(...highs.slice(-15));
        const peaks = findPeaks(highs);
        const resistancePeaks = peaks.filter(i => highs[i] >= maxHigh * 0.98);
        resistancePeaks.slice(-3).forEach((idx, i) => {
          pivots.push({ index: idx, price: highs[idx], type: 'high', label: `R${i + 1}` });
        });
        const troughs = findTroughs(lows);
        troughs.slice(-2).forEach((idx, i) => {
          pivots.push({ index: idx, price: lows[idx], type: 'low', label: `S${i + 1}` });
        });
      }
      return { detected, pivots };
    },
    displayName: 'Ascending Triangle (Long)'
  },
  'descending-triangle': {
    direction: 'short',
    detector: (window, scale = 1) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const highTrend = calculateTrend(highs.slice(-15));
      const lowRange = Math.max(...lows.slice(-15)) / Math.min(...lows.slice(-15));
      const detected = highTrend < -0.005 * scale && lowRange < (1 + 0.06 * scale);
      const pivots: PatternPivot[] = [];
      if (detected) {
        const minLow = Math.min(...lows.slice(-15));
        const troughs = findTroughs(lows);
        const supportTroughs = troughs.filter(i => lows[i] <= minLow * 1.02);
        supportTroughs.slice(-3).forEach((idx, i) => {
          pivots.push({ index: idx, price: lows[idx], type: 'low', label: `S${i + 1}` });
        });
        const peaks = findPeaks(highs);
        peaks.slice(-2).forEach((idx, i) => {
          pivots.push({ index: idx, price: highs[idx], type: 'high', label: `R${i + 1}` });
        });
      }
      return { detected, pivots };
    },
    displayName: 'Descending Triangle (Short)'
  },
  // === HEAD & SHOULDERS (Bulkowski-grade) ===
  'head-and-shoulders': {
    direction: 'short',
    detector: (window, scale = 1) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const peaks: { index: number; value: number }[] = [];
      for (let i = 2; i < window.length - 2; i++) {
        if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
            highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
          peaks.push({ index: i, value: highs[i] });
        }
      }
      
      if (peaks.length < 3) return { detected: false, pivots: [] };
      
      let headIdx = 0;
      for (let i = 1; i < peaks.length; i++) {
        if (peaks[i].value > peaks[headIdx].value) headIdx = i;
      }
      
      if (headIdx === 0 || headIdx === peaks.length - 1) return { detected: false, pivots: [] };
      
      const leftShoulder = peaks[headIdx - 1];
      const head = peaks[headIdx];
      const rightShoulder = peaks[headIdx + 1];
      
      const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value);
      const range = head.value - Math.min(leftShoulder.value, rightShoulder.value);
      const symmetryOk = range > 0 && shoulderDiff / range < 0.25;
      const headHigherOk = head.value > leftShoulder.value * (1 + 0.02 * scale) && head.value > rightShoulder.value * (1 + 0.02 * scale);
      
      if (!symmetryOk || !headHigherOk) return { detected: false, pivots: [] };
      
      let neckline = Infinity;
      let necklineIdx = leftShoulder.index;
      for (let i = leftShoulder.index; i <= rightShoulder.index; i++) {
        if (lows[i] < neckline) { neckline = lows[i]; necklineIdx = i; }
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < neckline * (1 - 0.002 * scale);
      
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
    displayName: 'Head & Shoulders (Short)'
  },
  'inverse-head-and-shoulders': {
    direction: 'long',
    detector: (window, scale = 1) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const troughs: { index: number; value: number }[] = [];
      for (let i = 2; i < window.length - 2; i++) {
        if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
            lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
          troughs.push({ index: i, value: lows[i] });
        }
      }
      
      if (troughs.length < 3) return { detected: false, pivots: [] };
      
      let headIdx = 0;
      for (let i = 1; i < troughs.length; i++) {
        if (troughs[i].value < troughs[headIdx].value) headIdx = i;
      }
      
      if (headIdx === 0 || headIdx === troughs.length - 1) return { detected: false, pivots: [] };
      
      const leftShoulder = troughs[headIdx - 1];
      const head = troughs[headIdx];
      const rightShoulder = troughs[headIdx + 1];
      
      const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value);
      const range = Math.max(leftShoulder.value, rightShoulder.value) - head.value;
      const symmetryOk = range > 0 && shoulderDiff / range < 0.25;
      const headLowerOk = head.value < leftShoulder.value * (1 - 0.02 * scale) && head.value < rightShoulder.value * (1 - 0.02 * scale);
      
      if (!symmetryOk || !headLowerOk) return { detected: false, pivots: [] };
      
      let neckline = -Infinity;
      let necklineIdx = leftShoulder.index;
      for (let i = leftShoulder.index; i <= rightShoulder.index; i++) {
        if (highs[i] > neckline) { neckline = highs[i]; necklineIdx = i; }
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > neckline * (1 + 0.002 * scale);
      
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
    displayName: 'Inverse H&S (Long)'
  },
  // === WEDGE PATTERNS (Bulkowski-grade) ===
  'rising-wedge': {
    direction: 'short',
    detector: (window, scale = 1) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      
      const firstHalf = window.slice(0, Math.floor(window.length / 2));
      const secondHalf = window.slice(Math.floor(window.length / 2));
      
      const avgFirstHigh = firstHalf.reduce((sum, d) => sum + d.high, 0) / firstHalf.length;
      const avgSecondHigh = secondHalf.reduce((sum, d) => sum + d.high, 0) / secondHalf.length;
      const avgFirstLow = firstHalf.reduce((sum, d) => sum + d.low, 0) / firstHalf.length;
      const avgSecondLow = secondHalf.reduce((sum, d) => sum + d.low, 0) / secondHalf.length;
      
      const upperRising = avgSecondHigh > avgFirstHigh;
      const lowerRising = avgSecondLow > avgFirstLow;
      const firstRange = avgFirstHigh - avgFirstLow;
      const secondRange = avgSecondHigh - avgSecondLow;
      const converging = firstRange > 0 && secondRange < firstRange * 0.85;
      
      const lastClose = closes[closes.length - 1];
      const detected = upperRising && lowerRising && converging && lastClose < avgSecondLow * (1 - 0.002 * scale);
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: avgFirstHigh, type: 'high', label: 'Upper Start' },
          { index: window.length - 1, price: avgSecondHigh, type: 'high', label: 'Upper End' },
          { index: 0, price: avgFirstLow, type: 'low', label: 'Lower Start' },
          { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
        ] : []
      };
    },
    displayName: 'Rising Wedge (Short)'
  },
  'falling-wedge': {
    direction: 'long',
    detector: (window, scale = 1) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      
      const firstHalf = window.slice(0, Math.floor(window.length / 2));
      const secondHalf = window.slice(Math.floor(window.length / 2));
      
      const avgFirstHigh = firstHalf.reduce((sum, d) => sum + d.high, 0) / firstHalf.length;
      const avgSecondHigh = secondHalf.reduce((sum, d) => sum + d.high, 0) / secondHalf.length;
      const avgFirstLow = firstHalf.reduce((sum, d) => sum + d.low, 0) / firstHalf.length;
      const avgSecondLow = secondHalf.reduce((sum, d) => sum + d.low, 0) / secondHalf.length;
      
      const upperFalling = avgSecondHigh < avgFirstHigh;
      const lowerFalling = avgSecondLow < avgFirstLow;
      const firstRange = avgFirstHigh - avgFirstLow;
      const secondRange = avgSecondHigh - avgSecondLow;
      const converging = firstRange > 0 && secondRange < firstRange * 0.85;
      
      const lastClose = closes[closes.length - 1];
      const detected = upperFalling && lowerFalling && converging && lastClose > avgSecondHigh * (1 + 0.002 * scale);
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: avgFirstHigh, type: 'high', label: 'Upper Start' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' },
          { index: 0, price: avgFirstLow, type: 'low', label: 'Lower Start' },
          { index: window.length - 1, price: avgSecondLow, type: 'low', label: 'Lower End' }
        ] : []
      };
    },
    displayName: 'Falling Wedge (Long)'
  },
  // === TRIPLE TOP/BOTTOM ===
  'triple-top': {
    direction: 'short',
    detector: (window, scale = 1) => {
      if (window.length < 25) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const peaks = findPeaks(highs);
      if (peaks.length < 3) return { detected: false, pivots: [] };
      
      const lastThreeIdx = peaks.slice(-3);
      const lastThree = lastThreeIdx.map(i => highs[i]);
      const maxPeak = Math.max(...lastThree);
      const minPeak = Math.min(...lastThree);
      const tolerance = maxPeak * 0.03 * scale;
      
      const detected = (maxPeak - minPeak) < tolerance;
      const pivots: PatternPivot[] = detected ? lastThreeIdx.map((idx, i) => ({
        index: idx,
        price: lastThree[i],
        type: 'high' as const,
        label: `Top ${i + 1}`
      })) : [];
      
      return { detected, pivots };
    },
    displayName: 'Triple Top (Short)'
  },
  'triple-bottom': {
    direction: 'long',
    detector: (window, scale = 1) => {
      if (window.length < 25) return { detected: false, pivots: [] };
      const lows = window.map(d => d.low);
      const troughs = findTroughs(lows);
      if (troughs.length < 3) return { detected: false, pivots: [] };
      
      const lastThreeIdx = troughs.slice(-3);
      const lastThree = lastThreeIdx.map(i => lows[i]);
      const maxTrough = Math.max(...lastThree);
      const minTrough = Math.min(...lastThree);
      const tolerance = minTrough * 0.03 * scale;
      
      const detected = (maxTrough - minTrough) < tolerance;
      const pivots: PatternPivot[] = detected ? lastThreeIdx.map((idx, i) => ({
        index: idx,
        price: lastThree[i],
        type: 'low' as const,
        label: `Bottom ${i + 1}`
      })) : [];
      
      return { detected, pivots };
    },
    displayName: 'Triple Bottom (Long)'
  },
  // === SYMMETRICAL TRIANGLE ===
  'symmetrical-triangle': {
    direction: 'long', // Default to long, can break either way
    detector: (window, scale = 1) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      
      const highTrend = calculateTrend(highs.slice(-15));
      const lowTrend = calculateTrend(lows.slice(-15));
      
      // Symmetrical: highs descending, lows ascending (converging)
      // Use absolute price-based threshold scaled by average price level
      const avgPrice = (highs[highs.length - 1] + lows[lows.length - 1]) / 2;
      const trendThreshold = avgPrice * 0.00002 * scale; // Normalized for price level
      const detected = highTrend < -trendThreshold && lowTrend > trendThreshold;
      const pivots: PatternPivot[] = [];
      
      if (detected) {
        const peaks = findPeaks(highs);
        const troughs = findTroughs(lows);
        peaks.slice(-2).forEach((idx, i) => {
          pivots.push({ index: idx, price: highs[idx], type: 'high', label: `R${i + 1}` });
        });
        troughs.slice(-2).forEach((idx, i) => {
          pivots.push({ index: idx, price: lows[idx], type: 'low', label: `S${i + 1}` });
        });
      }
      
      return { detected, pivots };
    },
    displayName: 'Symmetrical Triangle'
  },
  // === FLAGS ===
  'bullish-flag': {
    direction: 'long',
    detector: (window, scale = 1) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      
      // Look for strong move followed by consolidation
      const pole = window.slice(0, 8);
      const flag = window.slice(8);
      
      const poleMove = (pole[pole.length - 1].close - pole[0].close) / pole[0].close;
      const flagHighs = flag.map(d => d.high);
      const flagLows = flag.map(d => d.low);
      const flagHighTrend = calculateTrend(flagHighs);
      const flagLowTrend = calculateTrend(flagLows);
      
      // Pole must be strong up, scaled for asset class (3% for stocks, 0.6% for FX)
      const detected = poleMove > 0.03 * scale && flagHighTrend < 0 && flagLowTrend < 0;
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: pole[0].low, type: 'low', label: 'Pole Start' },
          { index: 7, price: pole[pole.length - 1].high, type: 'high', label: 'Pole End' },
          { index: window.length - 1, price: closes[closes.length - 1], type: 'low', label: 'Flag End' }
        ] : []
      };
    },
    displayName: 'Bull Flag (Long)'
  },
  'bearish-flag': {
    direction: 'short',
    detector: (window, scale = 1) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      
      const pole = window.slice(0, 8);
      const flag = window.slice(8);
      
      const poleMove = (pole[pole.length - 1].close - pole[0].close) / pole[0].close;
      const flagHighs = flag.map(d => d.high);
      const flagLows = flag.map(d => d.low);
      const flagHighTrend = calculateTrend(flagHighs);
      const flagLowTrend = calculateTrend(flagLows);
      
      // Pole must be strong down, scaled for asset class (-3% for stocks, -0.6% for FX)
      const detected = poleMove < -0.03 * scale && flagHighTrend > 0 && flagLowTrend > 0;
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: pole[0].high, type: 'high', label: 'Pole Start' },
          { index: 7, price: pole[pole.length - 1].low, type: 'low', label: 'Pole End' },
          { index: window.length - 1, price: closes[closes.length - 1], type: 'high', label: 'Flag End' }
        ] : []
      };
    },
    displayName: 'Bear Flag (Short)'
  },
  // === CUP & HANDLE ===
  'cup-and-handle': {
    direction: 'long',
    detector: (window, scale = 1) => {
      if (window.length < 25) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      
      // Cup: U-shape - starts high, goes down, comes back up
      const firstThird = window.slice(0, 8);
      const middleThird = window.slice(8, 17);
      const lastThird = window.slice(17);
      
      const firstAvgHigh = firstThird.reduce((s, d) => s + d.high, 0) / firstThird.length;
      const middleAvgLow = middleThird.reduce((s, d) => s + d.low, 0) / middleThird.length;
      const lastAvgHigh = lastThird.reduce((s, d) => s + d.high, 0) / lastThird.length;
      
      // Cup rim should be at similar levels, scaled for asset class
      const rimSimilar = Math.abs(firstAvgHigh - lastAvgHigh) / firstAvgHigh < 0.05 * scale;
      // Bottom depth scaled: 10-35% for stocks, 2-7% for FX
      const cupDepth = ((firstAvgHigh + lastAvgHigh) / 2 - middleAvgLow) / firstAvgHigh;
      
      const detected = rimSimilar && cupDepth > 0.10 * scale && cupDepth < 0.35 * scale;
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: firstAvgHigh, type: 'high', label: 'Left Rim' },
          { index: 12, price: middleAvgLow, type: 'low', label: 'Cup Bottom' },
          { index: window.length - 1, price: lastAvgHigh, type: 'high', label: 'Right Rim' }
        ] : []
      };
    },
    displayName: 'Cup & Handle (Long)'
  },
  'inverse-cup-and-handle': {
    direction: 'short',
    detector: (window, scale = 1) => {
      if (window.length < 25) return { detected: false, pivots: [] };
      
      const firstThird = window.slice(0, 8);
      const middleThird = window.slice(8, 17);
      const lastThird = window.slice(17);
      
      const firstAvgLow = firstThird.reduce((s, d) => s + d.low, 0) / firstThird.length;
      const middleAvgHigh = middleThird.reduce((s, d) => s + d.high, 0) / middleThird.length;
      const lastAvgLow = lastThird.reduce((s, d) => s + d.low, 0) / lastThird.length;
      
      // Inverted: lows form the rim, peak in middle, scaled for asset class
      const rimSimilar = Math.abs(firstAvgLow - lastAvgLow) / firstAvgLow < 0.05 * scale;
      const cupHeight = (middleAvgHigh - (firstAvgLow + lastAvgLow) / 2) / firstAvgLow;
      
      const detected = rimSimilar && cupHeight > 0.10 * scale && cupHeight < 0.35 * scale;
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: firstAvgLow, type: 'low', label: 'Left Rim' },
          { index: 12, price: middleAvgHigh, type: 'high', label: 'Cup Top' },
          { index: window.length - 1, price: lastAvgLow, type: 'low', label: 'Right Rim' }
        ] : []
      };
    },
    displayName: 'Inverse Cup & Handle (Short)'
  }
};

// ============= HELPER FUNCTIONS =============
function findPeaks(arr: number[]): number[] {
  const peaks: number[] = [];
  for (let i = 2; i < arr.length - 2; i++) {
    if (arr[i] > arr[i-1] && arr[i] > arr[i-2] && arr[i] > arr[i+1] && arr[i] > arr[i+2]) {
      peaks.push(i);
    }
  }
  return peaks;
}

function findTroughs(arr: number[]): number[] {
  const troughs: number[] = [];
  for (let i = 2; i < arr.length - 2; i++) {
    if (arr[i] < arr[i-1] && arr[i] < arr[i-2] && arr[i] < arr[i+1] && arr[i] < arr[i+2]) {
      troughs.push(i);
    }
  }
  return troughs;
}

function calculateTrend(arr: number[]): number {
  if (arr.length < 2) return 0;
  const n = arr.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += arr[i];
    sumXY += i * arr[i];
    sumX2 += i * i;
  }
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function calculateATR(data: any[], period = 14): number {
  if (data.length < period + 1) return 0;
  let atrSum = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1]?.close || data[i].open;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    atrSum += tr;
  }
  return atrSum / period;
}

function calculateVolatility(data: any[], period = 20): number {
  if (data.length < period) return 0;
  const returns: number[] = [];
  for (let i = data.length - period; i < data.length; i++) {
    const prevClose = data[i - 1]?.close || data[i].open;
    returns.push((data[i].close - prevClose) / prevClose);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252); // Annualized
}

function classifyRegime(data: any[]): { trend: 'UP' | 'DOWN' | 'SIDEWAYS'; volatility: 'HIGH' | 'LOW' | 'MED' } {
  const sma20 = data.slice(-20).reduce((sum, d) => sum + d.close, 0) / 20;
  const sma50 = data.slice(-50).reduce((sum, d) => sum + d.close, 0) / Math.min(50, data.length);
  const currentPrice = data[data.length - 1].close;
  
  let trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  if (currentPrice > sma20 * 1.02 && sma20 > sma50) trend = 'UP';
  else if (currentPrice < sma20 * 0.98 && sma20 < sma50) trend = 'DOWN';
  else trend = 'SIDEWAYS';
  
  const vol = calculateVolatility(data);
  let volatility: 'HIGH' | 'LOW' | 'MED';
  if (vol > 0.30) volatility = 'HIGH';
  else if (vol < 0.15) volatility = 'LOW';
  else volatility = 'MED';
  
  return { trend, volatility };
}

function mapDbTierToPlanTier(dbTier: string | null): PlanTier {
  if (!dbTier) return 'FREE';
  const tierMap: Record<string, PlanTier> = {
    'free': 'FREE',
    'plus': 'PLUS', 
    'pro': 'PRO',
    'team': 'ELITE',
    'elite': 'ELITE',
    'starter': 'FREE',
  };
  return tierMap[dbTier.toLowerCase()] || 'FREE';
}

async function estimateCacheHitRatio(
  supabase: any,
  instruments: string[],
  timeframe: string,
  lookbackYears: number
): Promise<number> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - lookbackYears);
    
    const { count } = await supabase
      .from('historical_prices')
      .select('symbol', { count: 'exact', head: true })
      .in('symbol', instruments)
      .eq('timeframe', timeframe)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());
    
    const cachedCount = count || 0;
    return Math.min(cachedCount / instruments.length, 1.0);
  } catch {
    return 0;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============= DB-FIRST + EODHD FALLBACK DATA FETCHER =============
const MIN_BARS_THRESHOLD = 50;

/** Estimate expected bar count for a date range + interval to gauge coverage quality */
function estimateExpectedBars(startDate: string, endDate: string, interval: string): number {
  const msRange = new Date(endDate).getTime() - new Date(startDate).getTime();
  const dayRange = msRange / (1000 * 60 * 60 * 24);
  switch (interval) {
    case '1h': return dayRange * 24 * 0.7;  // ~70% for weekends/gaps
    case '4h': return dayRange * 6 * 0.7;
    case '8h': return dayRange * 3 * 0.7;
    case '1d': return dayRange * 0.7;
    case '1wk': return dayRange / 7;
    default: return dayRange * 0.7;
  }
}

/** Coverage ratio threshold — if DB has less than 40% of expected bars, treat as insufficient */
const MIN_COVERAGE_RATIO = 0.4;

async function fetchBacktestData(
  supabaseClient: any,
  symbol: string,
  startDate: string,
  endDate: string,
  interval: string
): Promise<any[]> {
  // For 4h/8h, always fetch 1h data and aggregate
  const fetchInterval = (interval === '4h' || interval === '8h') ? '1h' : interval;
  const aggregateSize = interval === '8h' ? 8 : interval === '4h' ? 4 : 0;
  const expectedBars = estimateExpectedBars(startDate, endDate, fetchInterval);

  // ─── Step 1: Try DB (historical_prices, EODHD-seeded) ───
  const dbBars = await fetchFromDB(supabaseClient, symbol, startDate, endDate, fetchInterval);
  const dbCoverage = expectedBars > 0 ? dbBars.length / expectedBars : 0;
  
  if (dbBars.length >= MIN_BARS_THRESHOLD && dbCoverage >= MIN_COVERAGE_RATIO) {
    console.log(`[BacktestData] DB hit: ${symbol} ${fetchInterval} → ${dbBars.length} bars (${(dbCoverage * 100).toFixed(0)}% coverage)`);
    return maybeAggregate(dbBars, aggregateSize, symbol, interval);
  }
  
  console.log(`[BacktestData] DB insufficient: ${symbol} ${fetchInterval} → ${dbBars.length}/${Math.round(expectedBars)} bars (${(dbCoverage * 100).toFixed(0)}% coverage), falling back to EODHD API`);

  // ─── Step 2: Fallback to EODHD API ───
  const eodhBars = await fetchFromEODHD(symbol, startDate, endDate, fetchInterval);
  
  if (eodhBars.length >= MIN_BARS_THRESHOLD) {
    console.log(`[BacktestData] EODHD API: ${symbol} ${fetchInterval} → ${eodhBars.length} bars`);
    return maybeAggregate(eodhBars, aggregateSize, symbol, interval);
  }

  // If EODHD also fails, return whatever we got (could be DB partial data)
  const bestBars = eodhBars.length > dbBars.length ? eodhBars : dbBars;
  console.warn(`[BacktestData] Insufficient data for ${symbol}: DB=${dbBars.length}, EODHD=${eodhBars.length}`);
  return maybeAggregate(bestBars, aggregateSize, symbol, interval);
}

function maybeAggregate(bars: any[], aggregateSize: number, symbol: string, interval: string): any[] {
  if (aggregateSize <= 0 || bars.length === 0) return bars;
  
  const aggregated: any[] = [];
  for (let i = 0; i < bars.length; i += aggregateSize) {
    const chunk = bars.slice(i, i + aggregateSize);
    if (chunk.length === 0) continue;
    aggregated.push({
      timestamp: chunk[0].timestamp,
      date: chunk[0].date,
      open: chunk[0].open,
      high: Math.max(...chunk.map((c: any) => c.high)),
      low: Math.min(...chunk.map((c: any) => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((sum: number, c: any) => sum + c.volume, 0),
    });
  }
  console.log(`[BacktestData] ${symbol}: aggregated ${bars.length} 1h bars → ${aggregated.length} ${interval} bars`);
  return aggregated;
}

async function fetchFromDB(
  supabaseClient: any,
  symbol: string,
  startDate: string,
  endDate: string,
  timeframe: string
): Promise<any[]> {
  try {
    // Supabase PostgREST often caps responses to 1000 rows/request.
    // Page manually to get a fuller local history window for backtests.
    const PAGE_SIZE = 1000;
    const MAX_DB_BARS = 5000;
    const rows: any[] = [];

    for (let from = 0; from < MAX_DB_BARS; from += PAGE_SIZE) {
      const to = Math.min(from + PAGE_SIZE - 1, MAX_DB_BARS - 1);
      const { data, error } = await supabaseClient
        .from('historical_prices')
        .select('date, open, high, low, close, volume')
        .eq('symbol', symbol)
        .eq('timeframe', timeframe)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .range(from, to);

      if (error) {
        console.warn(`[BacktestData] DB query error for ${symbol}:`, error.message);
        return [];
      }

      if (!data || data.length === 0) break;
      rows.push(...data);

      if (data.length < PAGE_SIZE) break;
    }

    return rows.map((r: any) => ({
      timestamp: new Date(r.date).getTime(),
      date: r.date,
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: Number(r.volume ?? 0),
    })).filter((b: any) => b.close > 0);
  } catch (err: any) {
    console.warn(`[BacktestData] DB exception for ${symbol}:`, err?.message);
    return [];
  }
}

async function fetchFromEODHD(
  symbol: string,
  startDate: string,
  endDate: string,
  interval: string
): Promise<any[]> {
  const REQUEST_TIMEOUT_MS = 15000;
  const MAX_RETRIES = 2;
  const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
  
  if (!EODHD_API_KEY) {
    console.warn(`[BacktestData] EODHD_API_KEY not configured, skipping EODHD fallback`);
    return [];
  }

  // Map interval to EODHD period
  const periodMap: Record<string, string> = { '1d': 'd', '1wk': 'w', '1M': 'm', '1h': 'intraday' };
  const period = periodMap[interval] || 'd';
  
  // EODHD symbol format: AAPL.US, BTC-USD.CC, EURUSD.FOREX
  const eodhSymbol = convertToEODHDSymbol(symbol);
  
  let url: string;
  if (period === 'intraday') {
    const fromTs = Math.floor(new Date(`${startDate}T00:00:00Z`).getTime() / 1000);
    const toTs = Math.floor(new Date(`${endDate}T23:59:59Z`).getTime() / 1000);
    url = `https://eodhd.com/api/intraday/${eodhSymbol}?api_token=${EODHD_API_KEY}&interval=1h&from=${fromTs}&to=${toTs}&fmt=json`;
  } else {
    url = `https://eodhd.com/api/eod/${eodhSymbol}?api_token=${EODHD_API_KEY}&from=${startDate}&to=${endDate}&period=${period}&fmt=json`;
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        const shouldRetry = response.status === 429 || response.status >= 500;
        console.warn(`[BacktestData] EODHD HTTP ${response.status} for ${symbol} (attempt ${attempt + 1})`);
        // Consume body to prevent resource leak
        await response.text();
        if (shouldRetry && attempt < MAX_RETRIES) {
          await sleep(700 * (attempt + 1));
          continue;
        }
        return [];
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`[BacktestData] EODHD returned empty data for ${symbol}`);
        return [];
      }

      return data.map((r: any) => ({
        timestamp: new Date(r.date || r.datetime).getTime(),
        date: r.date || r.datetime,
        open: Number(r.open ?? 0),
        high: Number(r.high ?? 0),
        low: Number(r.low ?? 0),
        close: Number(r.close ?? 0),
        volume: Number(r.volume ?? 0),
      })).filter((b: any) => b.close > 0);
    } catch (error: any) {
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      console.warn(`[BacktestData] EODHD ${isTimeout ? 'timeout' : 'error'} for ${symbol} (attempt ${attempt + 1})`);
      if (attempt >= MAX_RETRIES) return [];
      await sleep(700 * (attempt + 1));
    } finally {
      clearTimeout(timeoutId);
    }
  }
  return [];
}

/** Convert platform symbols to EODHD format */
function convertToEODHDSymbol(symbol: string): string {
  const s = symbol.toUpperCase();
  // Crypto: BTC-USD → BTC-USD.CC
  if (s.endsWith('-USD') || s.endsWith('USDT')) return `${s}.CC`;
  // Forex: EURUSD=X → EURUSD.FOREX
  if (s.endsWith('=X')) return `${s.replace('=X', '')}.FOREX`;
  // Commodities: GC=F → GC.COMEX (simplified)
  if (s.endsWith('=F')) return `${s.replace('=F', '')}.COMEX`;
  // Indices: ^GSPC → GSPC.INDX
  if (s.startsWith('^')) return `${s.replace('^', '')}.INDX`;
  // Stocks: default to .US
  return `${s}.US`;
}

// ============= BACKTEST ENGINE =============
interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  instrument: string;
  patternId: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  rMultiple: number;
  isWin: boolean;
  regime: string;
  exitReason: 'tp' | 'sl' | 'time_stop';
  grade: string;
  // Multi-R:R outcomes
  rrOutcomes: {
    rr2: { outcome: 'hit_tp' | 'hit_sl' | 'timeout'; bars: number; rMultiple: number; exitDate: string; exitPrice: number };
    rr3: { outcome: 'hit_tp' | 'hit_sl' | 'timeout'; bars: number; rMultiple: number; exitDate: string; exitPrice: number };
    rr4: { outcome: 'hit_tp' | 'hit_sl' | 'timeout'; bars: number; rMultiple: number; exitDate: string; exitPrice: number };
    rr5: { outcome: 'hit_tp' | 'hit_sl' | 'timeout'; bars: number; rMultiple: number; exitDate: string; exitPrice: number };
  };
}

// Quality scoring function - simplified 9-factor model
function calculatePatternGrade(
  bars: any[],
  entryIndex: number,
  direction: 'long' | 'short'
): { grade: string; score: number } {
  const lookback = Math.min(50, entryIndex);
  const historicalBars = bars.slice(entryIndex - lookback, entryIndex + 1);
  
  if (historicalBars.length < 20) return { grade: 'C', score: 5 };
  
  let score = 0;
  
  // 1. Trend alignment (weight: 2 points)
  const regime = classifyRegime(historicalBars);
  if ((direction === 'long' && regime.trend === 'UP') || 
      (direction === 'short' && regime.trend === 'DOWN')) {
    score += 2;
  } else if (regime.trend === 'SIDEWAYS') {
    score += 1;
  }
  
  // 2. Volume confirmation (weight: 1.5 points)
  const recentVolumes = historicalBars.slice(-5).map(b => b.volume || 0);
  const avgRecentVol = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const olderVolumes = historicalBars.slice(-20, -5).map(b => b.volume || 0);
  const avgOlderVol = olderVolumes.reduce((a, b) => a + b, 0) / Math.max(olderVolumes.length, 1);
  if (avgRecentVol > avgOlderVol * 1.2) score += 1.5;
  else if (avgRecentVol > avgOlderVol * 0.8) score += 0.75;
  
  // 3. ATR/Volatility suitability (weight: 1.5 points)
  const atr = calculateATR(historicalBars, 14);
  const avgPrice = historicalBars[historicalBars.length - 1].close;
  const atrPercent = (atr / avgPrice) * 100;
  if (atrPercent >= 0.5 && atrPercent <= 3) score += 1.5; // Sweet spot
  else if (atrPercent >= 0.3 && atrPercent <= 5) score += 0.75;
  
  // 4. Price action clarity (weight: 1.5 points)
  const closes = historicalBars.slice(-10).map(b => b.close);
  const trend = calculateTrend(closes);
  const trendStrength = Math.abs(trend) / avgPrice;
  if (trendStrength > 0.002) score += 1.5; // Clear directional move
  else if (trendStrength > 0.001) score += 0.75;
  
  // 5. Regime volatility (weight: 1 point)
  if (regime.volatility === 'MED') score += 1;
  else if (regime.volatility === 'LOW') score += 0.5;
  
  // 6. Structure quality - proximity to S/R (weight: 1.5 points)
  const highs = historicalBars.map(b => b.high);
  const lows = historicalBars.map(b => b.low);
  const recentHigh = Math.max(...highs.slice(-10));
  const recentLow = Math.min(...lows.slice(-10));
  const currentPrice = historicalBars[historicalBars.length - 1].close;
  const range = recentHigh - recentLow;
  if (direction === 'long' && currentPrice < recentLow + range * 0.3) score += 1.5;
  else if (direction === 'short' && currentPrice > recentHigh - range * 0.3) score += 1.5;
  else score += 0.5;
  
  // Convert score (0-10) to grade — aligned with shared patternQualityScorer thresholds
  // NOTE: The shared scorer also applies a Repeatability Gate that hard-caps grades
  // for unproven patterns (A: n≥30+WR≥50%+exp>0, B: n≥15+exp>0, else cap at C).
  // The backtester does NOT apply this gate because it IS the proof-generation engine.
  // Grades here represent "form quality" — the live screener applies the full gate.
  let grade = 'F';
  if (score >= 7.5) grade = 'A';
  else if (score >= 6.0) grade = 'B';
  else if (score >= 4.5) grade = 'C';
  else if (score >= 3.0) grade = 'D';
  
  return { grade, score };
}

// Simulate outcome for a specific R:R tier
function simulateRROutcome(
  bars: any[],
  startIndex: number,
  entryPrice: number,
  stopDistance: number,
  rrTier: number,
  isLong: boolean,
  maxBars: number
): { outcome: 'hit_tp' | 'hit_sl' | 'timeout'; bars: number; rMultiple: number; exitDate: string; exitPrice: number } {
  const stopLoss = isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
  const tpDistance = stopDistance * rrTier;
  const takeProfit = isLong ? entryPrice + tpDistance : entryPrice - tpDistance;
  
  for (let j = startIndex + 1; j < Math.min(startIndex + maxBars, bars.length); j++) {
    const bar = bars[j];
    const barsElapsed = j - startIndex;
    
    if (isLong) {
      if (bar.low <= stopLoss) return { outcome: 'hit_sl', bars: barsElapsed, rMultiple: -1, exitDate: bar.date, exitPrice: stopLoss };
      if (bar.high >= takeProfit) return { outcome: 'hit_tp', bars: barsElapsed, rMultiple: rrTier, exitDate: bar.date, exitPrice: takeProfit };
    } else {
      if (bar.high >= stopLoss) return { outcome: 'hit_sl', bars: barsElapsed, rMultiple: -1, exitDate: bar.date, exitPrice: stopLoss };
      if (bar.low <= takeProfit) return { outcome: 'hit_tp', bars: barsElapsed, rMultiple: rrTier, exitDate: bar.date, exitPrice: takeProfit };
    }
  }
  
  // Timeout: calculate actual R-multiple at exit close
  const lastBarIndex = Math.min(startIndex + maxBars - 1, bars.length - 1);
  const exitPrice = bars[lastBarIndex]?.close ?? entryPrice;
  const exitDate = bars[lastBarIndex]?.date ?? bars[bars.length - 1]?.date ?? new Date().toISOString();
  const pnl = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
  const timeoutRMultiple = stopDistance > 0 ? pnl / stopDistance : 0;
  
  return { outcome: 'timeout', bars: Math.min(maxBars, bars.length - startIndex - 1), rMultiple: timeoutRMultiple, exitDate, exitPrice };
}

// ============= EXIT STRATEGY SIMULATORS =============
interface ExitStrategyResult {
  outcome: 'tp' | 'sl' | 'indicator' | 'timeout';
  bars: number;
  rMultiple: number;
  exitDate: string;
  exitPrice: number;
}

/**
 * ATR Trailing Stop: Trail stop at N x ATR below (long) or above (short) price
 */
function simulateATRTrail(
  bars: any[],
  startIndex: number,
  entryPrice: number,
  stopDistance: number,
  atrMultiplier: number,
  isLong: boolean,
  maxBars: number
): ExitStrategyResult {
  const atrPeriod = 14;
  let trailStop = isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
  
  for (let j = startIndex + 1; j < Math.min(startIndex + maxBars, bars.length); j++) {
    const bar = bars[j];
    const barsElapsed = j - startIndex;
    
    // Calculate current ATR
    const atrBars = bars.slice(Math.max(0, j - atrPeriod), j + 1);
    let atr = 0;
    for (let k = 1; k < atrBars.length; k++) {
      const tr = Math.max(
        atrBars[k].high - atrBars[k].low,
        Math.abs(atrBars[k].high - atrBars[k - 1].close),
        Math.abs(atrBars[k].low - atrBars[k - 1].close)
      );
      atr += tr;
    }
    atr = atr / Math.max(atrBars.length - 1, 1);
    
    // Update trailing stop
    const trailDist = atr * atrMultiplier;
    if (isLong) {
      const newStop = bar.close - trailDist;
      trailStop = Math.max(trailStop, newStop);
      if (bar.low <= trailStop) {
        const exitPrice = trailStop;
        const pnl = exitPrice - entryPrice;
        const rMultiple = stopDistance > 0 ? pnl / stopDistance : 0;
        return { outcome: 'sl', bars: barsElapsed, rMultiple, exitDate: bar.date, exitPrice };
      }
    } else {
      const newStop = bar.close + trailDist;
      trailStop = Math.min(trailStop, newStop);
      if (bar.high >= trailStop) {
        const exitPrice = trailStop;
        const pnl = entryPrice - exitPrice;
        const rMultiple = stopDistance > 0 ? pnl / stopDistance : 0;
        return { outcome: 'sl', bars: barsElapsed, rMultiple, exitDate: bar.date, exitPrice };
      }
    }
  }
  
  // Timeout
  const lastIdx = Math.min(startIndex + maxBars - 1, bars.length - 1);
  const exitPrice = bars[lastIdx]?.close ?? entryPrice;
  const pnl = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
  return { outcome: 'timeout', bars: maxBars, rMultiple: stopDistance > 0 ? pnl / stopDistance : 0, exitDate: bars[lastIdx]?.date, exitPrice };
}

/**
 * Partial Scale-Out: Exit half at first target, trail remainder
 */
function simulatePartialScaleOut(
  bars: any[],
  startIndex: number,
  entryPrice: number,
  stopDistance: number,
  firstTargetR: number,
  finalTargetR: number,
  isLong: boolean,
  maxBars: number
): ExitStrategyResult {
  const stopLoss = isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
  const firstTP = isLong ? entryPrice + stopDistance * firstTargetR : entryPrice - stopDistance * firstTargetR;
  const finalTP = isLong ? entryPrice + stopDistance * finalTargetR : entryPrice - stopDistance * finalTargetR;
  
  let firstHit = false;
  let breakEvenStop = stopLoss;
  let totalR = 0;
  
  for (let j = startIndex + 1; j < Math.min(startIndex + maxBars, bars.length); j++) {
    const bar = bars[j];
    const barsElapsed = j - startIndex;
    
    // Check stop first
    if (isLong) {
      if (bar.low <= (firstHit ? breakEvenStop : stopLoss)) {
        const exitPrice = firstHit ? breakEvenStop : stopLoss;
        // If first target hit, we've banked firstTargetR/2, and lose remaining half
        const secondHalfR = firstHit ? 0 : -1;
        totalR = firstHit ? (firstTargetR * 0.5 + secondHalfR * 0.5) : -1;
        return { outcome: 'sl', bars: barsElapsed, rMultiple: totalR, exitDate: bar.date, exitPrice };
      }
      
      // Check first target
      if (!firstHit && bar.high >= firstTP) {
        firstHit = true;
        breakEvenStop = entryPrice; // Move stop to breakeven for remainder
      }
      
      // Check final target (only if first hit)
      if (firstHit && bar.high >= finalTP) {
        totalR = (firstTargetR * 0.5) + (finalTargetR * 0.5);
        return { outcome: 'tp', bars: barsElapsed, rMultiple: totalR, exitDate: bar.date, exitPrice: finalTP };
      }
    } else {
      if (bar.high >= (firstHit ? breakEvenStop : stopLoss)) {
        const exitPrice = firstHit ? breakEvenStop : stopLoss;
        const secondHalfR = firstHit ? 0 : -1;
        totalR = firstHit ? (firstTargetR * 0.5 + secondHalfR * 0.5) : -1;
        return { outcome: 'sl', bars: barsElapsed, rMultiple: totalR, exitDate: bar.date, exitPrice };
      }
      
      if (!firstHit && bar.low <= firstTP) {
        firstHit = true;
        breakEvenStop = entryPrice;
      }
      
      if (firstHit && bar.low <= finalTP) {
        totalR = (firstTargetR * 0.5) + (finalTargetR * 0.5);
        return { outcome: 'tp', bars: barsElapsed, rMultiple: totalR, exitDate: bar.date, exitPrice: finalTP };
      }
    }
  }
  
  // Timeout
  const lastIdx = Math.min(startIndex + maxBars - 1, bars.length - 1);
  const exitPrice = bars[lastIdx]?.close ?? entryPrice;
  const pnl = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
  const remainderR = stopDistance > 0 ? pnl / stopDistance : 0;
  totalR = firstHit ? (firstTargetR * 0.5 + remainderR * 0.5) : remainderR;
  return { outcome: 'timeout', bars: maxBars, rMultiple: totalR, exitDate: bars[lastIdx]?.date, exitPrice };
}

/**
 * RSI Exhaustion Exit: Exit when RSI reaches overbought/oversold
 */
function simulateRSIExit(
  bars: any[],
  startIndex: number,
  entryPrice: number,
  stopDistance: number,
  isLong: boolean,
  maxBars: number,
  rsiPeriod: number = 14,
  rsiThreshold: number = 70
): ExitStrategyResult {
  const stopLoss = isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
  
  // Calculate RSI
  const calcRSI = (closes: number[]): number => {
    if (closes.length < rsiPeriod + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = closes.length - rsiPeriod; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / rsiPeriod;
    const avgLoss = losses / rsiPeriod;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };
  
  for (let j = startIndex + 1; j < Math.min(startIndex + maxBars, bars.length); j++) {
    const bar = bars[j];
    const barsElapsed = j - startIndex;
    
    // Check stop
    if (isLong && bar.low <= stopLoss) {
      return { outcome: 'sl', bars: barsElapsed, rMultiple: -1, exitDate: bar.date, exitPrice: stopLoss };
    }
    if (!isLong && bar.high >= stopLoss) {
      return { outcome: 'sl', bars: barsElapsed, rMultiple: -1, exitDate: bar.date, exitPrice: stopLoss };
    }
    
    // Calculate RSI and check exit condition
    const closes = bars.slice(Math.max(0, j - rsiPeriod - 5), j + 1).map(b => b.close);
    const rsi = calcRSI(closes);
    
    if (isLong && rsi >= rsiThreshold) {
      const exitPrice = bar.close;
      const pnl = exitPrice - entryPrice;
      const rMultiple = stopDistance > 0 ? pnl / stopDistance : 0;
      return { outcome: 'indicator', bars: barsElapsed, rMultiple, exitDate: bar.date, exitPrice };
    }
    if (!isLong && rsi <= (100 - rsiThreshold)) {
      const exitPrice = bar.close;
      const pnl = entryPrice - exitPrice;
      const rMultiple = stopDistance > 0 ? pnl / stopDistance : 0;
      return { outcome: 'indicator', bars: barsElapsed, rMultiple, exitDate: bar.date, exitPrice };
    }
  }
  
  // Timeout
  const lastIdx = Math.min(startIndex + maxBars - 1, bars.length - 1);
  const exitPrice = bars[lastIdx]?.close ?? entryPrice;
  const pnl = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
  return { outcome: 'timeout', bars: maxBars, rMultiple: stopDistance > 0 ? pnl / stopDistance : 0, exitDate: bars[lastIdx]?.date, exitPrice };
}

/**
 * Fibonacci Extension Exit: Exit at 1.618 or 2.618 extension
 */
function simulateFibExit(
  bars: any[],
  startIndex: number,
  entryPrice: number,
  stopDistance: number,
  fibLevel: number,
  isLong: boolean,
  maxBars: number
): ExitStrategyResult {
  const stopLoss = isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
  const fibTarget = isLong 
    ? entryPrice + stopDistance * fibLevel 
    : entryPrice - stopDistance * fibLevel;
  
  for (let j = startIndex + 1; j < Math.min(startIndex + maxBars, bars.length); j++) {
    const bar = bars[j];
    const barsElapsed = j - startIndex;
    
    // Check stop
    if (isLong && bar.low <= stopLoss) {
      return { outcome: 'sl', bars: barsElapsed, rMultiple: -1, exitDate: bar.date, exitPrice: stopLoss };
    }
    if (!isLong && bar.high >= stopLoss) {
      return { outcome: 'sl', bars: barsElapsed, rMultiple: -1, exitDate: bar.date, exitPrice: stopLoss };
    }
    
    // Check fib target
    if (isLong && bar.high >= fibTarget) {
      return { outcome: 'tp', bars: barsElapsed, rMultiple: fibLevel, exitDate: bar.date, exitPrice: fibTarget };
    }
    if (!isLong && bar.low <= fibTarget) {
      return { outcome: 'tp', bars: barsElapsed, rMultiple: fibLevel, exitDate: bar.date, exitPrice: fibTarget };
    }
  }
  
  // Timeout
  const lastIdx = Math.min(startIndex + maxBars - 1, bars.length - 1);
  const exitPrice = bars[lastIdx]?.close ?? entryPrice;
  const pnl = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
  return { outcome: 'timeout', bars: maxBars, rMultiple: stopDistance > 0 ? pnl / stopDistance : 0, exitDate: bars[lastIdx]?.date, exitPrice };
}

/**
 * MACD Crossover Exit: Exit when MACD crosses against position
 */
function simulateMACDExit(
  bars: any[],
  startIndex: number,
  entryPrice: number,
  stopDistance: number,
  isLong: boolean,
  maxBars: number
): ExitStrategyResult {
  const stopLoss = isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
  const fastPeriod = 12, slowPeriod = 26, signalPeriod = 9;
  
  // Calculate EMA
  const calcEMA = (prices: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const emas: number[] = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
      emas.push(prices[i] * k + emas[i - 1] * (1 - k));
    }
    return emas;
  };
  
  for (let j = startIndex + 1; j < Math.min(startIndex + maxBars, bars.length); j++) {
    const bar = bars[j];
    const barsElapsed = j - startIndex;
    
    // Check stop
    if (isLong && bar.low <= stopLoss) {
      return { outcome: 'sl', bars: barsElapsed, rMultiple: -1, exitDate: bar.date, exitPrice: stopLoss };
    }
    if (!isLong && bar.high >= stopLoss) {
      return { outcome: 'sl', bars: barsElapsed, rMultiple: -1, exitDate: bar.date, exitPrice: stopLoss };
    }
    
    // Need enough bars for MACD calculation
    if (j < slowPeriod + signalPeriod) continue;
    
    const closes = bars.slice(0, j + 1).map(b => b.close);
    const fastEMA = calcEMA(closes, fastPeriod);
    const slowEMA = calcEMA(closes, slowPeriod);
    const macdLine = fastEMA.map((f, i) => f - slowEMA[i]);
    const signalLine = calcEMA(macdLine.slice(slowPeriod), signalPeriod);
    
    const currentMACD = macdLine[macdLine.length - 1];
    const prevMACD = macdLine[macdLine.length - 2];
    const currentSignal = signalLine[signalLine.length - 1];
    const prevSignal = signalLine[signalLine.length - 2];
    
    // Check for crossover against position
    const bullishCross = prevMACD <= prevSignal && currentMACD > currentSignal;
    const bearishCross = prevMACD >= prevSignal && currentMACD < currentSignal;
    
    if (isLong && bearishCross) {
      const exitPrice = bar.close;
      const pnl = exitPrice - entryPrice;
      const rMultiple = stopDistance > 0 ? pnl / stopDistance : 0;
      return { outcome: 'indicator', bars: barsElapsed, rMultiple, exitDate: bar.date, exitPrice };
    }
    if (!isLong && bullishCross) {
      const exitPrice = bar.close;
      const pnl = entryPrice - exitPrice;
      const rMultiple = stopDistance > 0 ? pnl / stopDistance : 0;
      return { outcome: 'indicator', bars: barsElapsed, rMultiple, exitDate: bar.date, exitPrice };
    }
  }
  
  // Timeout
  const lastIdx = Math.min(startIndex + maxBars - 1, bars.length - 1);
  const exitPrice = bars[lastIdx]?.close ?? entryPrice;
  const pnl = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
  return { outcome: 'timeout', bars: maxBars, rMultiple: stopDistance > 0 ? pnl / stopDistance : 0, exitDate: bars[lastIdx]?.date, exitPrice };
}

// Master function to run all exit strategies on a trade
interface ExitStrategyDefinition {
  id: string;
  name: string;
  description: string;
  simulate: (bars: any[], startIndex: number, entryPrice: number, stopDistance: number, isLong: boolean, maxBars: number) => ExitStrategyResult;
}

const EXIT_STRATEGIES: ExitStrategyDefinition[] = [
  {
    id: 'fixed_2r',
    name: 'Fixed 1:2',
    description: 'Fixed 2R target',
    simulate: (bars, start, entry, stop, isLong, max) => {
      const result = simulateRROutcome(bars, start, entry, stop, 2, isLong, max);
      return { ...result, outcome: result.outcome === 'hit_tp' ? 'tp' : result.outcome === 'hit_sl' ? 'sl' : 'timeout' };
    }
  },
  {
    id: 'fixed_3r',
    name: 'Fixed 1:3',
    description: 'Fixed 3R target',
    simulate: (bars, start, entry, stop, isLong, max) => {
      const result = simulateRROutcome(bars, start, entry, stop, 3, isLong, max);
      return { ...result, outcome: result.outcome === 'hit_tp' ? 'tp' : result.outcome === 'hit_sl' ? 'sl' : 'timeout' };
    }
  },
  {
    id: 'atr_trail_2x',
    name: 'ATR Trail 2×',
    description: '2× ATR trailing stop',
    simulate: (bars, start, entry, stop, isLong, max) => simulateATRTrail(bars, start, entry, stop, 2, isLong, max)
  },
  {
    id: 'atr_trail_3x',
    name: 'ATR Trail 3×',
    description: '3× ATR trailing stop',
    simulate: (bars, start, entry, stop, isLong, max) => simulateATRTrail(bars, start, entry, stop, 3, isLong, max)
  },
  {
    id: 'scale_out_2_4',
    name: 'Scale-Out 2R/4R',
    description: '50% at 2R, 50% at 4R',
    simulate: (bars, start, entry, stop, isLong, max) => simulatePartialScaleOut(bars, start, entry, stop, 2, 4, isLong, max)
  },
  {
    id: 'scale_out_1_3',
    name: 'Scale-Out 1R/3R',
    description: '50% at 1R, 50% at 3R',
    simulate: (bars, start, entry, stop, isLong, max) => simulatePartialScaleOut(bars, start, entry, stop, 1, 3, isLong, max)
  },
  {
    id: 'rsi_70',
    name: 'RSI Exhaustion 70',
    description: 'Exit at RSI 70/30',
    simulate: (bars, start, entry, stop, isLong, max) => simulateRSIExit(bars, start, entry, stop, isLong, max, 14, 70)
  },
  {
    id: 'rsi_80',
    name: 'RSI Exhaustion 80',
    description: 'Exit at RSI 80/20',
    simulate: (bars, start, entry, stop, isLong, max) => simulateRSIExit(bars, start, entry, stop, isLong, max, 14, 80)
  },
  {
    id: 'fib_1618',
    name: 'Fib 1.618',
    description: '1.618 extension target',
    simulate: (bars, start, entry, stop, isLong, max) => simulateFibExit(bars, start, entry, stop, 1.618, isLong, max)
  },
  {
    id: 'fib_2618',
    name: 'Fib 2.618',
    description: '2.618 extension target',
    simulate: (bars, start, entry, stop, isLong, max) => simulateFibExit(bars, start, entry, stop, 2.618, isLong, max)
  },
  {
    id: 'macd_cross',
    name: 'MACD Crossover',
    description: 'Exit on MACD signal cross',
    simulate: (bars, start, entry, stop, isLong, max) => simulateMACDExit(bars, start, entry, stop, isLong, max)
  }
];

// Store exit outcomes per trade
interface TradeExitOutcomes {
  [strategyId: string]: ExitStrategyResult;
}

// Extended BacktestTrade with exit strategy outcomes (add to existing interface)
interface BacktestTradeWithExits extends BacktestTrade {
  exitOutcomes?: TradeExitOutcomes;
  entryBarIndex?: number; // For exit strategy simulation
}

// Run all exit strategies for a trade and return outcomes
function computeExitOutcomes(
  bars: any[],
  startIndex: number,
  entryPrice: number,
  stopDistance: number,
  isLong: boolean,
  maxBars: number
): TradeExitOutcomes {
  const outcomes: TradeExitOutcomes = {};
  for (const strategy of EXIT_STRATEGIES) {
    outcomes[strategy.id] = strategy.simulate(bars, startIndex, entryPrice, stopDistance, isLong, maxBars);
  }
  return outcomes;
}

interface PatternBacktestResult {
  trades: BacktestTrade[];
  detectedCount: number;
  gradeFilteredCount: number;
  overlapSkippedCount: number;
}

function runPatternBacktest(
  bars: any[],
  patternId: string,
  pattern: { direction: 'long' | 'short'; displayName: string; detector: (w: any[], scale?: number) => PatternDetectionResult },
  instrument: string,
  gradeFilter: string[] = ['A', 'B', 'C', 'D', 'F']
): PatternBacktestResult {
  const trades: BacktestTrade[] = [];
  const lookback = 20;
  const maxBarsInTrade = 50;
  const scale = getAssetThresholdScale(instrument);
  let detectedCount = 0;
  let gradeFilteredCount = 0;
  let overlapSkippedCount = 0;
  let lastTradeEndIndex = -1;
  
  for (let i = lookback; i < bars.length - maxBarsInTrade; i++) {
    const window = bars.slice(i - lookback, i + 1);
    const detectionResult = pattern.detector(window, scale);
    
    if (!detectionResult.detected) continue;
    detectedCount++;
    
    // Skip if overlapping with previous trade
    if (i <= lastTradeEndIndex) {
      overlapSkippedCount++;
      continue;
    }
    
    const entryBar = bars[i];
    const entryPrice = entryBar.close;
    const atr = calculateATR(bars.slice(0, i + 1), 14);
    
    // Calculate grade and apply filter
    const { grade, score } = calculatePatternGrade(bars, i, pattern.direction);
    if (!gradeFilter.includes(grade)) {
      gradeFilteredCount++;
      continue;
    }
    
    const stopDistance = atr * 2;
    const isLong = pattern.direction === 'long';
    
    // Compute outcomes for all R:R tiers
    const rrOutcomes = {
      rr2: simulateRROutcome(bars, i, entryPrice, stopDistance, 2, isLong, maxBarsInTrade),
      rr3: simulateRROutcome(bars, i, entryPrice, stopDistance, 3, isLong, maxBarsInTrade),
      rr4: simulateRROutcome(bars, i, entryPrice, stopDistance, 4, isLong, maxBarsInTrade),
      rr5: simulateRROutcome(bars, i, entryPrice, stopDistance, 5, isLong, maxBarsInTrade),
    };
    
    // Compute exit strategy outcomes
    const exitOutcomes = computeExitOutcomes(bars, i, entryPrice, stopDistance, isLong, maxBarsInTrade);
    
    // Use RR2 as the primary result for backward compatibility (and guaranteed consistency)
    const primary = rrOutcomes.rr2;
    const exitDate = primary.exitDate;
    const exitPrice = primary.exitPrice;
    const exitReason: 'tp' | 'sl' | 'time_stop' =
      primary.outcome === 'hit_tp' ? 'tp' : primary.outcome === 'hit_sl' ? 'sl' : 'time_stop';
    const rMultiple = primary.rMultiple;
    const pnl = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
    
    const regime = classifyRegime(bars.slice(0, i + 1));
    
    trades.push({
      entryDate: entryBar.date,
      exitDate,
      instrument,
      patternId,
      direction: pattern.direction,
      entryPrice,
      exitPrice,
      rMultiple,
      isWin: pnl > 0,
      regime: `${regime.trend}_${regime.volatility}`,
      exitReason,
      grade,
      rrOutcomes,
      exitOutcomes,
      entryBarIndex: i,
    } as any);
    
    // Skip ahead to avoid overlapping trades
    lastTradeEndIndex = i + 5;
    i += 5;
  }
  
  return { trades, detectedCount, gradeFilteredCount, overlapSkippedCount };
}

// (Portfolio Simulation Engine removed — deprecated feature)

// ============= MAIN HANDLER =============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // ============= ESTIMATE ENDPOINT =============
    if (path === 'estimate' && req.method === 'POST') {
      const body = await req.json();
      const { 
        projectType = 'pattern_lab', 
        assetClass, 
        universe, 
        patterns = [], 
        timeframe = '1d', 
        lookbackYears = 1, 
        instruments: directInstruments,
        holdings = [],
        rebalancePerYear = 4
      } = body;
      
      // Resolve instruments - check for direct instruments first, then holdings, then predefined universes
      let instruments: string[] = [];
      if (directInstruments && directInstruments.length > 0) {
        instruments = directInstruments;
      } else if (holdings && holdings.length > 0) {
        instruments = holdings.map((h: any) => h.symbol).filter(Boolean);
      } else if (assetClass && universe && PREDEFINED_UNIVERSES[assetClass]?.[universe]) {
        instruments = PREDEFINED_UNIVERSES[assetClass][universe];
      }
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const cacheHitRatio = await estimateCacheHitRatio(supabase, instruments, timeframe, lookbackYears);
      
      const estimateInput: EstimateCreditsInput = {
        projectType: projectType as ProjectType,
        instrumentCount: instruments.length,
        patternCount: patterns.length || 1,
        lookbackYears,
        timeframe,
        cacheHitRatio,
        rebalancePerYear
      };
      const creditResult = calculateCredits(estimateInput);
      
      // Auth check
      const authHeader = req.headers.get('Authorization');
      let capInfo = { 
        allowed: true, 
        reason: null as string | null, 
        errors: [] as string[],
        creditsBalance: 25, 
        dailyRuns: 0,
        dailyRunCap: 1,
        tier: 'FREE' as PlanTier
      };
      
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          // Check if user is admin - admins bypass all caps
          const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
          
          if (isAdmin === true) {
            console.log(`Admin user ${user.id} - bypassing all caps`);
            capInfo.allowed = true;
            capInfo.tier = 'ELITE';
            capInfo.creditsBalance = 999999;
            capInfo.dailyRunCap = 999999;
            capInfo.dailyRuns = 0;
          } else {
            // Non-admin: Get or create usage_credits for user
            let { data: credits } = await supabase
              .from('usage_credits')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            // If no credits record exists, create one with FREE tier defaults
            if (!credits) {
              console.log(`Creating usage_credits for user ${user.id}`);
              const { data: newCredits, error: createError } = await supabase
                .from('usage_credits')
                .insert({
                  user_id: user.id,
                  plan_tier: 'free',
                  credits_balance: 50, // FREE tier monthly credits (matches PLANS_CONFIG)
                })
                .select()
                .single();
              
              if (createError) {
                console.error('Failed to create usage_credits:', createError);
              } else {
                credits = newCredits;
              }
            }
            
            if (credits) {
              const tier = mapDbTierToPlanTier(credits.plan_tier);
              const tierCaps = getTierCaps(tier);
              capInfo.tier = tier;
              capInfo.creditsBalance = credits.credits_balance;
              capInfo.dailyRunCap = tierCaps.dailyRunCap;
              
              if (credits.credits_balance < creditResult.creditsEstimated) {
                capInfo.allowed = false;
                capInfo.reason = 'insufficient_credits';
                capInfo.errors.push(`Need ${creditResult.creditsEstimated} credits, have ${credits.credits_balance}`);
              }
              
              const validation = validateProjectInputs(tier, projectType as ProjectType, {
                instrumentCount: instruments.length,
                lookbackYears,
                patternCount: patterns.length,
                timeframe
              });
              
              if (!validation.valid) {
                capInfo.allowed = false;
                capInfo.reason = 'tier_cap_exceeded';
                capInfo.errors.push(...validation.errors);
              }
              
              const today = new Date().toISOString().split('T')[0];
              const { count: dailyRunCount } = await supabase
                .from('project_runs')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'succeeded')
                .gte('created_at', `${today}T00:00:00Z`)
                .lte('created_at', `${today}T23:59:59Z`);
              
              capInfo.dailyRuns = dailyRunCount || 0;
              if ((dailyRunCount || 0) >= tierCaps.dailyRunCap) {
                capInfo.allowed = false;
                capInfo.reason = 'daily_cap_reached';
                capInfo.errors.push(`Daily run limit (${tierCaps.dailyRunCap}) reached`);
              }
            }
          }
        }
      }
      
      return new Response(JSON.stringify({
        creditsEstimated: creditResult.creditsEstimated,
        breakdown: creditResult.breakdown,
        cacheHitRatio: creditResult.cacheHitRatio,
        instrumentCount: instruments.length,
        patternCount: patterns.length,
        instruments,
        ...capInfo,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // ============= RUN ENDPOINT =============
    if (path === 'run' && req.method === 'POST') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const body = await req.json();
      const { projectType, inputs } = body;
      
      console.log(`Starting ${projectType} run for user ${user.id}`);
      
      // Validate project type
      const validTypes: ProjectType[] = ['pattern_lab'];
      if (!validTypes.includes(projectType)) {
        return new Response(JSON.stringify({ error: 'Unsupported project type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Extract inputs
      const { 
        assetClass, 
        universe, 
        patterns = [], 
        timeframe = '1d', 
        lookbackYears = 1,
        riskPerTrade = 1,
        instruments: directInstruments,
        instrumentPatternMap,  // Optional: per-instrument pattern scoping from Agent Scoring
        holdings = [],
        rebalanceFrequency = 'quarterly',
        dcaAmount = 0,
        dcaFrequency = 'monthly',
        initialValue = 10000,
        gradeFilter = ['A', 'B', 'C', 'D', 'F'] // Default: all grades
      } = inputs || {};
      
      const instruments =
        (Array.isArray(directInstruments) && directInstruments.length > 0)
          ? directInstruments
          : (Array.isArray(holdings) && holdings.length > 0)
            ? holdings.map((h: any) => h.symbol)
            : PREDEFINED_UNIVERSES[assetClass]?.[universe] || [];

      // Calculate credits
      const creditResult = calculateCredits({
        projectType,
        instrumentCount: instruments.length,
        patternCount: patterns.length || 1,
        lookbackYears,
        timeframe,
        cacheHitRatio: 0,
        rebalancePerYear: rebalanceFrequency === 'monthly' ? 12 : rebalanceFrequency === 'quarterly' ? 4 : 1
      });
      const creditsEstimated = creditResult.creditsEstimated;
      
      // Check if user is admin - admins bypass credit checks
      const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
      const skipCreditCheck = isAdmin === true;
      
      if (skipCreditCheck) {
        console.log(`Admin user ${user.id} - bypassing credit checks`);
      }
      
      // Get or create usage_credits (only needed for non-admins)
      let credits: any = null;
      if (!skipCreditCheck) {
        const { data: existingCredits } = await supabase
          .from('usage_credits')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // If no credits record exists, create one with FREE tier defaults
        if (!existingCredits) {
          console.log(`Creating usage_credits for user ${user.id} during run`);
          const { data: newCredits, error: createError } = await supabase
            .from('usage_credits')
            .insert({
              user_id: user.id,
              plan_tier: 'free',
              credits_balance: 50, // FREE tier monthly credits (matches PLANS_CONFIG)
            })
            .select()
            .single();
          
          if (!createError && newCredits) {
            credits = newCredits;
          }
        } else {
          credits = existingCredits;
        }
        
        if (credits && credits.credits_balance < creditsEstimated) {
          return new Response(JSON.stringify({ 
            error: 'Insufficient credits',
            creditsBalance: credits.credits_balance,
            creditsNeeded: creditsEstimated,
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Create project
      const projectName = `Pattern Lab - ${patterns.join(', ').slice(0, 30)}`;
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          type: projectType,
          name: projectName,
        })
        .select()
        .single();
      
      if (projectError) {
        console.error('Project creation error:', projectError);
        return new Response(JSON.stringify({ error: 'Failed to create project' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Create project inputs
      const { data: projectInput, error: inputError } = await supabase
        .from('project_inputs')
        .insert({
          project_id: project.id,
          version: 1,
          input_json: inputs,
        })
        .select()
        .single();
      
      if (inputError) {
        console.error('Project input creation error:', inputError);
        return new Response(JSON.stringify({ error: 'Failed to create project input' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Create project run with input_id
      const { data: run, error: runError } = await supabase
        .from('project_runs')
        .insert({
          project_id: project.id,
          input_id: projectInput.id,
          status: 'queued',
          credits_estimated: creditsEstimated,
        })
        .select()
        .single();
      
      if (runError) {
        console.error('Run creation error:', runError);
        return new Response(JSON.stringify({ error: 'Failed to create run' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Return immediately so the user can see the progress page
      const runId = run.id;
      const projectId = project.id;
      
      // Fire-and-forget: process the backtest in the background
      const backgroundTask = (async () => {
      // Update to running
      await supabase
        .from('project_runs')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
          execution_metadata: {
            progress: 0,
            currentStep: 'Initializing scan',
            heartbeatAt: new Date().toISOString(),
          },
        })
        .eq('id', runId);
      
      try {
        // Validate and clamp lookback against data coverage contract
        const lookbackValidation = validateLookback(timeframe as Timeframe, lookbackYears);
        const effectiveLookbackYears = lookbackValidation.valid 
          ? lookbackYears 
          : clampLookback(timeframe as Timeframe, lookbackYears);
        
        if (!lookbackValidation.valid) {
          console.log(`[DataCoverage] Clamped lookback from ${lookbackYears}y to ${effectiveLookbackYears}y for ${timeframe}: ${lookbackValidation.message}`);
        }
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - effectiveLookbackYears);

        const executionStartedAt = Date.now();
        const EXECUTION_BUDGET_MS = 50_000; // Deno CPU limit ~2s; keep wall-clock tight to reduce risk
        const ensureBudget = (stage: string) => {
          if (Date.now() - executionStartedAt > EXECUTION_BUDGET_MS) {
            throw new Error(`Backtest timed out during ${stage}. Reduce instruments/patterns/lookback and retry.`);
          }
        };
        
        let artifactJson: any = null;
        let artifactType = 'backtest_report';
        
        // ============= PATTERN LAB EXECUTION (Signal Replay Model) =============
        // Instead of re-detecting patterns from raw bars, query pre-validated signals
        // from historical_pattern_occurrences. This ensures 100% alignment between
        // the pre-check count shown in the UI and the actual backtest results.
        if (projectType === 'pattern_lab') {
          // Map pattern ID aliases (client/DB may use bull-flag, registry uses bullish-flag)
          const PATTERN_ID_ALIASES: Record<string, string> = {
            'bull-flag': 'bullish-flag',
            'bear-flag': 'bearish-flag',
          };
          const REVERSE_ALIASES: Record<string, string> = {
            'bullish-flag': 'bull-flag',
            'bearish-flag': 'bear-flag',
          };
          const resolvedPatterns = patterns.map((p: string) => PATTERN_ID_ALIASES[p] || p);
          const scannedPatternIds = [...new Set(resolvedPatterns.filter((p: string) => Boolean(WEDGE_PATTERN_REGISTRY[p])))];
          // DB pattern IDs use the original names (bull-flag, bear-flag)
          const dbPatternIds = scannedPatternIds.map((p: string) => REVERSE_ALIASES[p] || p);
          console.log(`[PatternLab] Signal Replay: ${instruments.length} instruments, ${scannedPatternIds.length} patterns, grades=${gradeFilter.join(',')}, ${effectiveLookbackYears}y lookback`);
          
          const allTrades: BacktestTrade[] = [];
          const patternResults: any[] = [];
          const equity: { date: string; value: number; drawdown: number }[] = [];
          const detectionFunnel: Record<string, { detected: number; gradeFiltered: number; overlapSkipped: number; traded: number }> = {};

          // ─── Step 1: Query all matching signals from DB ───
          await supabase
            .from('project_runs')
            .update({ 
              execution_metadata: { 
                progress: 5,
                currentStep: 'Querying validated signals from database',
                heartbeatAt: new Date().toISOString(),
              } 
            })
            .eq('id', run.id);

          // Fetch signals in batches per instrument to stay within PostgREST limits
          interface DBSignal {
            id: string;
            symbol: string;
            pattern_id: string;
            pattern_name: string;
            direction: string;
            detected_at: string;
            entry_price: number;
            stop_loss_price: number;
            take_profit_price: number;
            risk_reward_ratio: number;
            quality_score: string | null;
            outcome: string | null;
            outcome_date: string | null;
            outcome_price: number | null;
            bars_to_outcome: number | null;
            timeframe: string;
          }

          const allSignals: DBSignal[] = [];
          const PAGE_SIZE = 1000;

          for (const instrument of instruments) {
            ensureBudget(`signal query ${instrument}`);
            let from = 0;
            while (true) {
              let query = supabase
                .from('historical_pattern_occurrences')
                .select('id, symbol, pattern_id, pattern_name, direction, detected_at, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, outcome, outcome_date, outcome_price, bars_to_outcome, timeframe')
                .eq('symbol', instrument)
                .eq('timeframe', timeframe)
                .in('pattern_id', dbPatternIds)
                .gte('detected_at', startDate.toISOString())
                .lte('detected_at', endDate.toISOString())
                .order('detected_at', { ascending: true })
                .range(from, from + PAGE_SIZE - 1);

              // Apply grade filter
              if (gradeFilter.length < 5) {
                query = query.in('quality_score', gradeFilter);
              }

              const { data, error } = await query;
              if (error) {
                console.warn(`[PatternLab] Signal query error for ${instrument}:`, error.message);
                break;
              }
              if (!data || data.length === 0) break;
              allSignals.push(...(data as DBSignal[]));
              if (data.length < PAGE_SIZE) break;
              from += PAGE_SIZE;
            }
          }

          console.log(`[PatternLab] Signal Replay: ${allSignals.length} signals fetched from DB (matching grade filter)`);

          // Initialize funnel tracking
          for (const patId of scannedPatternIds) {
            detectionFunnel[patId] = { detected: 0, gradeFiltered: 0, overlapSkipped: 0, traded: 0 };
          }

          // Count total signals per pattern (before overlap filtering)
          for (const signal of allSignals) {
            if (detectionFunnel[signal.pattern_id]) {
              detectionFunnel[signal.pattern_id].detected++;
            }
          }

          // ─── Step 2: Fetch price data and simulate trades ───
          // Group signals by instrument for efficient data fetching
          const signalsByInstrument: Record<string, DBSignal[]> = {};
          for (const signal of allSignals) {
            if (!signalsByInstrument[signal.symbol]) signalsByInstrument[signal.symbol] = [];
            signalsByInstrument[signal.symbol].push(signal);
          }

          const instrumentList = Object.keys(signalsByInstrument);
          let processedInstruments = 0;

          for (const instrument of instrumentList) {
            ensureBudget(`trade simulation ${instrument}`);
            processedInstruments++;

            await supabase
              .from('project_runs')
              .update({ 
                execution_metadata: { 
                  progress: Math.round(10 + (processedInstruments / Math.max(instrumentList.length, 1)) * 85),
                  currentStep: `Simulating trades for ${instrument}`,
                  instrumentsProcessed: processedInstruments,
                  instrumentsTotal: instrumentList.length,
                  signalsTotal: allSignals.length,
                  heartbeatAt: new Date().toISOString(),
                } 
              })
              .eq('id', run.id);

            // Fetch price data for trade simulation
            const bars = await fetchBacktestData(
              supabase,
              instrument,
              startDate.toISOString().split('T')[0],
              endDate.toISOString().split('T')[0],
              timeframe
            );

            const MAX_BARS_PER_INSTRUMENT = 5000;
            if (bars.length > MAX_BARS_PER_INSTRUMENT) {
              console.log(`[PatternLab] Capping ${instrument} bars from ${bars.length} to ${MAX_BARS_PER_INSTRUMENT}`);
              bars.splice(0, bars.length - MAX_BARS_PER_INSTRUMENT);
            }

            if (bars.length < 10) {
              console.log(`[PatternLab] Insufficient price data for ${instrument}: ${bars.length} bars, skipping trade simulation`);
              continue;
            }

            // Build date→index lookup for fast signal-to-bar matching
            const dateIndex: Record<string, number> = {};
            for (let i = 0; i < bars.length; i++) {
              // Store by date string (YYYY-MM-DD or ISO)
              const dateKey = typeof bars[i].date === 'string' ? bars[i].date.split('T')[0] : new Date(bars[i].timestamp).toISOString().split('T')[0];
              dateIndex[dateKey] = i;
            }

            // Debug: log a sample dateIndex key and bars range
            const sampleKeys = Object.keys(dateIndex).slice(0, 3);
            console.log(`[PatternLab] dateIndex sample keys: ${sampleKeys.join(', ')}, total keys: ${Object.keys(dateIndex).length}, bars: ${bars.length}`);

            const instrumentSignals = signalsByInstrument[instrument];
            let lastTradeEndIndex = -1;
            let debugSkipReasons: Record<string, number> = { noIndex: 0, outOfRange: 0, overlap: 0, invalidData: 0 };

            for (const signal of instrumentSignals) {
              const patternId = signal.pattern_id;
              const grade = signal.quality_score || 'C';
              const funnel = detectionFunnel[patternId];

              // Find the bar index closest to signal's detected_at date
              const signalDate = signal.detected_at.split('T')[0];
              let entryIndex = dateIndex[signalDate];

              // For intraday timeframes, try exact timestamp match first
              if (entryIndex === undefined || ['1h', '4h', '8h'].includes(timeframe)) {
                const signalTs = new Date(signal.detected_at).getTime();
                let bestIdx = -1;
                let bestDiff = Infinity;
                for (let i = 0; i < bars.length; i++) {
                  const barTs = bars[i].timestamp;
                  const diff = Math.abs(barTs - signalTs);
                  if (diff < bestDiff) {
                    bestDiff = diff;
                    bestIdx = i;
                  }
                }
                if (bestIdx >= 0) {
                  entryIndex = bestIdx;
                }
              }

              if (entryIndex === undefined || entryIndex < 0 || entryIndex >= bars.length - 5) {
                debugSkipReasons[entryIndex === undefined ? 'noIndex' : 'outOfRange']++;
                continue;
              }

              // Skip overlapping trades (same as original engine)
              if (entryIndex <= lastTradeEndIndex) {
                if (funnel) funnel.overlapSkipped++;
                continue;
              }

              // Use entry price from the DB signal (validated during seeding)
              const entryPrice = signal.entry_price;
              const stopLossPrice = signal.stop_loss_price;
              // Map DB direction (bullish/bearish) to engine direction (long/short)
              const rawDir = signal.direction?.toLowerCase();
              const direction: 'long' | 'short' = (rawDir === 'bullish' || rawDir === 'long') ? 'long' : 'short';
              const isLong = direction === 'long';
              const stopDistance = Math.abs(entryPrice - stopLossPrice);

              if (stopDistance <= 0 || entryPrice <= 0) {
                continue; // Invalid signal data
              }

              const maxBarsInTrade = 50;

              // Simulate trade outcomes for all R:R tiers
              const rrOutcomes = {
                rr2: simulateRROutcome(bars, entryIndex, entryPrice, stopDistance, 2, isLong, maxBarsInTrade),
                rr3: simulateRROutcome(bars, entryIndex, entryPrice, stopDistance, 3, isLong, maxBarsInTrade),
                rr4: simulateRROutcome(bars, entryIndex, entryPrice, stopDistance, 4, isLong, maxBarsInTrade),
                rr5: simulateRROutcome(bars, entryIndex, entryPrice, stopDistance, 5, isLong, maxBarsInTrade),
              };

              // Compute exit strategy outcomes
              const exitOutcomes = computeExitOutcomes(bars, entryIndex, entryPrice, stopDistance, isLong, maxBarsInTrade);

              // Use RR2 as the primary result
              const primary = rrOutcomes.rr2;
              const exitDate = primary.exitDate;
              const exitPrice = primary.exitPrice;
              const exitReason: 'tp' | 'sl' | 'time_stop' =
                primary.outcome === 'hit_tp' ? 'tp' : primary.outcome === 'hit_sl' ? 'sl' : 'time_stop';
              const rMultiple = primary.rMultiple;
              const pnl = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;

              const regime = bars.length > 50 ? classifyRegime(bars.slice(0, entryIndex + 1)) : { trend: 'SIDEWAYS' as const, volatility: 'MED' as const };

              allTrades.push({
                entryDate: signal.detected_at,
                exitDate,
                instrument,
                patternId,
                direction,
                entryPrice,
                exitPrice,
                rMultiple,
                isWin: pnl > 0,
                regime: `${regime.trend}_${regime.volatility}`,
                exitReason,
                grade,
                rrOutcomes,
                exitOutcomes,
              } as any);

              if (funnel) funnel.traded++;
              lastTradeEndIndex = entryIndex + 5;
            }
            console.log(`[PatternLab] ${instrument} signal matching: ${JSON.stringify(debugSkipReasons)}, traded: ${allTrades.length}`);
          }
          
          ensureBudget('result computation preflight');
          // Update progress to 100% after all instruments processed
          await supabase
            .from('project_runs')
            .update({ 
              execution_metadata: { 
                progress: 100,
                currentStep: 'Computing results',
                instrumentsProcessed: instrumentList.length,
                instrumentsTotal: instrumentList.length,
                signalsTotal: allSignals.length,
                tradesSimulated: allTrades.length,
                heartbeatAt: new Date().toISOString(),
              } 
            })
            .eq('id', run.id);
          
          console.log(`[PatternLab] Signal Replay complete: ${allSignals.length} signals → ${allTrades.length} trades simulated`);
          ensureBudget('pattern-level analytics');
          
          // Calculate pattern-level stats
          for (const patternId of scannedPatternIds) {
            const pattern = WEDGE_PATTERN_REGISTRY[patternId];
            if (!pattern) continue;
            
            const patternTrades = allTrades.filter(t => t.patternId === patternId);
            const wins = patternTrades.filter(t => t.isWin);
            const losses = patternTrades.filter(t => !t.isWin);
            
            const winRate = patternTrades.length > 0 ? wins.length / patternTrades.length : 0;
            const avgR = patternTrades.length > 0 ? patternTrades.reduce((s, t) => s + t.rMultiple, 0) / patternTrades.length : 0;
            const expectancy = winRate * (wins.length > 0 ? wins.reduce((s, t) => s + t.rMultiple, 0) / wins.length : 0) - 
                              (1 - winRate) * (losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.rMultiple, 0) / losses.length) : 1);
            
            const grossProfit = wins.reduce((s, t) => s + t.rMultiple, 0);
            const grossLoss = Math.abs(losses.reduce((s, t) => s + t.rMultiple, 0));
            const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
            
            // Regime breakdown
            const regimes = ['UP_HIGH', 'UP_MED', 'UP_LOW', 'DOWN_HIGH', 'DOWN_MED', 'DOWN_LOW', 'SIDEWAYS_HIGH', 'SIDEWAYS_MED', 'SIDEWAYS_LOW'];
            const regimeBreakdown = regimes.map(regimeKey => {
              const regimeTrades = patternTrades.filter(t => t.regime === regimeKey);
              const regimeWins = regimeTrades.filter(t => t.isWin);
              const regimeAvgR = regimeTrades.length > 0 ? regimeTrades.reduce((s, t) => s + t.rMultiple, 0) / regimeTrades.length : 0;
              
              return {
                regimeKey,
                n: regimeTrades.length,
                winRate: regimeTrades.length > 0 ? regimeWins.length / regimeTrades.length : 0,
                avgR: regimeAvgR,
                isReliable: regimeTrades.length >= 10,
                recommendation: regimeAvgR >= 0.3 ? 'trade' : regimeAvgR >= 0 ? 'caution' : 'avoid'
              };
            }).filter(r => r.n > 0);
            
            // Do-not-trade rules
            const doNotTradeRules: string[] = [];
            regimeBreakdown.forEach(r => {
              if (r.avgR < -0.5 && r.n >= 5) {
                const [trend, vol] = r.regimeKey.split('_');
                doNotTradeRules.push(`Avoid in ${trend.toLowerCase()} trend with ${vol.toLowerCase()} volatility (${r.n} trades, ${(r.avgR).toFixed(2)}R avg)`);
              }
            });
            
            // Drawdown calculation
            let runningR = 0;
            let peakR = 0;
            let maxDD = 0;
            for (const trade of patternTrades.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())) {
              runningR += trade.rMultiple;
              peakR = Math.max(peakR, runningR);
              maxDD = Math.max(maxDD, (peakR - runningR));
            }
            
            const funnel = detectionFunnel[patternId] || { detected: 0, gradeFiltered: 0, overlapSkipped: 0, traded: 0 };
            patternResults.push({
              patternId,
              patternName: pattern.displayName,
              direction: pattern.direction,
              totalTrades: patternTrades.length,
              winRate,
              avgRMultiple: avgR,
              expectancy,
              profitFactor,
              maxDrawdown: maxDD,
              sharpeRatio: avgR / (Math.sqrt(patternTrades.map(t => t.rMultiple).reduce((s, r) => s + r * r, 0) / patternTrades.length - avgR * avgR) || 1),
              regimeBreakdown,
              doNotTradeRules,
              detectionFunnel: {
                detected: funnel.detected,
                gradeFiltered: funnel.gradeFiltered,
                overlapSkipped: funnel.overlapSkipped,
                traded: funnel.traded,
              },
            });
          }

          // ============= Tier-aware pattern + equity outputs =============
          const tierKeys = ['rr2', 'rr3', 'rr4', 'rr5'] as const;
          const tierLabels = { rr2: '1:2', rr3: '1:3', rr4: '1:4', rr5: '1:5' } as const;

          // Build patternsByTier (small payload, accurate across tiers)
          const patternsByTier: Record<string, any[]> = {
            '1:2': patternResults,
          };

          const computePatternResultsForTier = (tierKey: typeof tierKeys[number]) => {
            const results: any[] = [];
            for (const patternId of scannedPatternIds) {
              const pattern = WEDGE_PATTERN_REGISTRY[patternId];
              if (!pattern) continue;

              const patternTrades = allTrades.filter(t => t.patternId === patternId);
              const tierR = (t: BacktestTrade) => t.rrOutcomes?.[tierKey]?.rMultiple ?? t.rMultiple;
              const isWinTier = (t: BacktestTrade) => tierR(t) > 0;

              const wins = patternTrades.filter(isWinTier);
              const losses = patternTrades.filter(t => !isWinTier(t));

              const winRate = patternTrades.length > 0 ? wins.length / patternTrades.length : 0;
              const avgR = patternTrades.length > 0 ? patternTrades.reduce((s, t) => s + tierR(t), 0) / patternTrades.length : 0;
              const avgWinR = wins.length > 0 ? wins.reduce((s, t) => s + tierR(t), 0) / wins.length : 0;
              const avgLossR = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + tierR(t), 0) / losses.length) : 1;
              const expectancy = (winRate * avgWinR) - ((1 - winRate) * avgLossR);

              const grossProfit = wins.reduce((s, t) => s + tierR(t), 0);
              const grossLoss = Math.abs(losses.reduce((s, t) => s + tierR(t), 0));
              const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

              // Regime breakdown
              const regimes = ['UP_HIGH', 'UP_MED', 'UP_LOW', 'DOWN_HIGH', 'DOWN_MED', 'DOWN_LOW', 'SIDEWAYS_HIGH', 'SIDEWAYS_MED', 'SIDEWAYS_LOW'];
              const regimeBreakdown = regimes.map(regimeKey => {
                const regimeTrades = patternTrades.filter(t => t.regime === regimeKey);
                const regimeWins = regimeTrades.filter(isWinTier);
                const regimeAvgR = regimeTrades.length > 0 ? regimeTrades.reduce((s, t) => s + tierR(t), 0) / regimeTrades.length : 0;
                return {
                  regimeKey,
                  n: regimeTrades.length,
                  winRate: regimeTrades.length > 0 ? regimeWins.length / regimeTrades.length : 0,
                  avgR: regimeAvgR,
                  isReliable: regimeTrades.length >= 10,
                  recommendation: regimeAvgR >= 0.3 ? 'trade' : regimeAvgR >= 0 ? 'caution' : 'avoid'
                };
              }).filter(r => r.n > 0);

              // Do-not-trade rules
              const doNotTradeRules: string[] = [];
              regimeBreakdown.forEach(r => {
                if (r.avgR < -0.5 && r.n >= 5) {
                  const [trend, vol] = r.regimeKey.split('_');
                  doNotTradeRules.push(`Avoid in ${trend.toLowerCase()} trend with ${vol.toLowerCase()} volatility (${r.n} trades, ${(r.avgR).toFixed(2)}R avg)`);
                }
              });

              // Drawdown calculation in R units
              let runningR = 0;
              let peakR = 0;
              let maxDD = 0;
              for (const trade of patternTrades.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())) {
                runningR += tierR(trade);
                peakR = Math.max(peakR, runningR);
                maxDD = Math.max(maxDD, (peakR - runningR));
              }

              // Sharpe (R units, naive)
              const variance = patternTrades.length > 0
                ? (patternTrades.reduce((s, t) => {
                    const r = tierR(t);
                    return s + (r - avgR) * (r - avgR);
                  }, 0) / patternTrades.length)
                : 0;
              const std = Math.sqrt(variance);
              const sharpeRatio = std > 0 ? (avgR / std) : 0;

              results.push({
                patternId,
                patternName: pattern.displayName,
                direction: pattern.direction,
                totalTrades: patternTrades.length,
                winRate,
                avgRMultiple: avgR,
                expectancy,
                profitFactor,
                maxDrawdown: maxDD,
                sharpeRatio,
                regimeBreakdown,
                doNotTradeRules,
              });
            }
            return results;
          };

          // Skip heavy tier computations when many trades to avoid CPU timeout
          if (allTrades.length <= 300) {
            patternsByTier['1:3'] = computePatternResultsForTier('rr3');
            patternsByTier['1:4'] = computePatternResultsForTier('rr4');
            patternsByTier['1:5'] = computePatternResultsForTier('rr5');
          } else {
            console.log(`[PatternLab] Skipping per-tier pattern analytics (${allTrades.length} trades > 300 threshold) to stay within CPU budget`);
            // Reuse baseline for all tiers
            patternsByTier['1:3'] = patternResults;
            patternsByTier['1:4'] = patternResults;
            patternsByTier['1:5'] = patternResults;
          }

          // Build equity curves by tier from all trades (accurate even though trade log is capped)
          const sortedTrades = [...allTrades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
          const buildEquityForTier = (tierKey: typeof tierKeys[number]) => {
            const points: { date: string; value: number; drawdown: number }[] = [];
            let cumulativeR = 0;
            let peakValue = 10000;
            let maxDD = 0;
            // Use user-defined riskPerTrade (default 1%) for equity simulation
            const riskFraction = riskPerTrade / 100;
            for (const trade of sortedTrades) {
              const r = trade.rrOutcomes?.[tierKey]?.rMultiple ?? (tierKey === 'rr2' ? trade.rMultiple : 0);
              const d = trade.rrOutcomes?.[tierKey]?.exitDate ?? trade.exitDate;
              cumulativeR += r;
              const value = 10000 * (1 + cumulativeR * riskFraction);
              peakValue = Math.max(peakValue, value);
              const dd = peakValue > 0 ? (peakValue - value) / peakValue : 0;
              maxDD = Math.max(maxDD, dd);
              points.push({ date: d, value: Math.max(0, value), drawdown: dd });
            }
            return { points, maxDrawdownPercent: Math.min(maxDD * 100, 100) };
          };

          const equityByTier: Record<string, { date: string; value: number; drawdown: number }[]> = {};
          const maxDrawdownByTier: Record<string, number> = {};
          for (const tk of tierKeys) {
            const { points, maxDrawdownPercent } = buildEquityForTier(tk);
            const label = tierLabels[tk];
            equityByTier[label] = points;
            maxDrawdownByTier[label] = maxDrawdownPercent;
          }

          // Maintain backward compatibility: equity + patternResults represent the baseline (1:2)
          const baselineEquity = equityByTier['1:2'] ?? [];
          equity.push(...baselineEquity);
          
          // Summary - use avgR as expectancy (simple average R-multiple per trade)
          const overallWinRate = allTrades.length > 0 ? allTrades.filter(t => t.isWin).length / allTrades.length : 0;
          // Expectancy = average R-multiple per trade (unified formula across platform)
          const overallExpectancy = allTrades.length > 0 ? allTrades.reduce((s, t) => s + t.rMultiple, 0) / allTrades.length : 0;
          const bestPattern = patternResults.reduce((best, p) => p.expectancy > best.expectancy ? p : best, patternResults[0] || { id: '', name: '', expectancy: 0 });
          const worstPattern = patternResults.reduce((worst, p) => p.expectancy < worst.expectancy ? p : worst, patternResults[0] || { id: '', name: '', expectancy: 0 });
          
          // Compute R:R comparison stats from all trades with proper timeout handling
          const rrComparison = (['rr2', 'rr3', 'rr4', 'rr5'] as const).map((tier, idx) => {
            const rrTier = idx + 2; // 2, 3, 4, 5
            const rrTrades = allTrades.filter(t => t.rrOutcomes?.[tier]);
            const wins = rrTrades.filter(t => t.rrOutcomes[tier].outcome === 'hit_tp');
            const losses = rrTrades.filter(t => t.rrOutcomes[tier].outcome === 'hit_sl');
            const timeouts = rrTrades.filter(t => t.rrOutcomes[tier].outcome === 'timeout');
            
            const winRate = rrTrades.length > 0 ? wins.length / rrTrades.length : 0;
            const lossRate = rrTrades.length > 0 ? losses.length / rrTrades.length : 0;
            const avgHoldBars = rrTrades.length > 0 
              ? rrTrades.reduce((sum, t) => sum + t.rrOutcomes[tier].bars, 0) / rrTrades.length 
              : 0;
            
            // Calculate total R-multiple using the per-tier rMultiple from simulation
            let totalR = 0;
            for (const trade of rrTrades) {
              // Use the pre-computed rMultiple for this tier (already includes proper timeout handling)
              totalR += trade.rrOutcomes[tier].rMultiple;
            }
            const expectancy = rrTrades.length > 0 ? totalR / rrTrades.length : 0;
            
            return {
              tier: `1:${rrTier}`,
              winRate,
              lossRate,
              timeoutRate: rrTrades.length > 0 ? timeouts.length / rrTrades.length : 0,
              avgHoldBars: Math.round(avgHoldBars),
              expectancy,
              sampleSize: rrTrades.length,
            };
          });
          
          // Find optimal tier (highest expectancy)
          const optimalTier = rrComparison.reduce((best, curr) => 
            curr.expectancy > best.expectancy ? curr : best, rrComparison[0]);
          
          // Calculate overall max drawdown as percentage (capped at 100%)
          const overallMaxDrawdown = maxDrawdownByTier['1:2'] ?? 0;
          
          // ============= EXIT STRATEGY COMPARISON =============
          ensureBudget('exit strategy comparison');
          console.log(`[PatternLab] Computing exit strategy comparison...`);
          
          const exitComparison = EXIT_STRATEGIES.map(strategy => {
            const trades = allTrades.filter((t: any) => t.exitOutcomes?.[strategy.id]);
            if (trades.length === 0) {
              return {
                strategyId: strategy.id,
                strategyName: strategy.name,
                description: strategy.description,
                winRate: 0,
                avgHoldBars: 0,
                expectancy: 0,
                maxDrawdown: 0,
                sampleSize: 0,
                avgWinR: 0,
                avgLossR: 0,
              };
            }
            
            const outcomes = trades.map((t: any) => t.exitOutcomes[strategy.id]);
            const wins = outcomes.filter((o: ExitStrategyResult) => o.rMultiple > 0);
            const losses = outcomes.filter((o: ExitStrategyResult) => o.rMultiple <= 0);
            
            const winRate = wins.length / outcomes.length;
            const avgHoldBars = outcomes.reduce((s: number, o: ExitStrategyResult) => s + o.bars, 0) / outcomes.length;
            const totalR = outcomes.reduce((s: number, o: ExitStrategyResult) => s + o.rMultiple, 0);
            const expectancy = totalR / outcomes.length;
            
            const avgWinR = wins.length > 0 
              ? wins.reduce((s: number, o: ExitStrategyResult) => s + o.rMultiple, 0) / wins.length 
              : 0;
            const avgLossR = losses.length > 0 
              ? Math.abs(losses.reduce((s: number, o: ExitStrategyResult) => s + o.rMultiple, 0) / losses.length) 
              : 1;
            
            // Calculate drawdown for this strategy using consistent percentage formula
            // Uses riskPerTrade to convert R-units to portfolio percentage
            let cumulativeR = 0;
            let peakR = 0;
            let maxDDinR = 0;
            for (const trade of trades.sort((a: any, b: any) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime())) {
              const outcome = trade.exitOutcomes[strategy.id];
              cumulativeR += outcome.rMultiple;
              peakR = Math.max(peakR, cumulativeR);
              const dd = peakR - cumulativeR;
              maxDDinR = Math.max(maxDDinR, dd);
            }
            // Convert R drawdown to percentage using user's riskPerTrade setting
            // This ensures consistency with the R:R comparison table's max drawdown
            const maxDrawdownPercent = maxDDinR * riskPerTrade;
            
            return {
              strategyId: strategy.id,
              strategyName: strategy.name,
              description: strategy.description,
              winRate,
              avgHoldBars: Math.round(avgHoldBars),
              expectancy,
              maxDrawdown: maxDrawdownPercent,
              sampleSize: trades.length,
              avgWinR,
              avgLossR,
            };
          });
          
          // Find optimal exit strategy
          const optimalExitStrategy = exitComparison.reduce((best, curr) => 
            curr.expectancy > best.expectancy ? curr : best, exitComparison[0]);
          
          console.log(`[PatternLab] Optimal exit strategy: ${optimalExitStrategy.strategyName} (${optimalExitStrategy.expectancy.toFixed(2)}R)`);
          
          // Build equity curves per exit strategy (skip for large trade sets to save CPU)
          const exitEquityByStrategy: Record<string, { date: string; value: number; drawdown: number }[]> = {};
          if (allTrades.length <= 300) {
            const exitRiskFraction = riskPerTrade / 100;
            for (const strategy of EXIT_STRATEGIES) {
              const points: { date: string; value: number; drawdown: number }[] = [];
              let cumulativeR = 0;
              let peakValue = 10000;
              
              for (const trade of sortedTrades) {
                const outcome = trade.exitOutcomes?.[strategy.id];
                if (!outcome) continue;
                
                cumulativeR += outcome.rMultiple;
                const value = 10000 * (1 + cumulativeR * exitRiskFraction);
                peakValue = Math.max(peakValue, value);
                const dd = peakValue > 0 ? (peakValue - value) / peakValue : 0;
                points.push({ date: outcome.exitDate, value: Math.max(0, value), drawdown: dd });
              }
              exitEquityByStrategy[strategy.id] = points;
            }
          } else {
            console.log(`[PatternLab] Skipping exit equity curves (${allTrades.length} trades > 300 threshold) to stay within CPU budget`);
          }
          
          artifactJson = {
            projectType: 'pattern_lab',
            // Include inputs for reproducing/editing the run
            inputs: {
              instruments,
              patterns: scannedPatternIds,
              gradeFilter,
              riskPerTrade, // Professional tiers: 0.5%, 1%, 2%
            },
            timeframe,
            lookbackYears,
            riskPerTrade, // Also at top level for easy access
            generatedAt: new Date().toISOString(),
            executionAssumptions: {
              bracketLevelsVersion: BRACKET_LEVELS_VERSION,
              priceRounding: ROUNDING_CONFIG,
              maxBarsInTrade: 50,
              fillRule: 'bar_close',
              riskPerTrade, // Document the risk used in equity simulation
            },
            summary: {
              totalPatterns: patternResults.length,
              totalTrades: allTrades.length,
              overallWinRate,
              overallExpectancy,
              overallMaxDrawdown, // Now properly calculated as percentage
              bestPattern: { id: bestPattern?.patternId || '', name: bestPattern?.patternName || '', expectancy: bestPattern?.expectancy || 0, winRate: bestPattern?.winRate || 0, totalTrades: bestPattern?.totalTrades || 0 },
              worstPattern: { id: worstPattern?.patternId || '', name: worstPattern?.patternName || '', expectancy: worstPattern?.expectancy || 0, winRate: worstPattern?.winRate || 0, totalTrades: worstPattern?.totalTrades || 0 },
            },
            rrComparison,
            optimalTier: optimalTier?.tier || '1:2',
            patterns: patternResults,
            patternsByTier,
            trades: allTrades.slice(0, 500).map((t: any) => {
              // Keep exitOutcomes for client-side optimizer recalculation, remove entryBarIndex
              const { entryBarIndex, ...rest } = t;
              return rest;
            }),
            equity: baselineEquity,
            equityByTier,
            maxDrawdownByTier,
            // Exit Optimizer data
            exitComparison,
            optimalExitStrategy: optimalExitStrategy.strategyId,
            exitEquityByStrategy,
          };
          artifactType = 'backtest_report';
        }
        
        // Save artifact
        if (artifactJson) {
          const { error: artifactError } = await supabase
            .from('artifacts')
            .insert({
              project_run_id: run.id,
              type: artifactType,
              artifact_json: artifactJson,
            });
          
          if (artifactError) {
            console.error('Artifact creation error:', artifactError);
          }
        }
        
        // Deduct credits (skip for admins)
        if (credits && !skipCreditCheck) {
          await supabase
            .from('usage_credits')
            .update({ credits_balance: credits.credits_balance - creditsEstimated })
            .eq('user_id', user.id);
        }
        
        // Update run status
        await supabase
          .from('project_runs')
          .update({
            status: 'succeeded',
            finished_at: new Date().toISOString(),
            credits_used: creditsEstimated,
          })
          .eq('id', runId);
        
        console.log(`[${projectType}] Completed successfully`);
        
      } catch (execError: any) {
        console.error('Execution error:', execError);
        
        await supabase
          .from('project_runs')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: execError.message,
          })
          .eq('id', runId);
      }
      })(); // end of background task IIFE

      // Keep the edge function alive until the background task completes
      if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
        (globalThis as any).EdgeRuntime.waitUntil(backgroundTask);
      }

      // Return immediately so the frontend can navigate to the progress page
      return new Response(JSON.stringify({
        runId,
        projectId,
        status: 'queued',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // ============= RESULT ENDPOINT =============
    if (path === 'result' && req.method === 'GET') {
      const runId = url.searchParams.get('runId');
      if (!runId) {
        return new Response(JSON.stringify({ error: 'Missing runId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Use Service Role for DB reads, but enforce ownership explicitly.
      // This prevents "Run not found" due to missing/strict RLS on project tables,
      // while still keeping results private.
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: user.id });

      const { data: runRow, error: runError } = await supabaseAdmin
        .from('project_runs')
        .select('id,status,credits_estimated,credits_used,error_message,started_at,finished_at,execution_metadata,created_at,project_id, projects(id,name,type,user_id)')
        .eq('id', runId)
        .single();

      if (runError || !runRow) {
        return new Response(JSON.stringify({ error: 'Run not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const projectRow = Array.isArray((runRow as any).projects)
        ? (runRow as any).projects[0]
        : (runRow as any).projects;

      if (!projectRow) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (isAdmin !== true && projectRow.user_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Recover from edge-runtime crashes that can leave runs stuck.
      // Case 1: queued but never started.
      if (runRow.status === 'queued' && runRow.created_at) {
        const queuedForMs = Date.now() - new Date(runRow.created_at).getTime();
        const queuedThresholdMs = 45 * 1000;

        if (!Number.isNaN(queuedForMs) && queuedForMs > queuedThresholdMs) {
          const timeoutMessage = 'Run did not start in time. Please retry with fewer instruments/patterns or try again in a minute.';
          await supabaseAdmin
            .from('project_runs')
            .update({
              status: 'failed',
              finished_at: new Date().toISOString(),
              error_message: timeoutMessage,
            })
            .eq('id', runId)
            .eq('status', 'queued');

          runRow.status = 'failed';
          runRow.finished_at = new Date().toISOString();
          runRow.error_message = timeoutMessage;
        }
      }

      // Case 2: running but heartbeat is stale.
      if (runRow.status === 'running' && runRow.started_at) {
        const startedAt = new Date(runRow.started_at).getTime();
        const metadata = (runRow.execution_metadata ?? {}) as Record<string, unknown>;
        const heartbeatRaw = typeof metadata.heartbeatAt === 'string' ? metadata.heartbeatAt : null;
        const heartbeatAt = heartbeatRaw ? new Date(heartbeatRaw).getTime() : NaN;

        // Keep this close to execution budget so hung runs fail fast in UI.
        const staleThresholdMs = 90 * 1000;
        const lastActivityAt = Number.isFinite(heartbeatAt) ? heartbeatAt : startedAt;

        if (!Number.isNaN(lastActivityAt) && Date.now() - lastActivityAt > staleThresholdMs) {
          const timeoutMessage = 'Run timed out before completion. Please retry with fewer instruments/patterns or a shorter lookback.';
          await supabaseAdmin
            .from('project_runs')
            .update({
              status: 'failed',
              finished_at: new Date().toISOString(),
              error_message: timeoutMessage,
            })
            .eq('id', runId)
            .eq('status', 'running');

          runRow.status = 'failed';
          runRow.finished_at = new Date().toISOString();
          runRow.error_message = timeoutMessage;
        }
      }

      let artifact = null;
      if (runRow.status === 'succeeded') {
        const { data: artifactData } = await supabaseAdmin
          .from('artifacts')
          .select('*')
          .eq('project_run_id', runId)
          .single();
        artifact = artifactData;
      }

      return new Response(JSON.stringify({
        run: {
          id: runRow.id,
          status: runRow.status,
          creditsEstimated: runRow.credits_estimated,
          creditsUsed: runRow.credits_used,
          errorMessage: runRow.error_message,
          createdAt: runRow.created_at,
          startedAt: runRow.started_at,
          finishedAt: runRow.finished_at,
          executionMetadata: runRow.execution_metadata,
        },
        project: {
          id: projectRow.id,
          name: projectRow.name,
          type: projectRow.type,
        },
        artifact: artifact?.artifact_json || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
