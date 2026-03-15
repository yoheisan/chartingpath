import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ALL_INSTRUMENTS, type Instrument } from "../_shared/screenerInstruments.ts";
import { computeBracketLevels, BRACKET_LEVELS_VERSION } from "../_shared/bracketLevels.ts";
import { 
  calculatePatternQualityScore, 
  calculateZigZagPivots,
  type OHLCBar,
  type PatternQualityScorerInput 
} from "../_shared/patternQualityScorer.ts";
import {
  analyzePatternTrend,
  type TrendIndicators,
  type TrendAlignment
} from "../_shared/trendIndicators.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= PATTERN DEFINITIONS =============
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
  patternStartIndex?: number;
  patternEndIndex?: number;
}

// All detectable patterns
const PATTERN_REGISTRY: Record<string, { 
  direction: 'bullish' | 'bearish'; 
  displayName: string; 
  detector: (w: OHLCBar[]) => PatternDetectionResult 
}> = {
  'double-top': {
    direction: 'bearish',
    displayName: 'Double Top',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const range = highestHigh - lowestLow;
      const tolerance = range * 0.03; // Bulkowski 3%
      
      // Peak prominence threshold: peaks must be within 5% of window high
      const prominenceThreshold = highestHigh - range * 0.05;
      
      let firstTop = -1, secondTop = -1;
      for (let i = 2; i < window.length - 3; i++) {
        if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && 
            highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
          if (highs[i] < prominenceThreshold) continue;
          if (firstTop === -1) firstTop = i;
          else if (i - firstTop >= 5 && Math.abs(highs[i] - highs[firstTop]) <= tolerance) {
            secondTop = i;
            break;
          }
        }
      }
      
      if (firstTop === -1 || secondTop === -1) return { detected: false, pivots: [] };
      
      // PRIOR UPTREND CHECK: price before first top should be lower (≥2%)
      const preTopPrice = Math.min(...lows.slice(0, Math.max(1, firstTop)));
      const priorRise = (highs[firstTop] - preTopPrice) / preTopPrice;
      if (priorRise < 0.02) return { detected: false, pivots: [] };
      
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
        patternStartIndex: firstTop - 2,
        patternEndIndex: secondTop + 2,
        pivots: detected ? [
          { index: firstTop, price: highs[firstTop], type: 'high', label: 'Top 1' },
          { index: secondTop, price: highs[secondTop], type: 'high', label: 'Top 2' },
          { index: necklineIdx, price: neckline, type: 'low', label: 'Neckline' }
        ] : []
      };
    }
  },
  'double-bottom': {
    direction: 'long',
    displayName: 'Double Bottom',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const range = highestHigh - lowestLow;
      const tolerance = range * 0.03;
      
      // Trough prominence threshold: troughs must be within 5% of window low
      const prominenceThreshold = lowestLow + range * 0.05;
      
      let firstBottom = -1, secondBottom = -1;
      for (let i = 2; i < window.length - 3; i++) {
        if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && 
            lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
          if (lows[i] > prominenceThreshold) continue;
          if (firstBottom === -1) firstBottom = i;
          else if (i - firstBottom >= 5 && Math.abs(lows[i] - lows[firstBottom]) <= tolerance) {
            secondBottom = i;
            break;
          }
        }
      }
      
      if (firstBottom === -1 || secondBottom === -1) return { detected: false, pivots: [] };
      
      // PRIOR DOWNTREND CHECK: price before first bottom should be higher (≥2%)
      const preBottomPrice = Math.max(...highs.slice(0, Math.max(1, firstBottom)));
      const priorDrop = (preBottomPrice - lows[firstBottom]) / preBottomPrice;
      if (priorDrop < 0.02) return { detected: false, pivots: [] };
      
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
        patternStartIndex: firstBottom - 2,
        patternEndIndex: secondBottom + 2,
        pivots: detected ? [
          { index: firstBottom, price: lows[firstBottom], type: 'low', label: 'Bottom 1' },
          { index: secondBottom, price: lows[secondBottom], type: 'low', label: 'Bottom 2' },
          { index: necklineIdx, price: neckline, type: 'high', label: 'Neckline' }
        ] : []
      };
    }
  },
  'head-and-shoulders': {
    direction: 'short',
    displayName: 'Head and Shoulders',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const range = highestHigh - lowestLow;
      const prominenceThreshold = highestHigh - range * 0.05;
      
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
      
      // Head must be prominent
      if (head.value < prominenceThreshold) return { detected: false, pivots: [] };
      
      // Minimum 5-bar separation
      if (head.index - leftShoulder.index < 5 || rightShoulder.index - head.index < 5) return { detected: false, pivots: [] };
      
      const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value);
      const headRange = head.value - Math.min(leftShoulder.value, rightShoulder.value);
      const symmetryOk = headRange > 0 && shoulderDiff / headRange < 0.25;
      const headHigherOk = head.value > leftShoulder.value * 1.02 && head.value > rightShoulder.value * 1.02;
      
      if (!symmetryOk || !headHigherOk) return { detected: false, pivots: [] };
      
      // PRIOR UPTREND CHECK: ≥3% rise before pattern
      const prePatternPrice = Math.min(...lows.slice(0, Math.max(1, leftShoulder.index)));
      const priorRise = (head.value - prePatternPrice) / prePatternPrice;
      if (priorRise < 0.03) return { detected: false, pivots: [] };
      
      let neckline = Infinity;
      let necklineIdx = leftShoulder.index;
      for (let i = leftShoulder.index; i <= rightShoulder.index; i++) {
        if (lows[i] < neckline) {
          neckline = lows[i];
          necklineIdx = i;
        }
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < neckline * 0.998;
      
      return {
        detected,
        patternStartIndex: leftShoulder.index - 2,
        patternEndIndex: rightShoulder.index + 2,
        pivots: detected ? [
          { index: leftShoulder.index, price: leftShoulder.value, type: 'high', label: 'Left Shoulder' },
          { index: head.index, price: head.value, type: 'high', label: 'Head' },
          { index: rightShoulder.index, price: rightShoulder.value, type: 'high', label: 'Right Shoulder' },
          { index: necklineIdx, price: neckline, type: 'low', label: 'Neckline' }
        ] : []
      };
    }
  },
  'inverse-head-and-shoulders': {
    direction: 'long',
    displayName: 'Inverse Head and Shoulders',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const range = highestHigh - lowestLow;
      const prominenceThreshold = lowestLow + range * 0.05;
      
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
      
      // Head must be prominent
      if (head.value > prominenceThreshold) return { detected: false, pivots: [] };
      
      // Minimum 5-bar separation
      if (head.index - leftShoulder.index < 5 || rightShoulder.index - head.index < 5) return { detected: false, pivots: [] };
      
      const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value);
      const headRange = Math.max(leftShoulder.value, rightShoulder.value) - head.value;
      const symmetryOk = headRange > 0 && shoulderDiff / headRange < 0.25;
      const headLowerOk = head.value < leftShoulder.value * 0.98 && head.value < rightShoulder.value * 0.98;
      
      if (!symmetryOk || !headLowerOk) return { detected: false, pivots: [] };
      
      // PRIOR DOWNTREND CHECK: ≥3% drop before pattern
      const prePatternPrice = Math.max(...highs.slice(0, Math.max(1, leftShoulder.index)));
      const priorDrop = (prePatternPrice - head.value) / prePatternPrice;
      if (priorDrop < 0.03) return { detected: false, pivots: [] };
      
      let neckline = -Infinity;
      let necklineIdx = leftShoulder.index;
      for (let i = leftShoulder.index; i <= rightShoulder.index; i++) {
        if (highs[i] > neckline) {
          neckline = highs[i];
          necklineIdx = i;
        }
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > neckline * 1.002;
      
      return {
        detected,
        patternStartIndex: leftShoulder.index - 2,
        patternEndIndex: rightShoulder.index + 2,
        pivots: detected ? [
          { index: leftShoulder.index, price: leftShoulder.value, type: 'low', label: 'Left Shoulder' },
          { index: head.index, price: head.value, type: 'low', label: 'Head' },
          { index: rightShoulder.index, price: rightShoulder.value, type: 'low', label: 'Right Shoulder' },
          { index: necklineIdx, price: neckline, type: 'high', label: 'Neckline' }
        ] : []
      };
    }
  },
  'ascending-triangle': {
    direction: 'long',
    displayName: 'Ascending Triangle',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // PRIOR UPTREND CHECK: ≥2% rise into the triangle
      const earlyLow = Math.min(...lows.slice(0, 5));
      const midHigh = Math.max(...highs.slice(5, 15));
      const priorRise = (midHigh - earlyLow) / earlyLow;
      if (priorRise < 0.02) return { detected: false, pivots: [] };
      
      const resistanceZone = Math.max(...highs.slice(0, -2));
      
      // Minimum 3 touches on resistance
      const resistanceTests = highs.filter(h => h > resistanceZone * 0.98 && h <= resistanceZone * 1.02).length;
      if (resistanceTests < 3) return { detected: false, pivots: [] };
      
      // Rising lows (minimum 2 higher lows)
      const recentLows = lows.slice(-10);
      let risingLowCount = 0;
      for (let i = 1; i < recentLows.length; i++) {
        if (recentLows[i] > recentLows[i - 1] * 1.001) risingLowCount++;
        if (recentLows[i] < recentLows[i - 1] * 0.995) risingLowCount--;
      }
      if (risingLowCount < 2) return { detected: false, pivots: [] };
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > resistanceZone * 1.002;
      
      return {
        detected,
        patternStartIndex: 0,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: highs.indexOf(resistanceZone), price: resistanceZone, type: 'high', label: 'Resistance' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' }
        ] : []
      };
    }
  },
  'descending-triangle': {
    direction: 'short',
    displayName: 'Descending Triangle',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // PRIOR DOWNTREND CHECK: ≥2% drop into the triangle
      const earlyHigh = Math.max(...highs.slice(0, 5));
      const midLow = Math.min(...lows.slice(5, 15));
      const priorDrop = (earlyHigh - midLow) / earlyHigh;
      if (priorDrop < 0.02) return { detected: false, pivots: [] };
      
      const supportZone = Math.min(...lows.slice(0, -2));
      
      // Minimum 3 touches on support
      const supportTests = lows.filter(l => l < supportZone * 1.02 && l >= supportZone * 0.98).length;
      if (supportTests < 3) return { detected: false, pivots: [] };
      
      // Falling highs (minimum 2 lower highs)
      const recentHighs = highs.slice(-10);
      let fallingHighCount = 0;
      for (let i = 1; i < recentHighs.length; i++) {
        if (recentHighs[i] < recentHighs[i - 1] * 0.999) fallingHighCount++;
        if (recentHighs[i] > recentHighs[i - 1] * 1.005) fallingHighCount--;
      }
      if (fallingHighCount < 2) return { detected: false, pivots: [] };
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < supportZone * 0.998;
      
      return {
        detected,
        patternStartIndex: 0,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: lows.indexOf(supportZone), price: supportZone, type: 'low', label: 'Support' },
          { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
        ] : []
      };
    }
  },
  'rising-wedge': {
    direction: 'short',
    displayName: 'Rising Wedge',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // PRIOR UPTREND CHECK: wedge must form after a rise of ≥2%
      const earlyLow = Math.min(...lows.slice(0, 5));
      const wedgeHigh = Math.max(...highs);
      const priorRise = (wedgeHigh - earlyLow) / earlyLow;
      if (priorRise < 0.02) return { detected: false, pivots: [] };
      
      const firstHalf = window.slice(0, Math.floor(window.length / 2));
      const secondHalf = window.slice(Math.floor(window.length / 2));
      
      const avgFirstHigh = firstHalf.reduce((s, d) => s + d.high, 0) / firstHalf.length;
      const avgSecondHigh = secondHalf.reduce((s, d) => s + d.high, 0) / secondHalf.length;
      const avgFirstLow = firstHalf.reduce((s, d) => s + d.low, 0) / firstHalf.length;
      const avgSecondLow = secondHalf.reduce((s, d) => s + d.low, 0) / secondHalf.length;
      
      const upperRising = avgSecondHigh > avgFirstHigh;
      const lowerRising = avgSecondLow > avgFirstLow;
      const firstRange = avgFirstHigh - avgFirstLow;
      const secondRange = avgSecondHigh - avgSecondLow;
      const converging = firstRange > 0 && secondRange < firstRange * 0.85;
      
      const lastClose = closes[closes.length - 1];
      const detected = upperRising && lowerRising && converging && lastClose < avgSecondLow * 0.998;
      
      return {
        detected,
        patternStartIndex: 0,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: 0, price: avgFirstLow, type: 'low', label: 'Support Start' },
          { index: window.length - 1, price: avgSecondLow, type: 'low', label: 'Support End' }
        ] : []
      };
    }
  },
  'falling-wedge': {
    direction: 'long',
    displayName: 'Falling Wedge',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // PRIOR DOWNTREND CHECK: wedge must form after a drop of ≥2%
      const earlyHigh = Math.max(...highs.slice(0, 5));
      const wedgeLow = Math.min(...lows);
      const priorDrop = (earlyHigh - wedgeLow) / earlyHigh;
      if (priorDrop < 0.02) return { detected: false, pivots: [] };
      
      const firstHalf = window.slice(0, Math.floor(window.length / 2));
      const secondHalf = window.slice(Math.floor(window.length / 2));
      
      const avgFirstHigh = firstHalf.reduce((s, d) => s + d.high, 0) / firstHalf.length;
      const avgSecondHigh = secondHalf.reduce((s, d) => s + d.high, 0) / secondHalf.length;
      const avgFirstLow = firstHalf.reduce((s, d) => s + d.low, 0) / firstHalf.length;
      const avgSecondLow = secondHalf.reduce((s, d) => s + d.low, 0) / secondHalf.length;
      
      const upperFalling = avgSecondHigh < avgFirstHigh;
      const lowerFalling = avgSecondLow < avgFirstLow;
      const firstRange = avgFirstHigh - avgFirstLow;
      const secondRange = avgSecondHigh - avgSecondLow;
      const converging = firstRange > 0 && secondRange < firstRange * 0.85;
      
      const lastClose = closes[closes.length - 1];
      const detected = upperFalling && lowerFalling && converging && lastClose > avgSecondHigh * 1.002;
      
      return {
        detected,
        patternStartIndex: 0,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: 0, price: avgFirstHigh, type: 'high', label: 'Resistance Start' },
          { index: window.length - 1, price: avgSecondHigh, type: 'high', label: 'Resistance End' }
        ] : []
      };
    }
  },
  'donchian-breakout-long': {
    direction: 'long',
    displayName: 'Donchian Breakout (Long)',
    detector: (window) => {
      if (window.length < 10) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const closes = window.map(d => d.close);
      const lookbackHighs = highs.slice(0, -2);
      const recentHigh = Math.max(...lookbackHighs);
      const recentHighIdx = lookbackHighs.indexOf(recentHigh);
      const currentClose = closes[closes.length - 1];
      const detected = currentClose > recentHigh * 1.001;
      return {
        detected,
        patternStartIndex: recentHighIdx,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: window.length - 1, price: recentHigh, type: 'high', label: 'Breakout Level' },
          { index: window.length - 1, price: currentClose, type: 'high', label: 'Entry' }
        ] : []
      };
    }
  },
  'donchian-breakout-short': {
    direction: 'short',
    displayName: 'Donchian Breakout (Short)',
    detector: (window) => {
      if (window.length < 10) return { detected: false, pivots: [] };
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      const lookbackLows = lows.slice(0, -2);
      const recentLow = Math.min(...lookbackLows);
      const recentLowIdx = lookbackLows.indexOf(recentLow);
      const currentClose = closes[closes.length - 1];
      const detected = currentClose < recentLow * 0.999;
      return {
        detected,
        patternStartIndex: recentLowIdx,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: recentLowIdx, price: recentLow, type: 'low', label: 'Breakdown Level' },
          { index: window.length - 1, price: currentClose, type: 'low', label: 'Entry' }
        ] : []
      };
    }
  }
};

