// Pattern detection logic - extracted from scan-live-patterns for smaller bundle

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

type PatternDetector = (window: any[], timeframe?: string) => PatternDetectionResult;

interface PatternConfig {
  direction: 'long' | 'short';
  displayName: string;
  detector: PatternDetector;
}

// Base patterns (FREE tier) - 7 patterns
export const BASE_PATTERNS = [
  'donchian-breakout-long', 'donchian-breakout-short',
  'double-top', 'double-bottom',
  'ascending-triangle', 'descending-triangle', 'symmetrical-triangle'
];

// Extended patterns (PLUS+ tier) - adds H&S, wedges
export const EXTENDED_PATTERNS = [
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'rising-wedge', 'falling-wedge'
];

// Premium patterns (PRO/ELITE tier) - adds flags, cup & handle, inverse cup
export const PREMIUM_PATTERNS = [
  'bull-flag', 'bear-flag', 'cup-and-handle', 'inverse-cup-and-handle', 'triple-top', 'triple-bottom'
];

export const ALL_PATTERNS = [...BASE_PATTERNS, ...EXTENDED_PATTERNS, ...PREMIUM_PATTERNS];

// Pattern registry with detection logic
export const PATTERN_REGISTRY: Record<string, PatternConfig> = {
  'donchian-breakout-long': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      const lookbackHighs = highs.slice(0, -2);
      const recentHigh = Math.max(...lookbackHighs);
      const recentHighIdx = lookbackHighs.indexOf(recentHigh);
      const currentClose = closes[closes.length - 1];
      const prevClose = closes[closes.length - 2];
      
      // Must close beyond channel (not just wick)
      const closeBeyond = currentClose > recentHigh * 1.001 || prevClose > recentHigh * 1.001;
      if (!closeBeyond) return { detected: false, pivots: [] };
      
      // ADX > 20 filter: use directional movement as proxy
      // Calculate average directional range over last 14 bars
      const adxBars = window.slice(-15);
      let dmPlusSum = 0, dmMinusSum = 0, trSum = 0;
      for (let i = 1; i < adxBars.length; i++) {
        const dmPlus = Math.max(0, adxBars[i].high - adxBars[i-1].high);
        const dmMinus = Math.max(0, adxBars[i-1].low - adxBars[i].low);
        const tr = Math.max(adxBars[i].high - adxBars[i].low, Math.abs(adxBars[i].high - adxBars[i-1].close), Math.abs(adxBars[i].low - adxBars[i-1].close));
        if (dmPlus > dmMinus) { dmPlusSum += dmPlus; } else { dmMinusSum += dmMinus; }
        trSum += tr;
      }
      const diPlus = trSum > 0 ? (dmPlusSum / trSum) * 100 : 0;
      const diMinus = trSum > 0 ? (dmMinusSum / trSum) * 100 : 0;
      const dx = (diPlus + diMinus) > 0 ? Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100 : 0;
      if (dx < 20) return { detected: false, pivots: [] };
      
      return {
        detected: true,
        pivots: [
          { index: window.length - 1, price: recentHigh, type: 'high', label: 'Breakout Level' },
          { index: window.length - 1, price: currentClose, type: 'high', label: 'Entry' }
        ]
      };
    },
    displayName: 'Donchian Breakout Long'
  },
  'donchian-breakout-short': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      const lookbackLows = lows.slice(0, -2);
      const recentLow = Math.min(...lookbackLows);
      const recentLowIdx = lookbackLows.indexOf(recentLow);
      const currentClose = closes[closes.length - 1];
      const prevClose = closes[closes.length - 2];
      
      // Must close beyond channel (not just wick)
      const closeBeyond = currentClose < recentLow * 0.999 || prevClose < recentLow * 0.999;
      if (!closeBeyond) return { detected: false, pivots: [] };
      
      // ADX > 20 filter
      const adxBars = window.slice(-15);
      let dmPlusSum = 0, dmMinusSum = 0, trSum = 0;
      for (let i = 1; i < adxBars.length; i++) {
        const dmPlus = Math.max(0, adxBars[i].high - adxBars[i-1].high);
        const dmMinus = Math.max(0, adxBars[i-1].low - adxBars[i].low);
        const tr = Math.max(adxBars[i].high - adxBars[i].low, Math.abs(adxBars[i].high - adxBars[i-1].close), Math.abs(adxBars[i].low - adxBars[i-1].close));
        if (dmPlus > dmMinus) { dmPlusSum += dmPlus; } else { dmMinusSum += dmMinus; }
        trSum += tr;
      }
      const diPlus = trSum > 0 ? (dmPlusSum / trSum) * 100 : 0;
      const diMinus = trSum > 0 ? (dmMinusSum / trSum) * 100 : 0;
      const dx = (diPlus + diMinus) > 0 ? Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100 : 0;
      if (dx < 20) return { detected: false, pivots: [] };
      
      return {
        detected: true,
        pivots: [
          { index: window.length - 1, price: recentLow, type: 'low', label: 'Breakdown Level' },
          { index: window.length - 1, price: currentClose, type: 'low', label: 'Entry' }
        ]
      };
    },
    displayName: 'Donchian Breakout Short'
  },
  'double-top': {
    direction: 'short',
    detector: (window, timeframe?) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const range = highestHigh - lowestLow;
      const tolerance = range * 0.03;
      
      // Intraday timeframes require stricter parameters
      const isIntraday = timeframe && ['1h', '4h', '2h', '30m', '15m'].includes(timeframe.toLowerCase());
      const minSeparation = isIntraday ? 7 : 5;
      
      // Peak prominence threshold: peaks must be within 5% of the window high
      const prominenceThreshold = highestHigh - range * 0.05;
      
      let firstTop = -1, secondTop = -1;
      for (let i = 2; i < window.length - 3; i++) {
        if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && 
            highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
          if (highs[i] < prominenceThreshold) continue;
          
          if (firstTop === -1) firstTop = i;
          else if (i - firstTop >= minSeparation && Math.abs(highs[i] - highs[firstTop]) <= tolerance) {
            secondTop = i;
            break;
          }
        }
      }
      
      if (firstTop === -1 || secondTop === -1) return { detected: false, pivots: [] };
      
      // Prior uptrend check: price before first top should be lower
      const preTopPrice = Math.min(...lows.slice(0, Math.max(1, firstTop)));
      const priorRise = (highs[firstTop] - preTopPrice) / preTopPrice;
      const minPriorTrend = isIntraday ? 0.03 : 0.02;
      if (priorRise < minPriorTrend) return { detected: false, pivots: [] };
      
      let necklineIdx = firstTop;
      let neckline = lows[firstTop];
      for (let i = firstTop; i <= secondTop; i++) {
        if (lows[i] < neckline) {
          neckline = lows[i];
          necklineIdx = i;
        }
      }
      
      // Minimum retracement depth: the neckline must be meaningfully below the peaks
      const retracementDepth = (highestHigh - neckline) / highestHigh;
      const minRetracement = isIntraday ? 0.015 : 0.01;
      if (retracementDepth < minRetracement) return { detected: false, pivots: [] };
      
      // Neckline break confirmation: intraday needs stronger break
      const breakThreshold = isIntraday ? 0.003 : 0.002;
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < neckline * (1 - breakThreshold);
      
      // Trend context gating: for bearish reversal (Double Top), suppress if already in strong downtrend
      // (Double Top is a reversal — it should appear after an uptrend, not mid-downtrend)
      if (detected && closes.length >= 10) {
        const sma10 = closes.slice(-10).reduce((a, b) => a + b, 0) / 10;
        const sma20 = closes.length >= 20 ? closes.slice(-20).reduce((a, b) => a + b, 0) / 20 : sma10;
        // If price is well below SMA20, the "uptrend → reversal" thesis is weak
        if (lastClose < sma20 * 0.97) return { detected: false, pivots: [] };
      }
      
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
    detector: (window, timeframe?) => {
      if (window.length < 15) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      const highestHigh = Math.max(...highs);
      const lowestLow = Math.min(...lows);
      const range = highestHigh - lowestLow;
      if (range === 0) return { detected: false, pivots: [] };
      const tolerance = range * 0.025; // Tighter tolerance for similar bottoms
      
      // Intraday timeframes require stricter parameters
      const isIntraday = timeframe && ['1h', '4h', '2h', '30m', '15m'].includes(timeframe.toLowerCase());
      const minSeparation = isIntraday ? 7 : 5;
      
      // Pivot detection: require 3 bars on each side for structural significance
      // A real "bottom" must be lower than 3 neighbors on each side
      const pivotWindow = isIntraday ? 4 : 3;
      
      // Trough prominence: bottoms must be in the lower 15% of the price range
      const prominenceThreshold = lowestLow + range * 0.15;
      
      const bottoms: number[] = [];
      for (let i = pivotWindow; i < window.length - pivotWindow; i++) {
        let isPivotLow = true;
        for (let j = 1; j <= pivotWindow; j++) {
          if (lows[i] >= lows[i - j] || lows[i] >= lows[i + j]) {
            isPivotLow = false;
            break;
          }
        }
        if (!isPivotLow) continue;
        if (lows[i] > prominenceThreshold) continue;
        bottoms.push(i);
      }
      
      // Need at least 2 qualifying bottoms
      let firstBottom = -1, secondBottom = -1;
      for (let a = 0; a < bottoms.length - 1; a++) {
        for (let b = a + 1; b < bottoms.length; b++) {
          if (bottoms[b] - bottoms[a] >= minSeparation && 
              Math.abs(lows[bottoms[b]] - lows[bottoms[a]]) <= tolerance) {
            // Verify there's a meaningful bounce between the two bottoms
            const midHigh = Math.max(...highs.slice(bottoms[a], bottoms[b] + 1));
            const avgBottom = (lows[bottoms[a]] + lows[bottoms[b]]) / 2;
            const bounceRatio = (midHigh - avgBottom) / avgBottom;
            const minBounce = isIntraday ? 0.015 : 0.01;
            if (bounceRatio >= minBounce) {
              firstBottom = bottoms[a];
              secondBottom = bottoms[b];
              break;
            }
          }
        }
        if (secondBottom !== -1) break;
      }
      
      if (firstBottom === -1 || secondBottom === -1) return { detected: false, pivots: [] };
      
      // Prior downtrend check: price before first bottom should be higher
      const preBottomPrice = Math.max(...highs.slice(0, Math.max(1, firstBottom)));
      const priorDrop = (preBottomPrice - lows[firstBottom]) / preBottomPrice;
      const minPriorTrend = isIntraday ? 0.03 : 0.02;
      if (priorDrop < minPriorTrend) return { detected: false, pivots: [] };
      
      let necklineIdx = firstBottom;
      let neckline = highs[firstBottom];
      for (let i = firstBottom; i <= secondBottom; i++) {
        if (highs[i] > neckline) {
          neckline = highs[i];
          necklineIdx = i;
        }
      }
      
      // Minimum retracement depth: the bounce between bottoms must be meaningful
      // This prevents shallow noise from being classified as a pattern
      const retracementDepth = (neckline - lowestLow) / lowestLow;
      const minRetracement = isIntraday ? 0.015 : 0.01;
      if (retracementDepth < minRetracement) return { detected: false, pivots: [] };
      
      // Neckline break confirmation: intraday needs stronger break
      const breakThreshold = isIntraday ? 0.003 : 0.002;
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > neckline * (1 + breakThreshold);
      
      // Trend context gating: for bullish reversal (Double Bottom), suppress if price
      // is still deep in downtrend (below SMA20 by >3%). A valid Double Bottom should
      // show price recovering toward or above the mean, not still falling.
      if (detected && closes.length >= 10) {
        const sma10 = closes.slice(-10).reduce((a, b) => a + b, 0) / 10;
        const sma20 = closes.length >= 20 ? closes.slice(-20).reduce((a, b) => a + b, 0) / 20 : sma10;
        // If price is well below SMA20, the reversal thesis is weak
        if (lastClose < sma20 * 0.97) return { detected: false, pivots: [] };
      }
      
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
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // Prior uptrend ≥2%: price should be rising into the triangle
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
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);
      
      // Prior downtrend ≥2%: price should be falling into the triangle
      const earlyHigh = Math.max(...highs.slice(0, 5));
      const midLow = Math.min(...lows.slice(5, 15));
      const priorDrop = (earlyHigh - midLow) / earlyHigh;
      if (priorDrop < 0.02) return { detected: false, pivots: [] };
      
      const supportZone = Math.min(...lows.slice(0, -2));
      
      // Minimum 3 touches on support (flat bottom)
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
  'head-and-shoulders': {
    direction: 'short',
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
      
      // Adaptive peak detection radius: wider for larger windows (macro H&S patterns)
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
      
      // Prior uptrend required: price before left shoulder should be meaningfully lower (≥3%)
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
  'inverse-head-and-shoulders': {
    direction: 'long',
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
      
      // Adaptive trough detection radius: wider for larger windows (macro IH&S patterns)
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
      
      // Prior downtrend required: price before left shoulder should be meaningfully higher (≥3%)
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
  'rising-wedge': {
    direction: 'short',
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
  'falling-wedge': {
    direction: 'long',
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
  'bull-flag': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      
      // Flagpole: Strong uptrend in first 8 bars (at least 5% gain)
      const poleGain = (closes[7] - closes[0]) / closes[0];
      if (poleGain < 0.05) return { detected: false, pivots: [] };
      
      // Flag: Consolidation in bars 8-18 (range < 4%, slight downward or flat drift)
      const flagHighs = highs.slice(8, 18);
      const flagLows = lows.slice(8, 18);
      if (flagHighs.length === 0) return { detected: false, pivots: [] };
      const flagHigh = Math.max(...flagHighs);
      const flagLow = Math.min(...flagLows);
      const flagRange = (flagHigh - flagLow) / flagLow;
      const flagDrift = (closes[Math.min(17, closes.length - 1)] - closes[8]) / closes[8];
      
      // Retracement must be < 50% of pole
      const poleHeight = closes[7] - closes[0];
      const retracement = (closes[7] - flagLow) / poleHeight;
      if (flagRange > 0.04 || flagDrift > 0.02 || retracement > 0.50) return { detected: false, pivots: [] };
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > flagHigh * 1.005;
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: closes[0], type: 'low', label: 'Pole Start' },
          { index: 7, price: closes[7], type: 'high', label: 'Pole End' },
          { index: 8, price: flagHigh, type: 'high', label: 'Flag High' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' }
        ] : []
      };
    },
    displayName: 'Bull Flag'
  },
  'bear-flag': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      
      // Flagpole: Strong downtrend in first 8 bars (at least 5% drop)
      const poleDrop = (closes[0] - closes[7]) / closes[0];
      if (poleDrop < 0.05) return { detected: false, pivots: [] };
      
      // Flag: Consolidation in bars 8-18
      const flagHighs = highs.slice(8, 18);
      const flagLows = lows.slice(8, 18);
      if (flagLows.length === 0) return { detected: false, pivots: [] };
      const flagHigh = Math.max(...flagHighs);
      const flagLow = Math.min(...flagLows);
      const flagRange = (flagHigh - flagLow) / flagLow;
      const flagDrift = (closes[Math.min(17, closes.length - 1)] - closes[8]) / closes[8];
      
      // Retracement must be < 50% of pole
      const poleHeight = closes[0] - closes[7];
      const retracement = (flagHigh - closes[7]) / poleHeight;
      if (flagRange > 0.04 || flagDrift < -0.02 || retracement > 0.50) return { detected: false, pivots: [] };
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < flagLow * 0.995;
      
      return {
        detected,
        pivots: detected ? [
          { index: 0, price: closes[0], type: 'high', label: 'Pole Start' },
          { index: 7, price: closes[7], type: 'low', label: 'Pole End' },
          { index: 8, price: flagLow, type: 'low', label: 'Flag Low' },
          { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
        ] : []
      };
    },
    displayName: 'Bear Flag'
  },
  'cup-and-handle': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      
      // PRIOR UPTREND CHECK: ≥5% (Bulkowski)
      const earlyLow = Math.min(...lows.slice(0, 5));
      const earlyHigh = Math.max(...highs.slice(0, 5));
      if ((earlyHigh - earlyLow) / earlyLow < 0.05) return { detected: false, pivots: [] };
      
      const cupEnd = Math.floor(window.length * 0.7);
      const handleStart = Math.floor(window.length * 0.75);
      
      const leftRim = Math.max(...highs.slice(0, 4));
      const rightRimArea = highs.slice(Math.floor(cupEnd * 0.8), cupEnd);
      const rightRim = rightRimArea.length > 0 ? Math.max(...rightRimArea) : 0;
      const cupMiddle = lows.slice(3, cupEnd - 2);
      const cupBottom = cupMiddle.length > 0 ? Math.min(...cupMiddle) : 0;
      
      if (cupBottom === 0) return { detected: false, pivots: [] };
      
      const rimDiff = Math.abs(leftRim - rightRim) / leftRim;
      const cupDepth = (Math.min(leftRim, rightRim) - cupBottom) / Math.min(leftRim, rightRim);
      if (rimDiff > 0.08 || cupDepth < 0.07 || cupDepth > 0.40) return { detected: false, pivots: [] };
      
      const handleLows = lows.slice(handleStart, window.length - 1);
      if (handleLows.length === 0) return { detected: false, pivots: [] };
      const handleLow = Math.min(...handleLows);
      const handleDepth = (rightRim - handleLow) / (rightRim - cupBottom);
      if (handleDepth < 0.03 || handleDepth > 0.60) return { detected: false, pivots: [] };
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > rightRim * 1.001;
      
      const leftRimIdx = highs.slice(0, 4).indexOf(leftRim);
      const cupBottomIdx = 3 + cupMiddle.indexOf(cupBottom);
      const rightRimStartIdx = Math.floor(cupEnd * 0.8);
      const rightRimIdx = rightRimStartIdx + rightRimArea.indexOf(rightRim);
      
      return {
        detected,
        pivots: detected ? [
          { index: leftRimIdx, price: leftRim, type: 'high', label: 'Left Rim' },
          { index: cupBottomIdx, price: cupBottom, type: 'low', label: 'Cup Bottom' },
          { index: rightRimIdx, price: rightRim, type: 'high', label: 'Right Rim' },
          { index: handleStart + handleLows.indexOf(handleLow), price: handleLow, type: 'low', label: 'Handle' },
          { index: window.length - 1, price: lastClose, type: 'high', label: 'Breakout' }
        ] : []
      };
    },
    displayName: 'Cup & Handle'
  },
  'triple-top': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 25) return { detected: false, pivots: [] };
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
      
      const lastThreePeaks = peaks.slice(-3);
      const peakValues = lastThreePeaks.map(p => p.value);
      const maxPeak = Math.max(...peakValues);
      const minPeak = Math.min(...peakValues);
      if ((maxPeak - minPeak) / minPeak >= 0.03) return { detected: false, pivots: [] };
      
      // PRIOR UPTREND CHECK: ≥2%
      const preTopPrice = Math.min(...lows.slice(0, Math.max(1, lastThreePeaks[0].index)));
      if ((lastThreePeaks[0].value - preTopPrice) / preTopPrice < 0.02) return { detected: false, pivots: [] };
      
      let neckline = Infinity;
      let necklineIdx = lastThreePeaks[0].index;
      for (let i = lastThreePeaks[0].index; i <= lastThreePeaks[2].index; i++) {
        if (lows[i] < neckline) { neckline = lows[i]; necklineIdx = i; }
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < neckline * 0.998;
      
      return {
        detected,
        pivots: detected ? [
          { index: lastThreePeaks[0].index, price: lastThreePeaks[0].value, type: 'high', label: 'Top 1' },
          { index: lastThreePeaks[1].index, price: lastThreePeaks[1].value, type: 'high', label: 'Top 2' },
          { index: lastThreePeaks[2].index, price: lastThreePeaks[2].value, type: 'high', label: 'Top 3' },
          { index: necklineIdx, price: neckline, type: 'low', label: 'Neckline' }
        ] : []
      };
    },
    displayName: 'Triple Top'
  },
  'triple-bottom': {
    direction: 'long',
    detector: (window) => {
      if (window.length < 25) return { detected: false, pivots: [] };
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
      
      const lastThreeTroughs = troughs.slice(-3);
      const troughValues = lastThreeTroughs.map(t => t.value);
      const maxTrough = Math.max(...troughValues);
      const minTrough = Math.min(...troughValues);
      if ((maxTrough - minTrough) / minTrough >= 0.03) return { detected: false, pivots: [] };
      
      // PRIOR DOWNTREND CHECK: ≥2%
      const preBottomPrice = Math.max(...highs.slice(0, Math.max(1, lastThreeTroughs[0].index)));
      if ((preBottomPrice - lastThreeTroughs[0].value) / preBottomPrice < 0.02) return { detected: false, pivots: [] };
      
      let neckline = -Infinity;
      let necklineIdx = lastThreeTroughs[0].index;
      for (let i = lastThreeTroughs[0].index; i <= lastThreeTroughs[2].index; i++) {
        if (highs[i] > neckline) { neckline = highs[i]; necklineIdx = i; }
      }
      
      const lastClose = closes[closes.length - 1];
      const detected = lastClose > neckline * 1.002;
      
      return {
        detected,
        pivots: detected ? [
          { index: lastThreeTroughs[0].index, price: lastThreeTroughs[0].value, type: 'low', label: 'Bottom 1' },
          { index: lastThreeTroughs[1].index, price: lastThreeTroughs[1].value, type: 'low', label: 'Bottom 2' },
          { index: lastThreeTroughs[2].index, price: lastThreeTroughs[2].value, type: 'low', label: 'Bottom 3' },
          { index: necklineIdx, price: neckline, type: 'high', label: 'Neckline' }
        ] : []
      };
    },
    displayName: 'Triple Bottom'
  },
  'symmetrical-triangle': {
    direction: 'long', // Neutral pattern, defaults to long (breakout direction determines actual trade)
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);
      const closes = window.map(d => d.close);

      // Need converging trendlines: lower highs AND higher lows
      // Find at least 2 peaks and 2 troughs
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

      // Last 2 peaks must be descending (lower highs)
      const lastPeaks = peaks.slice(-2);
      if (lastPeaks[1].value >= lastPeaks[0].value) return { detected: false, pivots: [] };
      const highSlope = (lastPeaks[1].value - lastPeaks[0].value) / (lastPeaks[1].index - lastPeaks[0].index);

      // Last 2 troughs must be ascending (higher lows)
      const lastTroughs = troughs.slice(-2);
      if (lastTroughs[1].value <= lastTroughs[0].value) return { detected: false, pivots: [] };
      const lowSlope = (lastTroughs[1].value - lastTroughs[0].value) / (lastTroughs[1].index - lastTroughs[0].index);

      // Slopes must converge (opposite signs)
      if (highSlope >= 0 || lowSlope <= 0) return { detected: false, pivots: [] };

      // Minimum pattern range: at least 3% between first peak and first trough
      const patternRange = (lastPeaks[0].value - lastTroughs[0].value) / lastTroughs[0].value;
      if (patternRange < 0.03) return { detected: false, pivots: [] };

      // Breakout: close above the descending resistance line (projected)
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
    },
    displayName: 'Symmetrical Triangle'
  },
  'inverse-cup-and-handle': {
    direction: 'short',
    detector: (window) => {
      if (window.length < 20) return { detected: false, pivots: [] };
      const closes = window.map(d => d.close);
      const highs = window.map(d => d.high);
      const lows = window.map(d => d.low);

      // PRIOR DOWNTREND CHECK: ≥5% (Bulkowski mirror of cup-and-handle)
      const earlyHigh = Math.max(...highs.slice(0, 5));
      const earlyLow = Math.min(...lows.slice(0, 5));
      if ((earlyHigh - earlyLow) / earlyHigh < 0.05) return { detected: false, pivots: [] };

      const cupEnd = Math.floor(window.length * 0.7);
      const handleStart = Math.floor(window.length * 0.75);

      // Inverted cup: Find inverted U-shape (rims at similar LOW levels, TOP in middle)
      const leftRim = Math.min(...lows.slice(0, 4));
      const rightRimArea = lows.slice(Math.floor(cupEnd * 0.8), cupEnd);
      const rightRim = rightRimArea.length > 0 ? Math.min(...rightRimArea) : Infinity;
      const cupMiddle = highs.slice(3, cupEnd - 2);
      const cupTop = cupMiddle.length > 0 ? Math.max(...cupMiddle) : 0;

      if (cupTop === 0) return { detected: false, pivots: [] };

      const rimDiff = Math.abs(leftRim - rightRim) / leftRim;
      const cupHeight = (cupTop - Math.max(leftRim, rightRim)) / Math.max(leftRim, rightRim);
      if (rimDiff > 0.08 || cupHeight < 0.07 || cupHeight > 0.40) return { detected: false, pivots: [] };

      // Handle: Small rally after right rim (3-60% of cup height retracement)
      const handleHighs = highs.slice(handleStart, window.length - 1);
      if (handleHighs.length === 0) return { detected: false, pivots: [] };
      const handleHigh = Math.max(...handleHighs);
      const handleRetracement = (handleHigh - rightRim) / (cupTop - rightRim);
      if (handleRetracement < 0.03 || handleRetracement > 0.60) return { detected: false, pivots: [] };

      // Breakdown: Last close breaks below right rim
      const lastClose = closes[closes.length - 1];
      const detected = lastClose < rightRim * 0.999;

      const leftRimIdx = lows.slice(0, 4).indexOf(leftRim);
      const cupTopIdx = 3 + cupMiddle.indexOf(cupTop);
      const rightRimStartIdx = Math.floor(cupEnd * 0.8);
      const rightRimIdx = rightRimStartIdx + rightRimArea.indexOf(rightRim);

      return {
        detected,
        pivots: detected ? [
          { index: leftRimIdx, price: leftRim, type: 'low', label: 'Left Rim' },
          { index: cupTopIdx, price: cupTop, type: 'high', label: 'Cup Top' },
          { index: rightRimIdx, price: rightRim, type: 'low', label: 'Right Rim' },
          { index: handleStart + handleHighs.indexOf(handleHigh), price: handleHigh, type: 'high', label: 'Handle' },
          { index: window.length - 1, price: lastClose, type: 'low', label: 'Breakdown' }
        ] : []
      };
    },
    displayName: 'Inverse Cup & Handle'
  },
};

