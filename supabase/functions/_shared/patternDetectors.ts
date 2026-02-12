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

type PatternDetector = (window: any[]) => PatternDetectionResult;

interface PatternConfig {
  direction: 'long' | 'short';
  displayName: string;
  detector: PatternDetector;
}

// Base patterns (FREE tier) - 6 patterns
export const BASE_PATTERNS = [
  'donchian-breakout-long', 'donchian-breakout-short',
  'double-top', 'double-bottom',
  'ascending-triangle', 'descending-triangle'
];

// Extended patterns (PLUS+ tier) - adds H&S, wedges
export const EXTENDED_PATTERNS = [
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'rising-wedge', 'falling-wedge'
];

// Premium patterns (PRO/TEAM tier) - adds flags, cup & handle
export const PREMIUM_PATTERNS = [
  'bull-flag', 'bear-flag', 'cup-and-handle', 'triple-top', 'triple-bottom'
];

export const ALL_PATTERNS = [...BASE_PATTERNS];

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
          { index: recentHighIdx, price: recentHigh, type: 'high', label: 'Breakout Level' },
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
          { index: recentLowIdx, price: recentLow, type: 'low', label: 'Breakdown Level' },
          { index: window.length - 1, price: currentClose, type: 'low', label: 'Entry' }
        ]
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
      
      // Peak prominence threshold: peaks must be within 5% of the window high
      const prominenceThreshold = highestHigh - range * 0.05;
      
      let firstTop = -1, secondTop = -1;
      for (let i = 2; i < window.length - 3; i++) {
        if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] && 
            highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
          // Skip peaks that aren't prominent (lower highs in downtrend)
          if (highs[i] < prominenceThreshold) continue;
          
          if (firstTop === -1) firstTop = i;
          else if (i - firstTop >= 5 && Math.abs(highs[i] - highs[firstTop]) <= tolerance) {
            secondTop = i;
            break;
          }
        }
      }
      
      if (firstTop === -1 || secondTop === -1) return { detected: false, pivots: [] };
      
      // Prior uptrend check: price before first top should be lower
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
      
      // Trough prominence threshold: troughs must be within 5% of the window low
      const prominenceThreshold = lowestLow + range * 0.05;
      
      let firstBottom = -1, secondBottom = -1;
      for (let i = 2; i < window.length - 3; i++) {
        if (lows[i] < lows[i - 1] && lows[i] < lows[i - 2] && 
            lows[i] < lows[i + 1] && lows[i] < lows[i + 2]) {
          // Skip troughs that aren't prominent (higher lows in uptrend)
          if (lows[i] > prominenceThreshold) continue;
          
          if (firstBottom === -1) firstBottom = i;
          else if (i - firstBottom >= 5 && Math.abs(lows[i] - lows[firstBottom]) <= tolerance) {
            secondBottom = i;
            break;
          }
        }
      }
      
      if (firstBottom === -1 || secondBottom === -1) return { detected: false, pivots: [] };
      
      // Prior downtrend check: price before first bottom should be higher
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