// ============= HELPER FUNCTIONS =============
function calculateATR(bars: OHLCBar[], period = 14): number {
  if (bars.length < period + 1) return 0;
  let atrSum = 0;
  for (let i = bars.length - period; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1]?.close || bars[i].open;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    atrSum += tr;
  }
  return atrSum / period;
}

function getAssetType(symbol: string): string {
  if (symbol.includes('-USD')) return 'crypto';
  if (symbol.includes('=X')) return 'fx';
  if (['GC=F', 'SI=F', 'CL=F', 'NG=F', 'HG=F', 'PL=F'].some(c => symbol.includes(c.split('=')[0]))) return 'commodities';
  return 'stocks';
}

async function fetchYahooData(symbol: string, startDate: string, endDate: string): Promise<OHLCBar[]> {
  const period1 = Math.floor(new Date(startDate).getTime() / 1000);
  const period2 = Math.floor(new Date(endDate).getTime() / 1000);
  
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
  
  const response = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });
  
  if (!response.ok) return [];
  
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
}

// ============= BACKTEST WITH OUTCOME TRACKING =============
interface HistoricalOccurrence {
  symbol: string;
  asset_type: string;
  pattern_id: string;
  pattern_name: string;
  direction: string;
  timeframe: string;
  detected_at: string;
  pattern_start_date: string;
  pattern_end_date: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  bars: OHLCBar[];
  visual_spec: any;
  quality_score: string;
  quality_reasons: string[];
  outcome: 'win' | 'loss' | 'pending' | null;
  outcome_price: number | null;
  outcome_date: string | null;
  outcome_pnl_percent: number | null;
  bars_to_outcome: number | null;
  // NEW: Trend alignment fields
  trend_alignment: TrendAlignment | null;
  trend_indicators: TrendIndicators | null;
}