// Helper functions
export function calculateATR(bars: any[], period: number = 14): number {
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

export function isMarketOpen(assetType: string): boolean {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  if (assetType === 'crypto') return true;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  return !isWeekend;
}

// Symbol mapping
export const YAHOO_TO_DB_SYMBOL: Record<string, string> = {
  'EURUSD=X': 'EUR/USD', 'GBPUSD=X': 'GBP/USD', 'USDJPY=X': 'USD/JPY',
  'AUDUSD=X': 'AUD/USD', 'USDCAD=X': 'USD/CAD', 'NZDUSD=X': 'NZD/USD',
  'USDCHF=X': 'USD/CHF', 'EURGBP=X': 'EUR/GBP', 'EURJPY=X': 'EUR/JPY',
  'GBPJPY=X': 'GBP/JPY', 'AUDJPY=X': 'AUD/JPY', 'EURAUD=X': 'EUR/AUD',
  'EURCHF=X': 'EUR/CHF', 'AUDNZD=X': 'AUD/NZD', 'CADJPY=X': 'CAD/JPY',
  'NZDJPY=X': 'NZD/JPY', 'GBPAUD=X': 'GBP/AUD', 'GBPCAD=X': 'GBP/CAD',
  'AUDCAD=X': 'AUD/CAD', 'EURCAD=X': 'EUR/CAD', 'CHFJPY=X': 'CHF/JPY',
  'GBPCHF=X': 'GBP/CHF', 'EURNZD=X': 'EUR/NZD', 'CADCHF=X': 'CAD/CHF',
  'AUDCHF=X': 'AUD/CHF',
  'BTC-USD': 'BTC/USD', 'ETH-USD': 'ETH/USD', 'SOL-USD': 'SOL/USD',
  'BNB-USD': 'BNB/USD', 'XRP-USD': 'XRP/USD', 'ADA-USD': 'ADA/USD',
  'AVAX-USD': 'AVAX/USD', 'DOGE-USD': 'DOGE/USD', 'LINK-USD': 'LINK/USD',
  'MATIC-USD': 'MATIC/USD', 'DOT-USD': 'DOT/USD', 'SHIB-USD': 'SHIB/USD',
  'LTC-USD': 'LTC/USD', 'UNI-USD': 'UNI/USD', 'ATOM-USD': 'ATOM/USD',
  'XLM-USD': 'XLM/USD', 'NEAR-USD': 'NEAR/USD', 'APT-USD': 'APT/USD',
  'ARB-USD': 'ARB/USD', 'OP-USD': 'OP/USD', 'FIL-USD': 'FIL/USD',
  'INJ-USD': 'INJ/USD', 'AAVE-USD': 'AAVE/USD', 'MKR-USD': 'MKR/USD',
  'SAND-USD': 'SAND/USD',
};

export function getDbSymbol(yahooSymbol: string): string {
  return YAHOO_TO_DB_SYMBOL[yahooSymbol] || yahooSymbol;
}
