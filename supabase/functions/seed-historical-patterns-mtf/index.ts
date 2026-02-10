import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ALL_INSTRUMENTS, type Instrument } from "../_shared/screenerInstruments.ts";
import { computeBracketLevels, BRACKET_LEVELS_VERSION } from "../_shared/bracketLevels.ts";
import { 
  calculatePatternQualityScore, 
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

// All detectable patterns (copied from seed-historical-patterns for bundle independence)
const PATTERN_REGISTRY: Record<string, { 
  direction: 'long' | 'short'; 
  displayName: string; 
  detector: (w: OHLCBar[]) => PatternDetectionResult 
}> = {
  'double-top': {
    direction: 'short',
    displayName: 'Double Top',
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
      const symmetryOk = shoulderDiff / range < 0.25;
      const headHigherOk = head.value > leftShoulder.value * 1.02 && head.value > rightShoulder.value * 1.02;
      
      if (!symmetryOk || !headHigherOk) return { detected: false, pivots: [] };
      
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
      const symmetryOk = shoulderDiff / range < 0.25;
      const headLowerOk = head.value < leftShoulder.value * 0.98 && head.value < rightShoulder.value * 0.98;
      
      if (!symmetryOk || !headLowerOk) return { detected: false, pivots: [] };
      
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
      
      const upperRising = avgSecondHigh > avgFirstHigh;
      const lowerRising = avgSecondLow > avgFirstLow;
      
      const firstRange = avgFirstHigh - avgFirstLow;
      const secondRange = avgSecondHigh - avgSecondLow;
      const converging = secondRange < firstRange * 0.85;
      
      const lastClose = closes[closes.length - 1];
      const detected = upperRising && lowerRising && converging && lastClose < avgSecondLow * 0.998;
      
      return {
        detected,
        patternStartIndex: 0,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: 0, price: avgFirstHigh, type: 'high', label: 'Upper Trend Start' },
          { index: window.length - 1, price: avgSecondHigh, type: 'high', label: 'Upper Trend End' }
        ] : []
      };
    }
  },
  'falling-wedge': {
    direction: 'long',
    displayName: 'Falling Wedge',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
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
      
      const upperFalling = avgSecondHigh < avgFirstHigh;
      const lowerFalling = avgSecondLow < avgFirstLow;
      
      const firstRange = avgFirstHigh - avgFirstLow;
      const secondRange = avgSecondHigh - avgSecondLow;
      const converging = secondRange < firstRange * 0.85;
      
      const lastClose = closes[closes.length - 1];
      const detected = upperFalling && lowerFalling && converging && lastClose > avgSecondHigh * 1.002;
      
      return {
        detected,
        patternStartIndex: 0,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: 0, price: avgFirstHigh, type: 'high', label: 'Upper Trend Start' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' }
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
          { index: recentHighIdx, price: recentHigh, type: 'high', label: 'Breakout Level' },
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
  },
  'bull-flag': {
    direction: 'long',
    displayName: 'Bull Flag',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      
      // Flagpole: Strong uptrend in first 8 bars (at least 5% gain)
      const poleStart = 0;
      const poleEnd = 7;
      const poleGain = (closes[poleEnd] - closes[poleStart]) / closes[poleStart];
      if (poleGain < 0.05) return { detected: false, pivots: [] };
      
      // Flag: Consolidation/pullback in bars 8-18 (range < 4% and slight downward drift)
      const flagBars = closes.slice(8, 18);
      const flagHighs = highs.slice(8, 18);
      const flagLows = lows.slice(8, 18);
      const flagHigh = Math.max(...flagHighs);
      const flagLow = Math.min(...flagLows);
      const flagRange = (flagHigh - flagLow) / flagLow;
      const flagDrift = (flagBars[flagBars.length - 1] - flagBars[0]) / flagBars[0];
      
      if (flagRange > 0.04 || flagDrift > 0.02) return { detected: false, pivots: [] };
      
      // Breakout: Last close breaks above flag high
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > flagHigh * 1.005;
      
      return {
        detected,
        patternStartIndex: poleStart,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: poleStart, price: closes[poleStart], type: 'low', label: 'Pole Start' },
          { index: poleEnd, price: closes[poleEnd], type: 'high', label: 'Pole End' },
          { index: 8, price: flagHigh, type: 'high', label: 'Flag High' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' }
        ] : []
      };
    }
  },
  'bear-flag': {
    direction: 'short',
    displayName: 'Bear Flag',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      
      // Flagpole: Strong downtrend in first 8 bars (at least 5% drop)
      const poleStart = 0;
      const poleEnd = 7;
      const poleDrop = (closes[poleStart] - closes[poleEnd]) / closes[poleStart];
      if (poleDrop < 0.05) return { detected: false, pivots: [] };
      
      // Flag: Consolidation/bounce in bars 8-18 (range < 4% and slight upward drift)
      const flagBars = closes.slice(8, 18);
      const flagHighs = highs.slice(8, 18);
      const flagLows = lows.slice(8, 18);
      const flagHigh = Math.max(...flagHighs);
      const flagLow = Math.min(...flagLows);
      const flagRange = (flagHigh - flagLow) / flagLow;
      const flagDrift = (flagBars[flagBars.length - 1] - flagBars[0]) / flagBars[0];
      
      if (flagRange > 0.04 || flagDrift < -0.02) return { detected: false, pivots: [] };
      
      // Breakdown: Last close breaks below flag low
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < flagLow * 0.995;
      
      return {
        detected,
        patternStartIndex: poleStart,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: poleStart, price: closes[poleStart], type: 'high', label: 'Pole Start' },
          { index: poleEnd, price: closes[poleEnd], type: 'low', label: 'Pole End' },
          { index: 8, price: flagLow, type: 'low', label: 'Flag Low' },
          { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
        ] : []
      };
    }
  },
  'cup-and-handle': {
    direction: 'long',
    displayName: 'Cup & Handle',
    detector: (window) => {
      // Relaxed: 20 bars minimum (was 30)
      if (window.length < 20) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      
      // Dynamic window sizing for flexibility
      const cupEnd = Math.floor(window.length * 0.7);
      const handleStart = Math.floor(window.length * 0.75);
      
      // Cup: Find U-shaped formation (rims at similar levels, bottom 7-40% below rims)
      const leftRim = Math.max(...highs.slice(0, 4));
      const rightRimArea = highs.slice(Math.floor(cupEnd * 0.8), cupEnd);
      const rightRim = rightRimArea.length > 0 ? Math.max(...rightRimArea) : 0;
      const cupMiddle = lows.slice(3, cupEnd - 2);
      const cupBottom = cupMiddle.length > 0 ? Math.min(...cupMiddle) : 0;
      
      if (cupBottom === 0) return { detected: false, pivots: [] };
      
      const rimDiff = Math.abs(leftRim - rightRim) / leftRim;
      const cupDepth = (Math.min(leftRim, rightRim) - cupBottom) / Math.min(leftRim, rightRim);
      
      // Relaxed: rimDiff 8% (was 5%), cupDepth 7-40% (was 10-35%)
      if (rimDiff > 0.08 || cupDepth < 0.07 || cupDepth > 0.40) return { detected: false, pivots: [] };
      
      // Handle: Small pullback after right rim (relaxed: 3-60% of cup depth)
      const handleLows = lows.slice(handleStart, window.length - 1);
      if (handleLows.length === 0) return { detected: false, pivots: [] };
      const handleLow = Math.min(...handleLows);
      const handleDepth = (rightRim - handleLow) / (rightRim - cupBottom);
      
      // Relaxed handle depth range
      if (handleDepth < 0.03 || handleDepth > 0.60) return { detected: false, pivots: [] };
      
      // Breakout: Last close breaks above right rim (relaxed: 0.1% vs 0.2%)
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > rightRim * 1.001;
      
      const leftRimIdx = highs.slice(0, 4).indexOf(leftRim);
      const cupBottomIdx = 3 + cupMiddle.indexOf(cupBottom);
      const rightRimStartIdx = Math.floor(cupEnd * 0.8);
      const rightRimIdx = rightRimStartIdx + rightRimArea.indexOf(rightRim);
      
      return {
        detected,
        patternStartIndex: leftRimIdx,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: leftRimIdx, price: leftRim, type: 'high', label: 'Left Rim' },
          { index: cupBottomIdx, price: cupBottom, type: 'low', label: 'Cup Bottom' },
          { index: rightRimIdx, price: rightRim, type: 'high', label: 'Right Rim' },
          { index: handleStart + handleLows.indexOf(handleLow), price: handleLow, type: 'low', label: 'Handle' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' }
        ] : []
      };
    }
  },
  'triple-top': {
    direction: 'short',
    displayName: 'Triple Top',
    detector: (window) => {
      if (window.length < 25) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // Find 3 significant peaks
      const peaks: { index: number; value: number }[] = [];
      for (let i = 2; i < window.length - 2; i++) {
        if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
            highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
          peaks.push({ index: i, value: highs[i] });
        }
      }
      
      if (peaks.length < 3) return { detected: false, pivots: [] };
      
      // Check last 3 peaks are at similar levels (within 3% range)
      const lastThreePeaks = peaks.slice(-3);
      const peakValues = lastThreePeaks.map(p => p.value);
      const maxPeak = Math.max(...peakValues);
      const minPeak = Math.min(...peakValues);
      const allSimilar = (maxPeak - minPeak) / minPeak < 0.03;
      
      if (!allSimilar) return { detected: false, pivots: [] };
      
      // Find neckline (lowest low between first and last peak)
      let neckline = Infinity;
      let necklineIdx = lastThreePeaks[0].index;
      for (let i = lastThreePeaks[0].index; i <= lastThreePeaks[2].index; i++) {
        if (lows[i] < neckline) {
          neckline = lows[i];
          necklineIdx = i;
        }
      }
      
      // Breakdown confirmation
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < neckline * 0.998;
      
      return {
        detected,
        patternStartIndex: lastThreePeaks[0].index - 2,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: lastThreePeaks[0].index, price: lastThreePeaks[0].value, type: 'high', label: 'Top 1' },
          { index: lastThreePeaks[1].index, price: lastThreePeaks[1].value, type: 'high', label: 'Top 2' },
          { index: lastThreePeaks[2].index, price: lastThreePeaks[2].value, type: 'high', label: 'Top 3' },
          { index: necklineIdx, price: neckline, type: 'low', label: 'Neckline' }
        ] : []
      };
    }
  },
  'triple-bottom': {
    direction: 'long',
    displayName: 'Triple Bottom',
    detector: (window) => {
      if (window.length < 25) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // Find 3 significant troughs
      const troughs: { index: number; value: number }[] = [];
      for (let i = 2; i < window.length - 2; i++) {
        if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
            lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
          troughs.push({ index: i, value: lows[i] });
        }
      }
      
      if (troughs.length < 3) return { detected: false, pivots: [] };
      
      // Check last 3 troughs are at similar levels (within 3% range)
      const lastThreeTroughs = troughs.slice(-3);
      const avgTrough = lastThreeTroughs.reduce((a, t) => a + t.value, 0) / 3;
      const allSimilar = lastThreeTroughs.every(t => Math.abs(t.value - avgTrough) / avgTrough < 0.03);
      
      if (!allSimilar) return { detected: false, pivots: [] };
      
      // Find neckline (highest high between first and last trough)
      let neckline = -Infinity;
      let necklineIdx = lastThreeTroughs[0].index;
      for (let i = lastThreeTroughs[0].index; i <= lastThreeTroughs[2].index; i++) {
        if (highs[i] > neckline) {
          neckline = highs[i];
          necklineIdx = i;
        }
      }
      
      // Breakout confirmation
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > neckline * 1.002;
      
      return {
        detected,
        patternStartIndex: lastThreeTroughs[0].index - 2,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: lastThreeTroughs[0].index, price: lastThreeTroughs[0].value, type: 'low', label: 'Bottom 1' },
          { index: lastThreeTroughs[1].index, price: lastThreeTroughs[1].value, type: 'low', label: 'Bottom 2' },
          { index: lastThreeTroughs[2].index, price: lastThreeTroughs[2].value, type: 'low', label: 'Bottom 3' },
          { index: necklineIdx, price: neckline, type: 'high', label: 'Neckline' }
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

// Timeframe to EODHD/Yahoo interval mapping
const TF_TO_EODHD_INTERVAL: Record<string, string> = {
  '1h': '1h',
  '4h': '1h', // Aggregate from 1h
  '1d': 'd',
  '1wk': 'w'
};

const TF_TO_YAHOO_INTERVAL: Record<string, string> = {
  '1h': '1h',
  '4h': '1h',
  '1d': '1d',
  '1wk': '1wk'
};

// Data retention limits by timeframe (EODHD has much higher limits than Yahoo)
const TF_DATA_LIMITS: Record<string, { rangeDays: number; maxBars: number }> = {
  '1h': { rangeDays: 120, maxBars: 2000 },      // EODHD: up to 120 days intraday
  '4h': { rangeDays: 120, maxBars: 500 },       // 4h: ~120 days
  '1d': { rangeDays: 365 * 10, maxBars: 2600 }, // 10+ years
  '1wk': { rangeDays: 365 * 10, maxBars: 520 }  // 10+ years
};

// Aggregate 1h bars to 4h bars
function aggregate1hTo4h(bars: OHLCBar[]): OHLCBar[] {
  const result: OHLCBar[] = [];
  for (let i = 0; i < bars.length; i += 4) {
    const chunk = bars.slice(i, Math.min(i + 4, bars.length));
    if (chunk.length === 0) continue;
    
    result.push({
      date: chunk[0].date,
      open: chunk[0].open,
      high: Math.max(...chunk.map(b => b.high)),
      low: Math.min(...chunk.map(b => b.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((sum, b) => sum + (b.volume || 0), 0)
    });
  }
  return result;
}

/**
 * Convert symbol to EODHD format
 */
function toEODHDSymbol(symbol: string): string {
  if (symbol.includes('-USD')) {
    const crypto = symbol.replace('-USD', '');
    return `${crypto}-USD.CC`;
  }
  if (symbol.includes('=X')) {
    const pair = symbol.replace('=X', '');
    return `${pair}.FOREX`;
  }
  if (symbol.includes('=F')) {
    const commodity = symbol.replace('=F', '');
    return `${commodity}.COMM`;
  }
  if (symbol.startsWith('^')) {
    const index = symbol.replace('^', '');
    return `${index}.INDX`;
  }
  return `${symbol}.US`;
}

/**
 * Fetch data from EODHD (primary provider - 100k calls/day)
 */
async function fetchEODHDData(symbol: string, timeframe: string, fromTimestamp?: number): Promise<OHLCBar[]> {
  const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
  if (!EODHD_API_KEY) {
    console.log('[EODHD] API key not configured, falling back to Yahoo');
    return [];
  }
  
  const limits = TF_DATA_LIMITS[timeframe] || TF_DATA_LIMITS['1d'];
  const endDate = new Date();
  
  let startDate: Date;
  if (fromTimestamp) {
    startDate = new Date(fromTimestamp);
  } else {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - limits.rangeDays);
  }
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const eodhSymbol = toEODHDSymbol(symbol);
  const isIntraday = ['1h', '4h'].includes(timeframe);
  const eodhInterval = timeframe === '4h' ? '1h' : TF_TO_EODHD_INTERVAL[timeframe];
  
  let url: string;
  if (isIntraday) {
    url = `https://eodhd.com/api/intraday/${eodhSymbol}?api_token=${EODHD_API_KEY}&interval=${eodhInterval}&from=${startStr}&to=${endStr}&fmt=json`;
  } else {
    url = `https://eodhd.com/api/eod/${eodhSymbol}?api_token=${EODHD_API_KEY}&from=${startStr}&to=${endStr}&period=${eodhInterval}&fmt=json`;
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`[EODHD] Error for ${symbol}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return [];
    
    let bars: OHLCBar[];
    if (isIntraday) {
      bars = data
        .filter((bar: any) => bar.close && Number.isFinite(bar.close))
        .map((bar: any) => ({
          date: bar.datetime || new Date(bar.timestamp * 1000).toISOString(),
          open: Number(bar.open),
          high: Number(bar.high),
          low: Number(bar.low),
          close: Number(bar.close),
          volume: Number(bar.volume) || 0,
        }));
    } else {
      bars = data
        .filter((bar: any) => bar.close && Number.isFinite(bar.close))
        .map((bar: any) => ({
          date: new Date(bar.date).toISOString(),
          open: Number(bar.open),
          high: Number(bar.high),
          low: Number(bar.low),
          close: Number(bar.adjusted_close || bar.close),
          volume: Number(bar.volume) || 0,
        }));
    }
    
    if (timeframe === '4h') {
      bars = aggregate1hTo4h(bars);
    }
    
    console.log(`[EODHD] Fetched ${bars.length} bars for ${symbol}@${timeframe}`);
    return bars;
  } catch (error) {
    console.error(`[EODHD] Error fetching ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch data from Yahoo Finance (fallback provider)
 */
async function fetchYahooData(symbol: string, timeframe: string, fromTimestamp?: number): Promise<OHLCBar[]> {
  // Yahoo has stricter limits for intraday
  const yahooLimits: Record<string, { rangeDays: number }> = {
    '1h': { rangeDays: 30 },
    '4h': { rangeDays: 60 },
    '1d': { rangeDays: 365 * 5 },
    '1wk': { rangeDays: 365 * 5 }
  };
  
  const limits = yahooLimits[timeframe] || yahooLimits['1d'];
  const endDate = new Date();
  
  let startDate: Date;
  if (fromTimestamp) {
    startDate = new Date(fromTimestamp);
  } else {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - limits.rangeDays);
  }
  
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  
  const yahooInterval = timeframe === '4h' ? '1h' : TF_TO_YAHOO_INTERVAL[timeframe];
  const encodedSymbol = encodeURIComponent(symbol);
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?period1=${period1}&period2=${period2}&interval=${yahooInterval}&events=history`;
  
  try {
    const response = await fetch(yahooUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.chart?.result?.[0]) return [];
    
    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    let bars = timestamps.map((ts: number, idx: number) => ({
      date: new Date(ts * 1000).toISOString(),
      open: quotes.open?.[idx] || 0,
      high: quotes.high?.[idx] || 0,
      low: quotes.low?.[idx] || 0,
      close: quotes.close?.[idx] || 0,
      volume: quotes.volume?.[idx] || 0,
    })).filter((b: OHLCBar) => b.close > 0);
    
    if (timeframe === '4h') {
      bars = aggregate1hTo4h(bars);
    }
    
    console.log(`[Yahoo] Fetched ${bars.length} bars for ${symbol}@${timeframe}`);
    return bars;
  } catch (error) {
    console.error(`[Yahoo] Error fetching ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch data with EODHD as primary, Yahoo as fallback
 */
async function fetchMarketData(symbol: string, timeframe: string, fromTimestamp?: number): Promise<OHLCBar[]> {
  // Try EODHD first (100k calls/day limit)
  let bars = await fetchEODHDData(symbol, timeframe, fromTimestamp);
  
  // Fallback to Yahoo if EODHD fails
  if (bars.length === 0) {
    console.log(`[Provider] EODHD failed for ${symbol}, trying Yahoo fallback`);
    bars = await fetchYahooData(symbol, timeframe, fromTimestamp);
  }
  
  return bars;
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
  outcome: 'hit_tp' | 'hit_sl' | 'timeout' | 'pending' | null;
  outcome_price: number | null;
  outcome_date: string | null;
  outcome_pnl_percent: number | null;
  bars_to_outcome: number | null;
  trend_alignment: TrendAlignment | null;
  trend_indicators: TrendIndicators | null;
}

function runHistoricalBacktest(
  bars: OHLCBar[],
  symbol: string,
  patternId: string,
  pattern: { direction: 'long' | 'short'; displayName: string; detector: (w: OHLCBar[]) => PatternDetectionResult },
  timeframe: string,
  assetType?: string,
  lookback: number = 25,
  maxBarsInTrade: number = 100
): HistoricalOccurrence[] {
  const occurrences: HistoricalOccurrence[] = [];
  const resolvedAssetType = assetType || getAssetType(symbol);
  
  // Adjust max bars in trade based on timeframe
  const tfMaxBars = {
    '1h': 48,   // 2 days
    '4h': 30,   // 5 days
    '1d': 100,  // 100 days
    '1wk': 52   // 1 year
  };
  maxBarsInTrade = tfMaxBars[timeframe as keyof typeof tfMaxBars] || maxBarsInTrade;
  
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
    
    // Simulate trade outcome
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
    
    // If no outcome after max bars, mark as timeout
    if (!outcome && i + maxBarsInTrade < bars.length) {
      outcome = 'timeout';
      outcomePrice = bars[i + maxBarsInTrade].close;
      outcomeDate = bars[i + maxBarsInTrade].date;
      barsToOutcome = maxBarsInTrade;
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
    
    // Build visual spec with trade lifecycle info
    // entryBarIndex will be calculated after we know startIdx
    const visualSpec = {
      timeframe,
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
    
    // Store pattern bars (last 30 before entry) + bars through outcome (or max 50 after entry)
    // This ensures the chart shows the complete trade lifecycle from entry to exit
    const lookbackBars = 30;
    const startIdx = Math.max(0, i - lookbackBars);
    const endIdx = barsToOutcome 
      ? Math.min(i + barsToOutcome + 1, bars.length) // Include up to outcome bar
      : Math.min(i + 50, bars.length); // Default 50 bars forward if no outcome
    const patternBars = bars.slice(startIdx, endIdx);
    
    // Calculate entry bar index within the stored bars array
    const entryBarIndex = i - startIdx;
    
    // Trend analysis (needs 200+ bars for 200 EMA)
    const trendBars = bars.slice(Math.max(0, i - 250), i + 1);
    const trendAnalysis = trendBars.length >= 200 
      ? analyzePatternTrend(trendBars, pattern.direction)
      : null;
    
    occurrences.push({
      symbol,
      asset_type: resolvedAssetType,
      pattern_id: patternId,
      pattern_name: pattern.displayName,
      direction: pattern.direction,
      timeframe,
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
      trend_alignment: trendAnalysis?.alignment || null,
      trend_indicators: trendAnalysis?.indicators || null
    });
    
    // Skip ahead to avoid overlapping detections
    i += 5;
  }
  
  return occurrences;
}

// ============= INCREMENTAL MODE HELPERS =============

/**
 * Get the latest seeded date for a symbol/timeframe combination
 */
async function getLastSeededDate(
  supabase: any,
  symbol: string,
  timeframe: string
): Promise<Date | null> {
  const { data, error } = await supabase
    .from('historical_pattern_occurrences')
    .select('detected_at')
    .eq('symbol', symbol)
    .eq('timeframe', timeframe)
    .order('detected_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }
  
  return new Date(data[0].detected_at);
}

/**
 * Calculate lookback days based on timeframe for full backfill
 */
function getFullBackfillDays(timeframe: string): number {
  switch (timeframe) {
    case '1h': return 730;    // 2 years (Yahoo limit for hourly)
    case '4h': return 730;    // 2 years (aggregated from 1h)
    case '1d': return 1825;   // 5 years
    case '1wk': return 2555;  // 7 years
    default: return 1825;
  }
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
      timeframe = '1d',         // Target timeframe: 1h, 4h, 1d, 1wk
      assetTypes = ['stocks', 'crypto', 'fx', 'commodities', 'indices', 'etfs'],
      maxInstrumentsPerType = 25,
      patterns = Object.keys(PATTERN_REGISTRY),
      dryRun = false,
      offset = 0,
      incrementalMode = true,       // Default to incremental updates
      forceFullBackfill = false,    // Override to force full historical fetch
      stockLetterFilter = null      // NEW: Filter stocks by first letter range { start: 'A', end: 'G' }
    } = body;

    const useIncremental = incrementalMode && !forceFullBackfill;

    console.log(`[seed-mtf] Starting ${timeframe} pattern seeding`);
    console.log(`[seed-mtf] Mode: ${useIncremental ? 'INCREMENTAL (only new data)' : 'FULL BACKFILL'}`);
    console.log(`[seed-mtf] Asset types: ${assetTypes.join(', ')}, offset=${offset}`);
    if (stockLetterFilter) {
      console.log(`[seed-mtf] Stock letter filter: ${stockLetterFilter.start}-${stockLetterFilter.end}`);
    }

    // Collect instruments from each asset type
    const allInstruments: { symbol: string; assetType: string }[] = [];
    
    for (const assetType of assetTypes) {
      let instruments = ALL_INSTRUMENTS[assetType as keyof typeof ALL_INSTRUMENTS] || [];
      
      // Apply stock letter filter if provided (for distributed seeding)
      if (assetType === 'stocks' && stockLetterFilter) {
        const { start, end } = stockLetterFilter;
        instruments = instruments.filter(inst => {
          const firstLetter = inst.symbol.charAt(0).toUpperCase();
          return firstLetter >= start.toUpperCase() && firstLetter <= end.toUpperCase();
        });
        console.log(`[seed-mtf] Filtered stocks ${start}-${end}: ${instruments.length} symbols`);
      }
      
      const limited = instruments.slice(0, maxInstrumentsPerType);
      limited.forEach(inst => {
        allInstruments.push({ symbol: inst.yahooSymbol, assetType });
      });
    }

    // Pagination
    const MAX_PER_RUN = 10; // Smaller batch for intraday (more data per instrument)
    const instrumentsToProcess = allInstruments.slice(offset, offset + MAX_PER_RUN);
    const hasMore = offset + MAX_PER_RUN < allInstruments.length;
    const nextOffset = offset + MAX_PER_RUN;

    console.log(`[seed-mtf] Processing ${offset} to ${offset + instrumentsToProcess.length} of ${allInstruments.length}`);

    const allOccurrences: HistoricalOccurrence[] = [];
    const errors: string[] = [];
    let processedCount = 0;
    let skippedDuplicates = 0;

    for (const { symbol, assetType } of instrumentsToProcess) {
      try {
        // Determine date range based on mode
        let fromTimestamp: number;
        const now = Date.now();
        
        if (useIncremental) {
          const lastSeeded = await getLastSeededDate(supabase, symbol, timeframe);
          if (lastSeeded) {
            // Fetch from last seeded date minus overlap for pattern context (14 days)
            const overlapDays = timeframe === '1wk' ? 28 : 14;
            fromTimestamp = lastSeeded.getTime() - (overlapDays * 24 * 60 * 60 * 1000);
            console.log(`[seed-mtf] ${symbol}/${timeframe}: Incremental from ${new Date(fromTimestamp).toISOString().split('T')[0]}`);
          } else {
            // No existing data - do full backfill
            const lookbackDays = getFullBackfillDays(timeframe);
            fromTimestamp = now - (lookbackDays * 24 * 60 * 60 * 1000);
            console.log(`[seed-mtf] ${symbol}/${timeframe}: Full backfill (no existing data)`);
          }
        } else {
          // Full backfill mode
          const lookbackDays = getFullBackfillDays(timeframe);
          fromTimestamp = now - (lookbackDays * 24 * 60 * 60 * 1000);
        }
        
        console.log(`[seed-mtf] Fetching ${symbol} @ ${timeframe} (EODHD primary, Yahoo fallback)...`);
        const bars = await fetchMarketData(symbol, timeframe, fromTimestamp);
        
        if (bars.length < 50) {
          console.log(`[seed-mtf] Skipping ${symbol}: insufficient data (${bars.length} bars)`);
          continue;
        }
        
        // Run each pattern detector
        for (const patternId of patterns) {
          const patternDef = PATTERN_REGISTRY[patternId];
          if (!patternDef) continue;
          
          const occurrences = runHistoricalBacktest(bars, symbol, patternId, patternDef, timeframe, assetType);
          
          // In incremental mode, filter out patterns we already have
          if (useIncremental) {
            const lastSeeded = await getLastSeededDate(supabase, symbol, timeframe);
            if (lastSeeded) {
              const filtered = occurrences.filter(occ => new Date(occ.detected_at) > lastSeeded);
              skippedDuplicates += occurrences.length - filtered.length;
              allOccurrences.push(...filtered);
            } else {
              allOccurrences.push(...occurrences);
            }
          } else {
            allOccurrences.push(...occurrences);
          }
        }
        
        processedCount++;
        console.log(`[seed-mtf] Processed ${symbol}: ${allOccurrences.length} total occurrences`);
        
        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        errors.push(`${symbol}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`[seed-mtf] Detection complete: ${allOccurrences.length} patterns from ${processedCount} instruments`);
    if (skippedDuplicates > 0) {
      console.log(`[seed-mtf] Skipped ${skippedDuplicates} already-seeded patterns`);
    }

    if (dryRun) {
      return new Response(JSON.stringify({
        dryRun: true,
        timeframe,
        mode: useIncremental ? 'incremental' : 'full_backfill',
        totalOccurrences: allOccurrences.length,
        skippedDuplicates,
        hasMore,
        nextOffset: hasMore ? nextOffset : null,
        sampleOccurrences: allOccurrences.slice(0, 3),
        errors: errors.slice(0, 10)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insert into database in chunks (use upsert to avoid duplicates)
    const CHUNK_SIZE = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < allOccurrences.length; i += CHUNK_SIZE) {
      const chunk = allOccurrences.slice(i, i + CHUNK_SIZE);
      
      const { error: insertError } = await supabase
        .from('historical_pattern_occurrences')
        .upsert(chunk.map(occ => ({
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
          trend_indicators: occ.trend_indicators
        })), {
          onConflict: 'pattern_id,symbol,timeframe,pattern_end_date',
          ignoreDuplicates: true
        });
      
      if (insertError) {
        console.error(`[seed-mtf] Insert error at chunk ${i / CHUNK_SIZE}:`, insertError);
      } else {
        insertedCount += chunk.length;
      }
    }

    console.log(`[seed-mtf] Inserted ${insertedCount} occurrences`);

    const winCount = allOccurrences.filter(o => o.outcome === 'hit_tp').length;
    const lossCount = allOccurrences.filter(o => o.outcome === 'hit_sl').length;
    const totalWithOutcome = winCount + lossCount;
    const winRate = totalWithOutcome > 0 ? (winCount / totalWithOutcome * 100).toFixed(1) : 'N/A';

    return new Response(JSON.stringify({
      success: true,
      timeframe,
      mode: useIncremental ? 'incremental' : 'full_backfill',
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
      totalInstruments: allInstruments.length,
      summary: {
        instrumentsProcessed: processedCount,
        totalOccurrences: allOccurrences.length,
        insertedCount,
        skippedDuplicates,
        winCount,
        lossCount,
        winRate: `${winRate}%`
      },
      errors: errors.slice(0, 10)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[seed-mtf] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
