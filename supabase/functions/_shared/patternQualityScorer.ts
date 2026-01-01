/**
 * Pattern Quality Scorer v1.0.0 (Edge Function Version)
 * 
 * A production-grade quality scoring system for chart patterns.
 * This is the server-side implementation for use in edge functions.
 */

export interface OHLCBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface ZigZagPivot {
  index: number;
  price: number;
  type: 'high' | 'low';
  timestamp: string;
}

export interface QualityFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  passed: boolean;
}

export interface PatternQualityResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: number;
  factors: QualityFactor[];
  pivots: ZigZagPivot[];
  summary: string;
  tradeable: boolean;
  warnings: string[];
}

// ============= ZIGZAG PIVOT DETECTION =============

export function calculateZigZagPivots(
  bars: OHLCBar[],
  threshold: number = 5
): ZigZagPivot[] {
  if (bars.length < 5) return [];
  
  const pivots: ZigZagPivot[] = [];
  let lastPivotType: 'high' | 'low' | null = null;
  let lastPivotPrice = bars[0].close;
  
  const firstHigh = bars[0].high;
  const firstLow = bars[0].low;
  
  for (let i = 1; i < bars.length; i++) {
    const currentHigh = bars[i].high;
    const currentLow = bars[i].low;
    
    if (lastPivotType === null) {
      if ((currentHigh - firstLow) / firstLow * 100 >= threshold) {
        pivots.push({ index: 0, price: firstLow, type: 'low', timestamp: bars[0].date });
        lastPivotType = 'low';
        lastPivotPrice = firstLow;
      } else if ((firstHigh - currentLow) / currentLow * 100 >= threshold) {
        pivots.push({ index: 0, price: firstHigh, type: 'high', timestamp: bars[0].date });
        lastPivotType = 'high';
        lastPivotPrice = firstHigh;
      }
    } else if (lastPivotType === 'low') {
      if ((currentHigh - lastPivotPrice) / lastPivotPrice * 100 >= threshold) {
        pivots.push({ index: i, price: currentHigh, type: 'high', timestamp: bars[i].date });
        lastPivotType = 'high';
        lastPivotPrice = currentHigh;
      } else if (currentLow < lastPivotPrice) {
        pivots[pivots.length - 1] = { index: i, price: currentLow, type: 'low', timestamp: bars[i].date };
        lastPivotPrice = currentLow;
      }
    } else {
      if ((lastPivotPrice - currentLow) / lastPivotPrice * 100 >= threshold) {
        pivots.push({ index: i, price: currentLow, type: 'low', timestamp: bars[i].date });
        lastPivotType = 'low';
        lastPivotPrice = currentLow;
      } else if (currentHigh > lastPivotPrice) {
        pivots[pivots.length - 1] = { index: i, price: currentHigh, type: 'high', timestamp: bars[i].date };
        lastPivotPrice = currentHigh;
      }
    }
  }
  
  return pivots;
}

// ============= ANALYSIS FUNCTIONS =============

function analyzeVolumeConfirmation(
  bars: OHLCBar[],
  patternStartIndex: number,
  patternEndIndex: number
): { score: number; description: string; confirmed: boolean } {
  if (!bars[0]?.volume || bars.every(b => !b.volume || b.volume === 0)) {
    return { score: 5, description: 'Volume data unavailable', confirmed: false };
  }
  
  const patternBars = bars.slice(patternStartIndex, patternEndIndex + 1);
  const priorBars = bars.slice(Math.max(0, patternStartIndex - 20), patternStartIndex);
  
  if (patternBars.length < 3 || priorBars.length < 5) {
    return { score: 5, description: 'Insufficient bars', confirmed: false };
  }
  
  const patternAvgVolume = patternBars.reduce((s, b) => s + (b.volume || 0), 0) / patternBars.length;
  const priorAvgVolume = priorBars.reduce((s, b) => s + (b.volume || 0), 0) / priorBars.length;
  
  const volumeContraction = priorAvgVolume > 0 ? patternAvgVolume / priorAvgVolume : 1;
  const breakoutBar = bars[patternEndIndex];
  const breakoutVolumeRatio = priorAvgVolume > 0 ? (breakoutBar.volume || 0) / priorAvgVolume : 1;
  
  let score = 5;
  const descriptions: string[] = [];
  
  if (volumeContraction >= 0.5 && volumeContraction <= 0.8) {
    score += 2;
    descriptions.push('Healthy volume contraction');
  } else if (volumeContraction < 0.3) {
    score -= 1;
    descriptions.push('Excessive volume decline');
  }
  
  if (breakoutVolumeRatio >= 2.0) {
    score += 3;
    descriptions.push('Strong breakout volume (2x+)');
  } else if (breakoutVolumeRatio >= 1.5) {
    score += 2;
    descriptions.push('Good breakout volume (1.5x+)');
  } else if (breakoutVolumeRatio < 0.8) {
    score -= 2;
    descriptions.push('Weak breakout volume');
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Normal volume pattern',
    confirmed: score >= 7
  };
}

