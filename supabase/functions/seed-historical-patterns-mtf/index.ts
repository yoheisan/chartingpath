// Last deployed: 2026-03-31
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
  detector: (w: OHLCBar[], assetType?: string) => PatternDetectionResult 
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
      
      // Peak prominence threshold: peaks must be within 5% of the window high
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
      
      // Prior uptrend check: ≥2%
      const preTopPrice = Math.min(...lows.slice(0, Math.max(1, firstTop)));
      const priorRise = (highs[firstTop] - preTopPrice) / preTopPrice;
      if (priorRise < 0.02) return { detected: false, pivots: [] };
      
      let necklineIdx = firstTop;
      let neckline = lows[firstTop];
      for (let i = firstTop; i <= secondTop; i++) {
        if (lows[i] < neckline) { neckline = lows[i]; necklineIdx = i; }
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
      
      // Trough prominence threshold: troughs must be within 5% of the window low
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
      
      // Prior downtrend check: ≥2%
      const preBottomPrice = Math.max(...highs.slice(0, Math.max(1, firstBottom)));
      const priorDrop = (preBottomPrice - lows[firstBottom]) / preBottomPrice;
      if (priorDrop < 0.02) return { detected: false, pivots: [] };
      
      let necklineIdx = firstBottom;
      let neckline = highs[firstBottom];
      for (let i = firstBottom; i <= secondBottom; i++) {
        if (highs[i] > neckline) { neckline = highs[i]; necklineIdx = i; }
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
      
      // Head prominence: head must be within 5% of window high
      const prominenceThreshold = highestHigh - range * 0.05;
      
      // Adaptive peak detection radius: wider for larger windows (macro H&S)
      const peakRadius = Math.max(2, Math.min(6, Math.floor(window.length / 15)));
      
      const peaks: { index: number; value: number }[] = [];
      for (let i = peakRadius; i < window.length - peakRadius; i++) {
        let isPeak = true;
        for (let r = 1; r <= peakRadius; r++) {
          if (highs[i] <= highs[i - r] || highs[i] <= highs[i + r]) { isPeak = false; break; }
        }
        if (isPeak) {
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
      
      // Head must be prominent (near window high)
      if (head.value < prominenceThreshold) return { detected: false, pivots: [] };
      
      // Minimum 5-bar separation between shoulders and head
      if (head.index - leftShoulder.index < 5 || rightShoulder.index - head.index < 5) return { detected: false, pivots: [] };
      
      const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value);
      const headRange = head.value - Math.min(leftShoulder.value, rightShoulder.value);
      const symmetryOk = headRange > 0 && shoulderDiff / headRange < 0.25;
      const headHigherOk = head.value > leftShoulder.value * 1.02 && head.value > rightShoulder.value * 1.02;
      
      if (!symmetryOk || !headHigherOk) return { detected: false, pivots: [] };
      
      // Prior uptrend required: ≥3%
      const prePatternPrice = Math.min(...lows.slice(0, Math.max(1, leftShoulder.index)));
      const priorRise = (head.value - prePatternPrice) / prePatternPrice;
      if (priorRise < 0.03) return { detected: false, pivots: [] };
      
      let neckline = Infinity;
      let necklineIdx = leftShoulder.index;
      for (let i = leftShoulder.index; i <= rightShoulder.index; i++) {
        if (lows[i] < neckline) { neckline = lows[i]; necklineIdx = i; }
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
      
      // Head prominence: head must be within 5% of window low
      const prominenceThreshold = lowestLow + range * 0.05;
      
      // Adaptive trough detection radius: wider for larger windows (macro IH&S)
      const troughRadius = Math.max(2, Math.min(6, Math.floor(window.length / 15)));
      
      const troughs: { index: number; value: number }[] = [];
      for (let i = troughRadius; i < window.length - troughRadius; i++) {
        let isTrough = true;
        for (let r = 1; r <= troughRadius; r++) {
          if (lows[i] >= lows[i - r] || lows[i] >= lows[i + r]) { isTrough = false; break; }
        }
        if (isTrough) {
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
      
      // Head must be prominent (near window low)
      if (head.value > prominenceThreshold) return { detected: false, pivots: [] };
      
      // Minimum 5-bar separation between shoulders and head
      if (head.index - leftShoulder.index < 5 || rightShoulder.index - head.index < 5) return { detected: false, pivots: [] };
      
      const shoulderDiff = Math.abs(leftShoulder.value - rightShoulder.value);
      const headRange = Math.max(leftShoulder.value, rightShoulder.value) - head.value;
      const symmetryOk = headRange > 0 && shoulderDiff / headRange < 0.25;
      const headLowerOk = head.value < leftShoulder.value * 0.98 && head.value < rightShoulder.value * 0.98;
      
      if (!symmetryOk || !headLowerOk) return { detected: false, pivots: [] };
      
      // Prior downtrend required: ≥3%
      const prePatternPrice = Math.max(...highs.slice(0, Math.max(1, leftShoulder.index)));
      const priorDrop = (prePatternPrice - head.value) / prePatternPrice;
      if (priorDrop < 0.03) return { detected: false, pivots: [] };
      
      let neckline = -Infinity;
      let necklineIdx = leftShoulder.index;
      for (let i = leftShoulder.index; i <= rightShoulder.index; i++) {
        if (highs[i] > neckline) { neckline = highs[i]; necklineIdx = i; }
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
      
      // Prior uptrend ≥2%
      const earlyLow = Math.min(...lows.slice(0, 5));
      const midHigh = Math.max(...highs.slice(5, 15));
      const priorRise = (midHigh - earlyLow) / earlyLow;
      if (priorRise < 0.02) return { detected: false, pivots: [] };
      
      const resistanceZone = Math.max(...highs.slice(0, -2));
      
      // Minimum 3 touches on resistance (flat top)
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
  },
  'descending-triangle': {
    direction: 'short',
    displayName: 'Descending Triangle',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // Prior downtrend ≥2%
      const earlyHigh = Math.max(...highs.slice(0, 5));
      const midLow = Math.min(...lows.slice(5, 15));
      const priorDrop = (earlyHigh - midLow) / earlyHigh;
      if (priorDrop < 0.02) return { detected: false, pivots: [] };
      
      const supportZone = Math.min(...lows.slice(0, -2));
      
      // Minimum 3 touches on support (flat bottom)
      const supportTests = lows.filter(l => l < supportZone * 1.02 && l >= supportZone * 0.98).length;
      if (supportTests < 3) return { detected: false, pivots: [] };
      
      // Falling highs (minimum 2 lower highs) — no penalty for noise bars (matches ascending triangle logic)
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
  },
  'rising-wedge': {
    direction: 'short',
    displayName: 'Rising Wedge',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      
      // Prior uptrend required: wedge must form after a rise of ≥2%
      const earlyLow = Math.min(...window.slice(0, 5).map(d => d.low));
      const wedgeHigh = Math.max(...window.map(d => d.high));
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
          { index: 0, price: avgFirstHigh, type: 'high', label: 'Upper Trend Start' },
          { index: window.length - 1, price: avgSecondHigh, type: 'high', label: 'Upper Trend End' },
          { index: 0, price: avgFirstLow, type: 'low', label: 'Lower Trend Start' },
          { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
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
      
      // Prior downtrend required: wedge must form after a drop of ≥2%
      const earlyHigh = Math.max(...window.slice(0, 5).map(d => d.high));
      const wedgeLow = Math.min(...window.map(d => d.low));
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
          { index: 0, price: avgFirstHigh, type: 'high', label: 'Upper Trend Start' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' },
          { index: 0, price: avgFirstLow, type: 'low', label: 'Lower Trend Start' },
          { index: window.length - 1, price: avgSecondLow, type: 'low', label: 'Lower Trend End' }
        ] : []
      };
    }
  },
  'donchian-breakout-long': {
    direction: 'long',
    displayName: 'Donchian Breakout (Long)',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const closes = window.map(d => d.close);
      const lookbackHighs = highs.slice(0, -2);
      const recentHigh = Math.max(...lookbackHighs);
      const recentHighIdx = lookbackHighs.indexOf(recentHigh);
      const currentClose = closes[closes.length - 1];
      const prevClose = closes[closes.length - 2];
      
      const closeBeyond = currentClose > recentHigh * 1.001 || prevClose > recentHigh * 1.001;
      if (!closeBeyond) return { detected: false, pivots: [] };
      
      // ADX > 20 filter
      const adxBars = window.slice(-15);
      let dmPlusSum = 0, dmMinusSum = 0, trSum = 0;
      for (let k = 1; k < adxBars.length; k++) {
        const dmPlus = Math.max(0, adxBars[k].high - adxBars[k-1].high);
        const dmMinus = Math.max(0, adxBars[k-1].low - adxBars[k].low);
        const tr = Math.max(adxBars[k].high - adxBars[k].low, Math.abs(adxBars[k].high - adxBars[k-1].close), Math.abs(adxBars[k].low - adxBars[k-1].close));
        if (dmPlus > dmMinus) { dmPlusSum += dmPlus; } else { dmMinusSum += dmMinus; }
        trSum += tr;
      }
      const diPlus = trSum > 0 ? (dmPlusSum / trSum) * 100 : 0;
      const diMinus = trSum > 0 ? (dmMinusSum / trSum) * 100 : 0;
      const dx = (diPlus + diMinus) > 0 ? Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100 : 0;
      if (dx < 20) return { detected: false, pivots: [] };
      
      return {
        detected: true,
        patternStartIndex: recentHighIdx,
        patternEndIndex: window.length - 1,
        pivots: [
          { index: window.length - 1, price: recentHigh, type: 'high', label: 'Breakout Level' },
          { index: window.length - 1, price: currentClose, type: 'high', label: 'Entry' }
        ]
      };
    }
  },
  'donchian-breakout-short': {
    direction: 'short',
    displayName: 'Donchian Breakout (Short)',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      const lookbackLows = lows.slice(0, -2);
      const recentLow = Math.min(...lookbackLows);
      const recentLowIdx = lookbackLows.indexOf(recentLow);
      const currentClose = closes[closes.length - 1];
      const prevClose = closes[closes.length - 2];
      
      const closeBeyond = currentClose < recentLow * 0.999 || prevClose < recentLow * 0.999;
      if (!closeBeyond) return { detected: false, pivots: [] };
      
      // ADX > 20 filter
      const adxBars = window.slice(-15);
      let dmPlusSum = 0, dmMinusSum = 0, trSum = 0;
      for (let k = 1; k < adxBars.length; k++) {
        const dmPlus = Math.max(0, adxBars[k].high - adxBars[k-1].high);
        const dmMinus = Math.max(0, adxBars[k-1].low - adxBars[k].low);
        const tr = Math.max(adxBars[k].high - adxBars[k].low, Math.abs(adxBars[k].high - adxBars[k-1].close), Math.abs(adxBars[k].low - adxBars[k-1].close));
        if (dmPlus > dmMinus) { dmPlusSum += dmPlus; } else { dmMinusSum += dmMinus; }
        trSum += tr;
      }
      const diPlus = trSum > 0 ? (dmPlusSum / trSum) * 100 : 0;
      const diMinus = trSum > 0 ? (dmMinusSum / trSum) * 100 : 0;
      const dx = (diPlus + diMinus) > 0 ? Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100 : 0;
      if (dx < 20) return { detected: false, pivots: [] };
      
      return {
        detected: true,
        patternStartIndex: recentLowIdx,
        patternEndIndex: window.length - 1,
        pivots: [
          { index: window.length - 1, price: recentLow, type: 'low', label: 'Breakdown Level' },
          { index: window.length - 1, price: currentClose, type: 'low', label: 'Entry' }
        ]
      };
    }
  },
  'bull-flag': {
    direction: 'long',
    displayName: 'Bull Flag',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const len = window.length;
      
      // Proportional pole detection: scan for strongest consecutive up-move in first 30-60% of window
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
      
      // Minimum pole gain: 3% (Bulkowski minimum)
      if (bestPoleGain < 0.04) return { detected: false, pivots: [] };
      
      // Flag zone: bars after pole peak, at least 3 bars, up to 50% of remaining window
      const flagStart = bestPoleEnd + 1;
      const flagEnd = Math.min(len - 2, bestPoleEnd + Math.max(3, Math.floor((len - bestPoleEnd) * 0.6)));
      if (flagStart >= flagEnd || flagEnd >= len) return { detected: false, pivots: [] };
      
      const flagHighs = highs.slice(flagStart, flagEnd + 1);
      const flagLows = lows.slice(flagStart, flagEnd + 1);
      if (flagHighs.length < 2) return { detected: false, pivots: [] };
      
      const flagHigh = Math.max(...flagHighs);
      const flagLow = Math.min(...flagLows);
      const flagRange = (flagHigh - flagLow) / flagLow;
      
      // Retracement must be < 50% of pole (Bulkowski standard)
      const poleHeight = closes[bestPoleEnd] - closes[bestPoleStart];
      const retracement = (closes[bestPoleEnd] - flagLow) / poleHeight;
      
      // Flag consolidation range ≤ 6%, retracement < 50%, slight downward/flat drift OK
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
  },
  'bear-flag': {
    direction: 'short',
    displayName: 'Bear Flag',
    detector: (window) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const len = window.length;
      
      // Proportional pole detection: scan for strongest consecutive down-move in first 30-60% of window
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
      
      // Minimum pole drop: 3% (Bulkowski minimum)
      if (bestPoleDrop < 0.04) return { detected: false, pivots: [] };
      
      // Flag zone: bars after pole bottom, at least 3 bars
      const flagStart = bestPoleEnd + 1;
      const flagEnd = Math.min(len - 2, bestPoleEnd + Math.max(3, Math.floor((len - bestPoleEnd) * 0.6)));
      if (flagStart >= flagEnd || flagEnd >= len) return { detected: false, pivots: [] };
      
      const flagHighs = highs.slice(flagStart, flagEnd + 1);
      const flagLows = lows.slice(flagStart, flagEnd + 1);
      if (flagLows.length < 2) return { detected: false, pivots: [] };
      
      const flagHigh = Math.max(...flagHighs);
      const flagLow = Math.min(...flagLows);
      const flagRange = (flagHigh - flagLow) / flagLow;
      
      // Retracement must be < 50% of pole
      const poleHeight = closes[bestPoleStart] - closes[bestPoleEnd];
      const retracement = (flagHigh - closes[bestPoleEnd]) / poleHeight;
      
      // Flag consolidation range ≤ 6%, retracement < 50%
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
  },
  'cup-and-handle': {
    direction: 'long',
    displayName: 'Cup & Handle',
    detector: (window, assetType) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const len = window.length;
      
      // HYBRID CUP DEPTH: range-relative for FX, fixed percentage for others
      // Calculate window range for range-relative checks
      const windowHighAll = Math.max(...highs);
      const windowLowAll = Math.min(...lows);
      const windowRangeAll = windowHighAll - windowLowAll;
      
      // PRIOR UPTREND CHECK: range-relative (15% of window range)
      const earlyLow = Math.min(...lows.slice(0, 5));
      const earlyHigh = Math.max(...highs.slice(0, 5));
      const priorRise = earlyHigh - earlyLow;
      const priorRiseRatio = windowRangeAll > 0 ? priorRise / windowRangeAll : 0;
      if (priorRiseRatio < 0.15) return { detected: false, pivots: [] };
      
      // Dynamic cup detection: find the deepest trough, then identify rims on either side
      // Left rim: highest high in first 40% of window
      const leftRimEnd = Math.max(3, Math.floor(len * 0.4));
      const leftRimSlice = highs.slice(0, leftRimEnd);
      const leftRim = Math.max(...leftRimSlice);
      const leftRimIdx = leftRimSlice.indexOf(leftRim);
      
      // Cup bottom: lowest low between left rim and last 25% of window
      const cupSearchEnd = Math.max(leftRimIdx + 3, Math.floor(len * 0.85));
      const cupSearchStart = leftRimIdx + 1;
      if (cupSearchStart >= cupSearchEnd) return { detected: false, pivots: [] };
      
      const cupSlice = lows.slice(cupSearchStart, cupSearchEnd);
      if (cupSlice.length < 2) return { detected: false, pivots: [] };
      const cupBottom = Math.min(...cupSlice);
      const cupBottomIdx = cupSearchStart + cupSlice.indexOf(cupBottom);
      
      // Right rim: highest high between cup bottom and end of window (minus last 2 bars for breakout)
      const rightRimStart = cupBottomIdx + 1;
      const rightRimEnd = Math.max(rightRimStart + 1, len - 2);
      if (rightRimStart >= rightRimEnd) return { detected: false, pivots: [] };
      
      const rightRimSlice = highs.slice(rightRimStart, rightRimEnd);
      if (rightRimSlice.length === 0) return { detected: false, pivots: [] };
      const rightRim = Math.max(...rightRimSlice);
      const rightRimIdx = rightRimStart + rightRimSlice.indexOf(rightRim);
      
      // Validate cup shape
      const rimDiff = Math.abs(leftRim - rightRim) / leftRim;
      const cupDepthPct = (Math.min(leftRim, rightRim) - cupBottom) / Math.min(leftRim, rightRim);
      const cupAbsDepth = Math.min(leftRim, rightRim) - cupBottom;
      const cupRangeRatio = windowRangeAll > 0 ? cupAbsDepth / windowRangeAll : 0;
      
      // Rim diff ≤ 10%
      if (rimDiff > 0.10) return { detected: false, pivots: [] };
      
      // Hybrid depth check: FX uses range-relative (30%), others use fixed (10%)
      const isFX = assetType === 'fx';
      if (isFX) {
        if (cupRangeRatio < 0.30 || cupDepthPct > 0.40) return { detected: false, pivots: [] };
      } else {
        if (cupDepthPct < 0.10 || cupDepthPct > 0.40) return { detected: false, pivots: [] };
      }
      
      // Handle: small pullback after right rim (optional — if no room, check direct breakout)
      let handleLow = rightRim;
      let handleLowIdx = rightRimIdx;
      if (rightRimIdx + 1 < len - 1) {
        const handleLows = lows.slice(rightRimIdx + 1, len - 1);
        if (handleLows.length > 0) {
          handleLow = Math.min(...handleLows);
          handleLowIdx = rightRimIdx + 1 + handleLows.indexOf(handleLow);
          const handleDepth = (rightRim - handleLow) / (rightRim - cupBottom);
          // Handle depth 3-60% of cup depth; if outside range, skip handle requirement
          if (handleDepth < 0.03 || handleDepth > 0.60) {
            handleLow = rightRim;
            handleLowIdx = rightRimIdx;
          }
        }
      }
      
      // Breakout: last close above right rim
      const lastClose = closes[len - 1];
      const detected = lastClose > rightRim * 1.001;
      
      const pivots: PatternPivot[] = detected ? [
        { index: leftRimIdx, price: leftRim, type: 'high', label: 'Left Rim' },
        { index: cupBottomIdx, price: cupBottom, type: 'low', label: 'Cup Bottom' },
        { index: rightRimIdx, price: rightRim, type: 'high', label: 'Right Rim' },
        ...(handleLowIdx !== rightRimIdx ? [{ index: handleLowIdx, price: handleLow, type: 'low' as const, label: 'Handle' }] : []),
        { index: len - 1, price: lastClose, type: 'high', label: 'Breakout' }
      ] : [];
      
      return {
        detected,
        patternStartIndex: leftRimIdx,
        patternEndIndex: len - 1,
        pivots
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
      
      // PRIOR UPTREND CHECK: Price before first top must be meaningfully lower (≥2%)
      const preTopPrice = Math.min(...lows.slice(0, Math.max(1, lastThreePeaks[0].index)));
      const priorRise = (lastThreePeaks[0].value - preTopPrice) / preTopPrice;
      if (priorRise < 0.02) return { detected: false, pivots: [] };
      
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
      const troughValues = lastThreeTroughs.map(t => t.value);
      const maxTrough = Math.max(...troughValues);
      const minTrough = Math.min(...troughValues);
      const allSimilar = (maxTrough - minTrough) / minTrough < 0.03;
      
      if (!allSimilar) return { detected: false, pivots: [] };
      
      // PRIOR DOWNTREND CHECK: Price before first trough must be meaningfully higher (≥2%)
      const preBottomPrice = Math.max(...highs.slice(0, Math.max(1, lastThreeTroughs[0].index)));
      const priorDrop = (preBottomPrice - lastThreeTroughs[0].value) / preBottomPrice;
      if (priorDrop < 0.02) return { detected: false, pivots: [] };
      
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
  },
  'symmetrical-triangle': {
    direction: 'long' as const,
    displayName: 'Symmetrical Triangle',
    detector: (window: OHLCBar[]): PatternDetectionResult => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);

      const peaks: { index: number; value: number }[] = [];
      const troughs: { index: number; value: number }[] = [];
      for (let i = 2; i < window.length - 2; i++) {
        if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
            highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
          peaks.push({ index: i, value: highs[i] });
        }
        if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] &&
            lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
          troughs.push({ index: i, value: lows[i] });
        }
      }
      if (peaks.length < 2 || troughs.length < 2) return { detected: false, pivots: [] };

      const lastPeaks = peaks.slice(-2);
      if (lastPeaks[1].value >= lastPeaks[0].value) return { detected: false, pivots: [] };
      const highSlope = (lastPeaks[1].value - lastPeaks[0].value) / (lastPeaks[1].index - lastPeaks[0].index);

      const lastTroughs = troughs.slice(-2);
      if (lastTroughs[1].value <= lastTroughs[0].value) return { detected: false, pivots: [] };
      const lowSlope = (lastTroughs[1].value - lastTroughs[0].value) / (lastTroughs[1].index - lastTroughs[0].index);

      if (highSlope >= 0 || lowSlope <= 0) return { detected: false, pivots: [] };

      const patternRange = (lastPeaks[0].value - lastTroughs[0].value) / lastTroughs[0].value;
      if (patternRange < 0.03) return { detected: false, pivots: [] };

      const projectedResistance = lastPeaks[1].value + highSlope * (window.length - 1 - lastPeaks[1].index);
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > projectedResistance * 1.002;

      return {
        detected,
        pivots: detected ? [
          { index: lastPeaks[0].index, price: lastPeaks[0].value, type: 'high', label: 'R1' },
          { index: lastPeaks[1].index, price: lastPeaks[1].value, type: 'high', label: 'R2' },
          { index: lastTroughs[0].index, price: lastTroughs[0].value, type: 'low', label: 'S1' },
          { index: lastTroughs[1].index, price: lastTroughs[1].value, type: 'low', label: 'S2' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' }
        ] : []
      };
    }
  },
  'inverse-cup-and-handle': {
    direction: 'short' as const,
    displayName: 'Inverse Cup & Handle',
    detector: (window: OHLCBar[]): PatternDetectionResult => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);

      const earlyHigh = Math.max(...highs.slice(0, 5));
      const earlyLow = Math.min(...lows.slice(0, 5));
      if ((earlyHigh - earlyLow) / earlyHigh < 0.05) return { detected: false, pivots: [] };

      const cupEnd = Math.floor(window.length * 0.7);
      const handleStart = Math.floor(window.length * 0.75);

      const leftRim = Math.min(...lows.slice(0, 4));
      const rightRimArea = lows.slice(Math.floor(cupEnd * 0.8), cupEnd);
      const rightRim = rightRimArea.length > 0 ? Math.min(...rightRimArea) : Infinity;
      const cupMiddle = highs.slice(3, cupEnd - 2);
      const cupTop = cupMiddle.length > 0 ? Math.max(...cupMiddle) : 0;

      if (cupTop === 0) return { detected: false, pivots: [] };

      const rimDiff = Math.abs(leftRim - rightRim) / leftRim;
      const cupHeight = (cupTop - Math.max(leftRim, rightRim)) / Math.max(leftRim, rightRim);
      if (rimDiff > 0.08 || cupHeight < 0.07 || cupHeight > 0.40) return { detected: false, pivots: [] };

      const handleHighs = highs.slice(handleStart, window.length - 1);
      if (handleHighs.length === 0) return { detected: false, pivots: [] };
      const handleHigh = Math.max(...handleHighs);
      const handleRetracement = (handleHigh - rightRim) / (cupTop - rightRim);
      if (handleRetracement < 0.03 || handleRetracement > 0.60) return { detected: false, pivots: [] };

      const lastClose = closes[closes.length - 1];
      const detected = lastClose < rightRim * 0.999;

      const leftRimIdx = lows.slice(0, 4).indexOf(leftRim);
      const cupTopIdx = 3 + cupMiddle.indexOf(cupTop);
      const rightRimStartIdx = Math.floor(cupEnd * 0.8);
      const rightRimIdx = rightRimStartIdx + rightRimArea.indexOf(rightRim);

      return {
        detected,
        patternStartIndex: leftRimIdx,
        patternEndIndex: window.length - 1,
        pivots: detected ? [
          { index: leftRimIdx, price: leftRim, type: 'low', label: 'Left Rim' },
          { index: cupTopIdx, price: cupTop, type: 'high', label: 'Cup Top' },
          { index: rightRimIdx, price: rightRim, type: 'low', label: 'Right Rim' },
          { index: handleStart + handleHighs.indexOf(handleHigh), price: handleHigh, type: 'high', label: 'Handle' },
          { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
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

// Aggregate 1h bars to 4h bars (UTC-anchored)
// Non-24h markets require MIN_BARS_NON_24H=5 bars per period.
// This threshold MUST match all other aggregation paths.
const MIN_BARS_NON_24H = 5;

function aggregate1hTo4h(bars: OHLCBar[], is24hMarket: boolean = true): OHLCBar[] {
  const minBars = is24hMarket ? 4 : MIN_BARS_NON_24H;
  const grouped = new Map<string, OHLCBar[]>();
  
  for (const bar of bars) {
    const d = new Date(bar.date);
    const periodStart = Math.floor(d.getUTCHours() / 4) * 4;
    const boundary = new Date(d);
    boundary.setUTCHours(periodStart, 0, 0, 0);
    const key = boundary.toISOString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(bar);
  }
  
  const result: OHLCBar[] = [];
  for (const [key, wBars] of grouped) {
    if (wBars.length < minBars) continue;
    wBars.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    result.push({
      date: key,
      open: wBars[0].open,
      high: Math.max(...wBars.map(b => b.high)),
      low: Math.min(...wBars.map(b => b.low)),
      close: wBars[wBars.length - 1].close,
      volume: wBars.reduce((sum, b) => sum + (b.volume || 0), 0)
    });
  }
  
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
  // Hong Kong stocks: 0700.HK stays as 0700.HK on EODHD
  if (symbol.endsWith('.HK')) return symbol;
  // Singapore stocks: D05.SI → D05.SG on EODHD
  if (symbol.endsWith('.SI')) return `${symbol.replace('.SI', '')}.SG`;
  // Thailand stocks: PTT.BK stays as PTT.BK on EODHD
  if (symbol.endsWith('.BK')) return symbol;
  // Shanghai/Shenzhen: 000001.SS → 000001.SHG, 399001.SZ → 399001.SHE
  if (symbol.endsWith('.SS')) return `${symbol.replace('.SS', '')}.SHG`;
  if (symbol.endsWith('.SZ')) return `${symbol.replace('.SZ', '')}.SHE`;
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
      const is24h = symbol.includes('-USD') || symbol.includes('-USDT') || symbol.includes('=X');
      bars = aggregate1hTo4h(bars, is24h);
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
 * FIXED: 1h/4h limits corrected to 729 days (Yahoo supports up to 730 days for hourly)
 */
async function fetchYahooData(symbol: string, timeframe: string, fromTimestamp?: number): Promise<OHLCBar[]> {
  const yahooLimits: Record<string, { rangeDays: number }> = {
    '1h': { rangeDays: 729 },   // Yahoo supports up to 730 days for hourly
    '4h': { rangeDays: 729 },   // Aggregated from 1h, same limit
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
      const is24h = symbol.includes('-USD') || symbol.includes('-USDT') || symbol.includes('=X');
      bars = aggregate1hTo4h(bars, is24h);
    }
    
    console.log(`[Yahoo] Fetched ${bars.length} bars for ${symbol}@${timeframe}`);
    return bars;
  } catch (error) {
    console.error(`[Yahoo] Error fetching ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch data from Binance (primary provider for crypto - FREE, no API key needed)
 * Supports 1000+ days of 1h/4h kline data for all major pairs
 */
async function fetchBinanceData(symbol: string, timeframe: string, fromTimestamp?: number): Promise<OHLCBar[]> {
  // Convert symbol: BTC-USD → BTCUSDT
  const binanceSymbol = symbol.replace('-USD', 'USDT');
  
  const binanceInterval: Record<string, string> = {
    '1h': '1h',
    '4h': '4h',   // Binance supports 4h natively - no aggregation needed!
    '8h': '8h',
    '1d': '1d',
    '1wk': '1w',
  };
  
  const interval = binanceInterval[timeframe];
  if (!interval) {
    console.log(`[Binance] Unsupported timeframe ${timeframe} for ${symbol}`);
    return [];
  }
  
  const endMs = Date.now();
  const startMs = fromTimestamp || (endMs - 730 * 24 * 60 * 60 * 1000); // Default 2 years
  
  const allBars: OHLCBar[] = [];
  let currentStart = startMs;
  const limit = 1000; // Binance max per request
  
  try {
    // Paginate through all available data
    while (currentStart < endMs) {
      const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&startTime=${currentStart}&endTime=${endMs}&limit=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        console.log(`[Binance] Error for ${binanceSymbol}: ${response.status} - ${errText}`);
        return allBars; // Return what we have so far
      }
      
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) break;
      
      for (const kline of data) {
        allBars.push({
          date: new Date(kline[0]).toISOString(),
          open: Number(kline[1]),
          high: Number(kline[2]),
          low: Number(kline[3]),
          close: Number(kline[4]),
          volume: Number(kline[5]),
        });
      }
      
      // Move start forward past the last candle
      currentStart = data[data.length - 1][0] + 1;
      
      // If we got less than limit, we've reached the end
      if (data.length < limit) break;
      
      // Small delay between pages to be respectful
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`[Binance] Fetched ${allBars.length} bars for ${binanceSymbol}@${timeframe}`);
    return allBars;
  } catch (error) {
    console.error(`[Binance] Error fetching ${binanceSymbol}:`, error);
    return [];
  }
}

// ============= READ-FROM-DB-FIRST LOGIC =============

/**
 * Check historical_prices table for existing OHLCV data before calling external APIs.
 * Returns bars from DB if sufficient coverage exists, otherwise returns empty array.
 */
async function readBarsFromDB(
  supabase: any,
  symbol: string,
  timeframe: string,
  fromDate: string,
  toDate: string,
  minBarsRequired: number = 50
): Promise<OHLCBar[]> {
  try {
    const { data, error } = await supabase
      .from('historical_prices')
      .select('date, open, high, low, close, volume')
      .eq('symbol', symbol)
      .eq('timeframe', timeframe)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true });
    
    if (error || !data || data.length < minBarsRequired) {
      return [];
    }
    
    console.log(`[DB-Cache] Found ${data.length} cached bars for ${symbol}@${timeframe}`);
    return data.map((row: any) => ({
      date: row.date,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume || 0),
    }));
  } catch {
    return [];
  }
}

// ============= OHLCV PERSISTENCE =============

/**
 * Persist raw OHLCV bars to historical_prices table for permanent local archive.
 * Uses upsert to avoid duplicates. Runs in background (non-blocking).
 */
async function persistBarsToHistoricalPrices(
  supabase: any,
  symbol: string,
  timeframe: string,
  assetType: string,
  bars: OHLCBar[]
): Promise<void> {
  if (bars.length === 0) return;
  
  const CHUNK = 500;
  let persisted = 0;
  
  try {
    for (let i = 0; i < bars.length; i += CHUNK) {
      const chunk = bars.slice(i, i + CHUNK);
      const rows = chunk.map(bar => ({
        symbol,
        timeframe,
        instrument_type: assetType,
        date: bar.date,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume || 0,
      }));
      
      const { error } = await supabase
        .from('historical_prices')
        .upsert(rows, {
          onConflict: 'symbol,timeframe,date',
          ignoreDuplicates: true
        });
      
      if (error) {
        console.warn(`[OHLCV-Persist] Upsert error for ${symbol}@${timeframe}: ${error.message}`);
      } else {
        persisted += chunk.length;
      }
    }
    
    if (persisted > 0) {
      console.log(`[OHLCV-Persist] Saved ${persisted} bars for ${symbol}@${timeframe}`);
    }
  } catch (err) {
    console.warn(`[OHLCV-Persist] Error for ${symbol}:`, err);
  }
}

/**
 * Fetch data with smart provider routing:
 * 1. Read-from-DB-first (if cached bars exist)
 * 2. Crypto: Binance (primary) → EODHD → Yahoo
 * 3. Non-crypto: EODHD (primary) → Yahoo (fallback)
 */
async function fetchMarketData(
  symbol: string, 
  timeframe: string, 
  fromTimestamp?: number,
  supabase?: any,
  assetType?: string
): Promise<OHLCBar[]> {
  const isCrypto = symbol.includes('-USD') && !symbol.includes('=');
  const isFX = symbol.includes('=X');
  const isIntraday = ['1h', '4h', '8h'].includes(timeframe);
  const resolvedAssetType = assetType || getAssetType(symbol);
  
  // Step 1: Try reading from DB cache first
  if (supabase && fromTimestamp) {
    const fromDate = new Date(fromTimestamp).toISOString().split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];
    const cachedBars = await readBarsFromDB(supabase, symbol, timeframe, fromDate, toDate);
    
    if (cachedBars.length >= 50) {
      // Check if cache is fresh enough
      const latestCachedBar = cachedBars[cachedBars.length - 1];
      const latestDate = new Date(latestCachedBar.date);
      const hoursStale = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60);
      
      // For intraday timeframes, cache is stale if latest bar is more than 26 hours old
      // (allows for weekends + 2h buffer)
      const maxStaleHours = ['1h', '4h', '8h'].includes(timeframe) ? 26 : 72;
      
      if (hoursStale <= maxStaleHours) {
        console.log(`[Provider] Using ${cachedBars.length} cached bars for ${symbol}@${timeframe} (${hoursStale.toFixed(1)}h old)`);
        return cachedBars;
      } else {
        console.log(`[Provider] Cache stale for ${symbol}@${timeframe} (${hoursStale.toFixed(1)}h old) — fetching fresh data`);
        // Fall through to external providers
      }
    }
  }
  
  let bars: OHLCBar[] = [];
  
  // Step 2: Fetch from external providers with smart routing
  if (isCrypto) {
    // Crypto: Binance first (free, deep history, native 4h support)
    bars = await fetchBinanceData(symbol, timeframe, fromTimestamp);
    
    if (bars.length === 0) {
      console.log(`[Provider] Binance failed for ${symbol}, trying EODHD`);
      bars = await fetchEODHDData(symbol, timeframe, fromTimestamp);
    }
    
    if (bars.length === 0) {
      console.log(`[Provider] EODHD failed for ${symbol}, trying Yahoo fallback`);
      bars = await fetchYahooData(symbol, timeframe, fromTimestamp);
    }
  } else if (isFX && isIntraday) {
    // FX Intraday: EODHD first (primary source), Yahoo as last-resort fallback
    bars = await fetchEODHDData(symbol, timeframe, fromTimestamp);
    
    if (bars.length === 0) {
      console.log(`[Provider] EODHD returned no data for FX ${symbol}, trying Yahoo fallback`);
      bars = await fetchYahooData(symbol, timeframe, fromTimestamp);
    }
    
    // Final fallback: use EODHD EOD (daily) bars to prevent data starvation
    if (bars.length === 0) {
      console.log(`[Provider] Both EODHD intraday and Yahoo failed for FX ${symbol} — trying EODHD EOD as final fallback`);
      bars = await fetchEODHDData(symbol, '1d', fromTimestamp);
      // Note: this gives daily bars not hourly, but keeps the pattern detector from starving on zero data
    }
  } else {
    // Non-crypto daily/weekly: EODHD first (deep history, adjusted close)
    bars = await fetchEODHDData(symbol, timeframe, fromTimestamp);
    
    if (bars.length === 0) {
      console.log(`[Provider] EODHD failed for ${symbol}, trying Yahoo fallback`);
      bars = await fetchYahooData(symbol, timeframe, fromTimestamp);
    }
  }
  
  // Step 3: Persist fetched bars to DB for future reads (non-blocking)
  if (bars.length > 0 && supabase) {
    // Fire-and-forget persistence
    persistBarsToHistoricalPrices(supabase, symbol, timeframe, resolvedAssetType, bars)
      .catch(err => console.warn(`[OHLCV-Persist] Background error:`, err));
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

// Adaptive lookback per pattern and timeframe for macro pattern detection
function getPatternLookback(patternId: string, timeframe: string): number {
  const largeWindowPatterns = ['head-and-shoulders', 'inverse-head-and-shoulders', 'triple-top', 'triple-bottom'];
  const mediumWindowPatterns = ['cup-and-handle'];
  
  if (largeWindowPatterns.includes(patternId)) {
    switch (timeframe) {
      case '1wk': return 120; // ~2.3 years of weekly bars
      case '1d': return 60;   // ~3 months of daily bars
      case '4h': return 40;   // ~7 days of 4h bars
      default: return 25;
    }
  }
  
  if (mediumWindowPatterns.includes(patternId)) {
    switch (timeframe) {
      case '1wk': return 80;
      case '1d': return 40;
      default: return 25;
    }
  }
  
  return 25; // Default for all other patterns
}

function runHistoricalBacktest(
  bars: OHLCBar[],
  symbol: string,
  patternId: string,
  pattern: { direction: 'long' | 'short'; displayName: string; detector: (w: OHLCBar[], assetType?: string) => PatternDetectionResult },
  timeframe: string,
  assetType?: string,
  lookback?: number,
  maxBarsInTrade: number = 100
): HistoricalOccurrence[] {
  // Use adaptive lookback if not explicitly provided
  if (!lookback) lookback = getPatternLookback(patternId, timeframe);
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
    const detectionResult = pattern.detector(window, resolvedAssetType);
    
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
      stockLetterFilter = null,     // Filter stocks by first letter range { start: 'A', end: 'G' }
      symbolsFilter = null as string[] | null,  // Only process these specific symbols
      barDataOnly = false           // When true, only fetch & persist bar data, skip pattern detection
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
        
        console.log(`[seed-mtf] Fetching ${symbol} @ ${timeframe} (DB-first, then providers)...`);
        const bars = await fetchMarketData(symbol, timeframe, fromTimestamp, supabase, assetType);
        
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
    const allInsertedIds: string[] = [];
    
    for (let i = 0; i < allOccurrences.length; i += CHUNK_SIZE) {
      const chunk = allOccurrences.slice(i, i + CHUNK_SIZE);
      
      const { data: upsertedData, error: insertError } = await supabase
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
          trend_indicators: occ.trend_indicators,
          validation_status: 'pending',
          validation_layers_passed: ['bulkowski_engine'],
          detector_version: 'post-audit-2026-03-29',
        })), {
          onConflict: 'pattern_id,symbol,timeframe,pattern_end_date',
          ignoreDuplicates: true
        })
        .select('id');
      
      if (insertError) {
        console.error(`[seed-mtf] Insert error at chunk ${i / CHUNK_SIZE}:`, insertError);
      } else {
        insertedCount += chunk.length;
        if (upsertedData) allInsertedIds.push(...upsertedData.map((r: any) => r.id));
      }
    }

    // Trigger async pipeline validation (background, capped at 200 patterns)
    if (allInsertedIds.length > 0) {
      const validationPromise = (async () => {
        try {
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
          console.info(`[pipeline] MTF validation triggered for ${Math.min(allInsertedIds.length, 200)} patterns`);
        } catch (err) {
          console.error('[pipeline] MTF validation error:', err);
        }
      })();
      
      // @ts-ignore
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(validationPromise);
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