function runHistoricalBacktest(
  bars: OHLCBar[],
  symbol: string,
  patternId: string,
  pattern: { direction: 'long' | 'short'; displayName: string; detector: (w: OHLCBar[]) => PatternDetectionResult },
  lookback: number = 25,
  maxBarsInTrade: number = 100
): HistoricalOccurrence[] {
  const occurrences: HistoricalOccurrence[] = [];
  const assetType = getAssetType(symbol);
  
  for (let i = lookback; i < bars.length - maxBarsInTrade; i++) {
    const window = bars.slice(i - lookback, i + 1);
    const detectionResult = pattern.detector(window);
    
    if (!detectionResult.detected) continue;
    
    const entryBar = bars[i];
    const entryPrice = entryBar.close;
    const atr = calculateATR(bars.slice(0, i + 1), 14);
    
    if (atr <= 0) continue;
    
    // Calculate SL/TP using ATR-based brackets
    const stopDistance = atr * 2;
    const tpDistance = atr * 4; // 2R
    
    const isLong = pattern.direction === 'long';
    const stopLoss = isLong ? entryPrice - stopDistance : entryPrice + stopDistance;
    const takeProfit = isLong ? entryPrice + tpDistance : entryPrice - tpDistance;
    const riskReward = tpDistance / stopDistance;
    
    // Simulate trade outcome (DB constraint requires hit_tp, hit_sl, timeout, pending, invalidated)
    let outcome: 'hit_tp' | 'hit_sl' | 'timeout' | 'pending' | null = null;
    let outcomePrice: number | null = null;
    let outcomeDate: string | null = null;
    let barsToOutcome: number | null = null;
    
    for (let j = i + 1; j < Math.min(i + maxBarsInTrade, bars.length); j++) {
      const bar = bars[j];
      
      if (isLong) {
        if (bar.low <= stopLoss) {
          outcome = 'hit_sl';
          outcomePrice = stopLoss;
          outcomeDate = bar.date;
          barsToOutcome = j - i;
          break;
        }
        if (bar.high >= takeProfit) {
          outcome = 'hit_tp';
          outcomePrice = takeProfit;
          outcomeDate = bar.date;
          barsToOutcome = j - i;
          break;
        }
      } else {
        if (bar.high >= stopLoss) {
          outcome = 'hit_sl';
          outcomePrice = stopLoss;
          outcomeDate = bar.date;
          barsToOutcome = j - i;
          break;
        }
        if (bar.low <= takeProfit) {
          outcome = 'hit_tp';
          outcomePrice = takeProfit;
          outcomeDate = bar.date;
          barsToOutcome = j - i;
          break;
        }
      }
    }
    
    // Calculate PnL %
    let outcomePnl: number | null = null;
    if (outcome && outcomePrice) {
      const pnl = isLong ? outcomePrice - entryPrice : entryPrice - outcomePrice;
      outcomePnl = (pnl / entryPrice) * 100;
    }
    
    // Score pattern quality
    const patternStartIdx = detectionResult.patternStartIndex ?? 0;
    const patternEndIdx = detectionResult.patternEndIndex ?? window.length - 1;
    
    const qualityInput: PatternQualityScorerInput = {
      bars: window,
      patternType: patternId,
      patternStartIndex: patternStartIdx,
      patternEndIndex: patternEndIdx,
      direction: pattern.direction,
      entryPrice,
      stopLoss,
      takeProfit,
      atr
    };
    
    const qualityResult = calculatePatternQualityScore(qualityInput);
    
    // Build visual spec with pivot markers and trade lifecycle info
    const visualSpec = {
      timeframe: '1d',
      entryPrice,
      stopLoss,
      takeProfit,
      outcome,
      outcomePrice,
      outcomeDate,
      barsToOutcome,
      pivots: detectionResult.pivots.map(p => ({
        ...p,
        timestamp: window[p.index]?.date || entryBar.date
      })),
      lines: [
        { y: entryPrice, color: '#3b82f6', label: 'Entry', style: 'solid' },
        { y: stopLoss, color: '#ef4444', label: 'Stop Loss', style: 'dashed' },
        { y: takeProfit, color: '#22c55e', label: 'Take Profit', style: 'dashed' }
      ]
    };
    
    // Store pattern bars (last 30 before entry) + bars through outcome (or max 50 after)
    // This ensures the chart shows the complete trade lifecycle from entry to exit
    const lookbackBars = 30;
    const startIdx = Math.max(0, i - lookbackBars);
    const endIdx = barsToOutcome 
      ? Math.min(i + barsToOutcome + 1, bars.length) // Include up to outcome bar
      : Math.min(i + 50, bars.length); // Default 50 bars forward if no outcome
    const patternBars = bars.slice(startIdx, endIdx);
    
    // Calculate entry bar index within the stored bars array
    const entryBarIndex = i - startIdx;
    
    // NEW: Calculate trend alignment using full available history up to entry point
    // Need 200+ bars for 200 EMA calculation - only compute if we have enough data
    const trendBars = bars.slice(Math.max(0, i - 250), i + 1);
    // analyzePatternTrend requires 200+ bars, so only attempt if we have enough
    const trendAnalysis = trendBars.length >= 200 
      ? analyzePatternTrend(trendBars, pattern.direction)
      : null;
    
    occurrences.push({
      symbol,
      asset_type: assetType,
      pattern_id: patternId,
      pattern_name: pattern.displayName,
      direction: pattern.direction,
      timeframe: '1d',
      detected_at: entryBar.date,
      pattern_start_date: bars[Math.max(0, i - lookback)]?.date || entryBar.date,
      pattern_end_date: entryBar.date,
      entry_price: entryPrice,
      stop_loss_price: stopLoss,
      take_profit_price: takeProfit,
      risk_reward_ratio: riskReward,
      bars: patternBars,
      visual_spec: { ...visualSpec, entryBarIndex },
      quality_score: qualityResult.grade,
      quality_reasons: qualityResult.factors.filter(f => f.passed).map(f => f.description),
      outcome,
      outcome_price: outcomePrice,
      outcome_date: outcomeDate,
      outcome_pnl_percent: outcomePnl,
      bars_to_outcome: barsToOutcome,
      // NEW: Trend alignment
      trend_alignment: trendAnalysis?.alignment || null,
      trend_indicators: trendAnalysis?.indicators || null
    });
    
    // Skip ahead to avoid overlapping detections
    i += 5;
  }
  
  return occurrences;
}