function analyzeTrendAlignment(
  bars: OHLCBar[],
  direction: 'long' | 'short'
): { score: number; description: string; aligned: boolean } {
  if (bars.length < 50) {
    return { score: 5, description: 'Insufficient data', aligned: false };
  }
  
  const recentBars = bars.slice(-20);
  const extendedBars = bars.slice(-50);
  
  const sma20 = recentBars.reduce((s, b) => s + b.close, 0) / recentBars.length;
  const sma50 = extendedBars.reduce((s, b) => s + b.close, 0) / extendedBars.length;
  const currentPrice = bars[bars.length - 1].close;
  
  const uptrend = currentPrice > sma20 && sma20 > sma50;
  const downtrend = currentPrice < sma20 && sma20 < sma50;
  
  let score = 5;
  let description = '';
  let aligned = false;
  
  if (direction === 'long') {
    if (uptrend) {
      score = 9;
      description = 'Long signal in uptrend';
      aligned = true;
    } else if (downtrend) {
      score = 3;
      description = 'Counter-trend: Long in downtrend';
    } else {
      score = 6;
      description = 'Neutral trend';
    }
  } else {
    if (downtrend) {
      score = 9;
      description = 'Short signal in downtrend';
      aligned = true;
    } else if (uptrend) {
      score = 3;
      description = 'Counter-trend: Short in uptrend';
    } else {
      score = 6;
      description = 'Neutral trend';
    }
  }
  
  return { score, description, aligned };
}

function analyzePatternSymmetry(
  pivots: ZigZagPivot[],
  patternType: string
): { score: number; description: string } {
  if (pivots.length < 3) {
    return { score: 5, description: 'Insufficient pivots' };
  }
  
  let score = 5;
  const descriptions: string[] = [];
  
  const pivotDistances: number[] = [];
  for (let i = 1; i < pivots.length; i++) {
    pivotDistances.push(pivots[i].index - pivots[i - 1].index);
  }
  
  if (pivotDistances.length >= 2) {
    const avgDistance = pivotDistances.reduce((a, b) => a + b, 0) / pivotDistances.length;
    const maxDeviation = Math.max(...pivotDistances.map(d => Math.abs(d - avgDistance) / avgDistance));
    
    if (maxDeviation < 0.3) {
      score += 2;
      descriptions.push('Excellent pivot spacing');
    } else if (maxDeviation < 0.5) {
      score += 1;
      descriptions.push('Good pivot spacing');
    } else if (maxDeviation > 0.8) {
      score -= 1;
      descriptions.push('Irregular pivot spacing');
    }
  }
  
  if (patternType.includes('double') || patternType.includes('head')) {
    const highs = pivots.filter(p => p.type === 'high');
    const lows = pivots.filter(p => p.type === 'low');
    
    if (highs.length >= 2) {
      const highDiff = Math.abs(highs[0].price - highs[1].price) / highs[0].price;
      if (highDiff < 0.02) {
        score += 2;
        descriptions.push('Near-equal resistance levels');
      }
    }
    
    if (lows.length >= 2) {
      const lowDiff = Math.abs(lows[0].price - lows[1].price) / lows[0].price;
      if (lowDiff < 0.02) {
        score += 1;
        descriptions.push('Near-equal support levels');
      }
    }
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Standard structure'
  };
}

function analyzePriceActionClarity(
  bars: OHLCBar[],
  patternStartIndex: number,
  patternEndIndex: number
): { score: number; description: string } {
  const patternBars = bars.slice(patternStartIndex, patternEndIndex + 1);
  
  if (patternBars.length < 5) {
    return { score: 5, description: 'Insufficient bars' };
  }
  
  let score = 5;
  const descriptions: string[] = [];
  
  const avgRange = patternBars.reduce((s, b) => s + (b.high - b.low), 0) / patternBars.length;
  const avgBody = patternBars.reduce((s, b) => s + Math.abs(b.close - b.open), 0) / patternBars.length;
  const bodyToRangeRatio = avgRange > 0 ? avgBody / avgRange : 0;
  
  if (bodyToRangeRatio > 0.6) {
    score += 2;
    descriptions.push('Strong candle bodies');
  } else if (bodyToRangeRatio < 0.3) {
    score -= 1;
    descriptions.push('Many indecision candles');
  }
  
  const excessiveWicks = patternBars.filter(b => {
    const upperWick = b.high - Math.max(b.open, b.close);
    const lowerWick = Math.min(b.open, b.close) - b.low;
    const body = Math.abs(b.close - b.open);
    return (upperWick > body * 2 || lowerWick > body * 2);
  }).length;
  
  if (excessiveWicks / patternBars.length < 0.2) {
    score += 1;
    descriptions.push('Clean price action');
  } else if (excessiveWicks / patternBars.length > 0.5) {
    score -= 2;
    descriptions.push('Noisy price action');
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Normal price action'
  };
}

function analyzeTargetValidity(
  atr: number,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): { score: number; description: string } {
  const stopDistance = Math.abs(entryPrice - stopLoss);
  const targetDistance = Math.abs(takeProfit - entryPrice);
  const riskReward = targetDistance / stopDistance;
  
  let score = 5;
  const descriptions: string[] = [];
  
  const stopATRs = stopDistance / atr;
  if (stopATRs >= 1 && stopATRs <= 3) {
    score += 2;
    descriptions.push(`Stop at ${stopATRs.toFixed(1)} ATR (optimal)`);
  } else if (stopATRs < 0.5) {
    score -= 2;
    descriptions.push('Stop too tight');
  } else if (stopATRs > 5) {
    score -= 1;
    descriptions.push('Stop too wide');
  }
  
  if (riskReward >= 2) {
    score += 2;
    descriptions.push(`Excellent R:R (${riskReward.toFixed(2)})`);
  } else if (riskReward >= 1.5) {
    score += 1;
    descriptions.push(`Good R:R (${riskReward.toFixed(2)})`);
  } else if (riskReward < 1) {
    score -= 2;
    descriptions.push(`Poor R:R (${riskReward.toFixed(2)})`);
  }
  
  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Standard targets'
  };
}

// ============= MAIN SCORING FUNCTION =============

export interface PatternQualityScorerInput {
  bars: OHLCBar[];
  patternType: string;
  patternStartIndex: number;
  patternEndIndex: number;
  direction: 'long' | 'short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  atr: number;
}

export function calculatePatternQualityScore(
  input: PatternQualityScorerInput
): PatternQualityResult {
  const {
    bars,
    patternType,
    patternStartIndex,
    patternEndIndex,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    atr
  } = input;
  
  const factors: QualityFactor[] = [];
  const warnings: string[] = [];
  
  const pivots = calculateZigZagPivots(bars.slice(patternStartIndex, patternEndIndex + 1), 3);
  
  // Factor 1: Volume (20%)
  const volumeAnalysis = analyzeVolumeConfirmation(bars, patternStartIndex, patternEndIndex);
  factors.push({
    name: 'Volume Confirmation',
    score: volumeAnalysis.score,
    weight: 0.20,
    description: volumeAnalysis.description,
    passed: volumeAnalysis.confirmed
  });
  if (volumeAnalysis.score < 5) warnings.push('Low volume confirmation');
  
  // Factor 2: Trend (25%)
  const trendAnalysis = analyzeTrendAlignment(bars, direction);
  factors.push({
    name: 'Trend Alignment',
    score: trendAnalysis.score,
    weight: 0.25,
    description: trendAnalysis.description,
    passed: trendAnalysis.aligned
  });
  if (trendAnalysis.score < 5) warnings.push('Counter-trend signal');
  
  // Factor 3: Symmetry (15%)
  const symmetryAnalysis = analyzePatternSymmetry(pivots, patternType);
  factors.push({
    name: 'Pattern Symmetry',
    score: symmetryAnalysis.score,
    weight: 0.15,
    description: symmetryAnalysis.description,
    passed: symmetryAnalysis.score >= 6
  });
  
  // Factor 4: Clarity (15%)
  const clarityAnalysis = analyzePriceActionClarity(bars, patternStartIndex, patternEndIndex);
  factors.push({
    name: 'Price Action Clarity',
    score: clarityAnalysis.score,
    weight: 0.15,
    description: clarityAnalysis.description,
    passed: clarityAnalysis.score >= 6
  });
  
  // Factor 5: Targets (25%)
  const targetAnalysis = analyzeTargetValidity(atr, entryPrice, stopLoss, takeProfit);
  factors.push({
    name: 'Target Structure',
    score: targetAnalysis.score,
    weight: 0.25,
    description: targetAnalysis.description,
    passed: targetAnalysis.score >= 6
  });
  
  // Calculate weighted score
  const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  const finalScore = Math.round(weightedScore * 10) / 10;
  
  // Grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (finalScore >= 8) grade = 'A';
  else if (finalScore >= 6.5) grade = 'B';
  else if (finalScore >= 5) grade = 'C';
  else if (finalScore >= 3.5) grade = 'D';
  else grade = 'F';
  
  // Confidence
  const passedFactors = factors.filter(f => f.passed).length;
  const confidence = Math.round((passedFactors / factors.length) * 100);
  
  // Tradeable
  const tradeable = finalScore >= 5 && warnings.length <= 2;
  
  // Summary
  const passedNames = factors.filter(f => f.passed).map(f => f.name);
  const summary = passedNames.length >= 3
    ? `Strong pattern with ${passedNames.slice(0, 3).join(', ')}`
    : `Pattern detected with ${passedNames.length}/${factors.length} quality factors`;
  
  return {
    score: finalScore,
    grade,
    confidence,
    factors,
    pivots,
    summary,
    tradeable,
    warnings
  };
}

export function toArtifactQuality(result: PatternQualityResult): {
  score: number;
  grade: string;
  confidence: number;
  reasons: string[];
  warnings: string[];
  tradeable: boolean;
  factors?: QualityFactor[];
} {
  return {
    score: result.score,
    grade: result.grade,
    confidence: result.confidence,
    reasons: result.factors.filter(f => f.passed).map(f => f.description),
    warnings: result.warnings,
    tradeable: result.tradeable,
    factors: result.factors
  };
}