// ============= MAIN HANDLER =============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const {
      assetTypes = ['stocks', 'crypto', 'fx', 'commodities'],
      lookbackYears = 5,
      maxInstrumentsPerType = 25,
      patterns = Object.keys(PATTERN_REGISTRY),
      dryRun = false,
      offset = 0 // For pagination - process instruments starting from offset
    } = body;

    console.log(`Starting historical pattern backtest: ${lookbackYears} years, ${assetTypes.join(', ')}, ${patterns.length} patterns, offset=${offset}`);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - lookbackYears);

    // Collect instruments from each asset type
    const allInstruments: { symbol: string; assetType: string }[] = [];
    
    for (const assetType of assetTypes) {
      const instruments = ALL_INSTRUMENTS[assetType as keyof typeof ALL_INSTRUMENTS] || [];
      const limited = instruments.slice(0, maxInstrumentsPerType);
      limited.forEach(inst => {
        allInstruments.push({ symbol: inst.yahooSymbol, assetType });
      });
    }

    // Apply offset for pagination
    const MAX_PER_RUN = 15; // Process max 15 instruments per invocation to stay within compute limits
    const instrumentsToProcess = allInstruments.slice(offset, offset + MAX_PER_RUN);
    const hasMore = offset + MAX_PER_RUN < allInstruments.length;
    const nextOffset = offset + MAX_PER_RUN;

    console.log(`Processing instruments ${offset} to ${offset + instrumentsToProcess.length} of ${allInstruments.length}...`);

    const allOccurrences: HistoricalOccurrence[] = [];
    const errors: string[] = [];
    let processedCount = 0;

    // Process instruments sequentially to avoid memory issues
    for (const { symbol } of instrumentsToProcess) {
      try {
        console.log(`Fetching ${symbol}...`);
        const bars = await fetchYahooData(symbol, startDate.toISOString(), endDate.toISOString());
        
        if (bars.length < 100) {
          console.log(`Skipping ${symbol}: insufficient data (${bars.length} bars)`);
          continue;
        }
        
        // Run each pattern detector
        for (const patternId of patterns) {
          const patternDef = PATTERN_REGISTRY[patternId];
          if (!patternDef) continue;
          
          const occurrences = runHistoricalBacktest(bars, symbol, patternId, patternDef);
          allOccurrences.push(...occurrences);
        }
        
        processedCount++;
        console.log(`Processed ${symbol}: ${allOccurrences.length} total occurrences so far`);
        
        // Small delay between instruments to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        errors.push(`${symbol}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`Detection complete: ${allOccurrences.length} patterns found from ${processedCount} instruments`);

    if (dryRun) {
      return new Response(JSON.stringify({
        dryRun: true,
        totalOccurrences: allOccurrences.length,
        hasMore,
        nextOffset: hasMore ? nextOffset : null,
        totalInstruments: allInstruments.length,
        byPattern: patterns.reduce((acc, p) => {
          acc[p] = allOccurrences.filter(o => o.pattern_id === p).length;
          return acc;
        }, {} as Record<string, number>),
        byAssetType: assetTypes.reduce((acc, t) => {
          acc[t] = allOccurrences.filter(o => o.asset_type === t).length;
          return acc;
        }, {} as Record<string, number>),
        sampleOccurrences: allOccurrences.slice(0, 5),
        errors: errors.slice(0, 20)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insert into database in chunks using regular insert
    const CHUNK_SIZE = 50;
    let insertedCount = 0;
    const allInsertedIds: string[] = [];
    
    for (let i = 0; i < allOccurrences.length; i += CHUNK_SIZE) {
      const chunk = allOccurrences.slice(i, i + CHUNK_SIZE);
      
      const { data, error: insertError } = await supabase
        .from('historical_pattern_occurrences')
        .insert(chunk.map(occ => ({
          symbol: occ.symbol,
          asset_type: occ.asset_type,
          pattern_id: occ.pattern_id,
          pattern_name: occ.pattern_name,
          direction: occ.direction === 'long' ? 'bullish' : 'bearish',
          timeframe: occ.timeframe,
          detected_at: occ.detected_at,
          pattern_start_date: occ.pattern_start_date,
          pattern_end_date: occ.pattern_end_date,
          entry_price: occ.entry_price,
          stop_loss_price: occ.stop_loss_price,
          take_profit_price: occ.take_profit_price,
          risk_reward_ratio: occ.risk_reward_ratio,
          bars: occ.bars,
          visual_spec: occ.visual_spec,
          quality_score: occ.quality_score,
          quality_reasons: occ.quality_reasons,
          outcome: occ.outcome,
          outcome_price: occ.outcome_price,
          outcome_date: occ.outcome_date,
          outcome_pnl_percent: occ.outcome_pnl_percent,
          bars_to_outcome: occ.bars_to_outcome,
          trend_alignment: occ.trend_alignment,
          trend_indicators: occ.trend_indicators,
          validation_status: 'pending',
          validation_layers_passed: ['bulkowski_engine'],
        })))
        .select('id');
      
      if (insertError) {
        console.error(`Insert error at chunk ${i / CHUNK_SIZE}:`, insertError);
      } else {
        insertedCount += chunk.length;
        if (data) allInsertedIds.push(...data.map((r: any) => r.id));
      }
    }

    // Trigger async pipeline validation for inserted patterns (background, non-blocking)
    if (allInsertedIds.length > 0) {
      const validationPromise = (async () => {
        try {
          // Validate in batches of 50
          const VALIDATION_BATCH = 50;
          for (let i = 0; i < Math.min(allInsertedIds.length, 200); i += VALIDATION_BATCH) {
            const batchIds = allInsertedIds.slice(i, i + VALIDATION_BATCH);
            const batchOccs = allOccurrences.slice(i, i + VALIDATION_BATCH);
            
            const detections = batchIds.map((id, idx) => {
              const occ = batchOccs[idx];
              if (!occ?.bars?.length) return null;
              return {
                detection_id: id,
                detection_source: 'historical',
                pattern_name: occ.pattern_id,
                direction: occ.direction === 'long' ? 'bullish' : 'bearish',
                entry_price: occ.entry_price,
                stop_loss_price: occ.stop_loss_price,
                take_profit_price: occ.take_profit_price,
                symbol: occ.symbol,
                timeframe: occ.timeframe,
                bars: occ.bars.slice(-60),
                quality_score: occ.quality_score,
                trend_alignment: occ.trend_alignment,
              };
            }).filter(Boolean);
            
            if (detections.length) {
              await supabase.functions.invoke('validate-pattern-context', { body: { detections } });
            }
          }
          console.info(`[pipeline] Historical validation triggered for ${Math.min(allInsertedIds.length, 200)} patterns`);
        } catch (err) {
          console.error('[pipeline] Historical validation error:', err);
        }
      })();
      
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(validationPromise);
      }
    }

    console.log(`Inserted ${insertedCount} occurrences into database`);

    // Compute statistics (using new outcome names)
    const winCount = allOccurrences.filter(o => o.outcome === 'hit_tp').length;
    const lossCount = allOccurrences.filter(o => o.outcome === 'hit_sl').length;
    const totalWithOutcome = winCount + lossCount;
    const winRate = totalWithOutcome > 0 ? (winCount / totalWithOutcome * 100).toFixed(1) : 'N/A';

    return new Response(JSON.stringify({
      success: true,
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
      totalInstruments: allInstruments.length,
      currentBatch: { start: offset, end: offset + instrumentsToProcess.length },
      summary: {
        instrumentsProcessed: processedCount,
        totalOccurrences: allOccurrences.length,
        insertedCount,
        winCount,
        lossCount,
        winRate: `${winRate}%`,
        lookbackYears,
        assetTypes,
        patternsScanned: patterns.length
      },
      byPattern: patterns.reduce((acc, p) => {
        const patternOccs = allOccurrences.filter(o => o.pattern_id === p);
        const wins = patternOccs.filter(o => o.outcome === 'hit_tp').length;
        const losses = patternOccs.filter(o => o.outcome === 'hit_sl').length;
        acc[p] = {
          count: patternOccs.length,
          wins,
          losses,
          winRate: wins + losses > 0 ? `${(wins / (wins + losses) * 100).toFixed(1)}%` : 'N/A'
        };
        return acc;
      }, {} as Record<string, any>),
      errors: errors.slice(0, 20)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Historical pattern seeder error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
