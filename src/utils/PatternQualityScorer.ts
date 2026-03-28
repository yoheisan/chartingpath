/**
 * Pattern Quality Scorer v1.0.0
 * 
 * A production-grade quality scoring system for chart patterns.
 * Implements multi-factor analysis using ZigZag pivots, volume confirmation,
 * trend alignment, and statistical validation.
 * 
 * Scoring Scale: 0-10 (0 = invalid, 10 = institutional quality)
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
  score: number; // 0-10
  weight: number;
  description: string;
  passed: boolean;
}

export interface PatternQualityResult {
  score: number; // 0-10 numeric score
  grade: 'A' | 'B' | 'C' | 'D' | 'F'; // Letter grade for display
  confidence: number; // 0-100%
  factors: QualityFactor[];
  pivots: ZigZagPivot[];
  summary: string;
  tradeable: boolean;
  warnings: string[];
  volumeDataAvailable: boolean;
  mtfConfirmed: boolean;
  mtfTimeframe?: string;
}

// ============= ZIGZAG PIVOT DETECTION =============

/**
 * Implements the ZigZag indicator algorithm to identify significant price pivots.
 * Uses a percentage-based threshold to filter noise.
 */
export function calculateZigZagPivots(
  bars: OHLCBar[],
  threshold: number = 5 // percentage threshold for pivot
): ZigZagPivot[] {
  if (bars.length < 5) return [];
  
  const pivots: ZigZagPivot[] = [];
  let lastPivotType: 'high' | 'low' | null = null;
  let lastPivotIndex = 0;
  let lastPivotPrice = bars[0].close;
  
  // Initialize with first bar
  const firstHigh = bars[0].high;
  const firstLow = bars[0].low;
  
  for (let i = 1; i < bars.length; i++) {
    const currentHigh = bars[i].high;
    const currentLow = bars[i].low;
    
    if (lastPivotType === null) {
      // Determine initial direction
      if ((currentHigh - firstLow) / firstLow * 100 >= threshold) {
        pivots.push({ index: 0, price: firstLow, type: 'low', timestamp: bars[0].date });
        lastPivotType = 'low';
        lastPivotPrice = firstLow;
        lastPivotIndex = 0;
      } else if ((firstHigh - currentLow) / currentLow * 100 >= threshold) {
        pivots.push({ index: 0, price: firstHigh, type: 'high', timestamp: bars[0].date });
        lastPivotType = 'high';
        lastPivotPrice = firstHigh;
        lastPivotIndex = 0;
      }
    } else if (lastPivotType === 'low') {
      // Looking for high pivot
      if ((currentHigh - lastPivotPrice) / lastPivotPrice * 100 >= threshold) {
        pivots.push({ index: i, price: currentHigh, type: 'high', timestamp: bars[i].date });
        lastPivotType = 'high';
        lastPivotPrice = currentHigh;
        lastPivotIndex = i;
      } else if (currentLow < lastPivotPrice) {
        // Update last low if we found a lower low
        pivots[pivots.length - 1] = { index: i, price: currentLow, type: 'low', timestamp: bars[i].date };
        lastPivotPrice = currentLow;
        lastPivotIndex = i;
      }
    } else {
      // lastPivotType === 'high', looking for low pivot
      if ((lastPivotPrice - currentLow) / lastPivotPrice * 100 >= threshold) {
        pivots.push({ index: i, price: currentLow, type: 'low', timestamp: bars[i].date });
        lastPivotType = 'low';
        lastPivotPrice = currentLow;
        lastPivotIndex = i;
      } else if (currentHigh > lastPivotPrice) {
        // Update last high if we found a higher high
        pivots[pivots.length - 1] = { index: i, price: currentHigh, type: 'high', timestamp: bars[i].date };
        lastPivotPrice = currentHigh;
        lastPivotIndex = i;
      }
    }
  }
  
  return pivots;
}

// ============= VOLUME ANALYSIS =============

/**
 * Analyzes volume patterns to confirm pattern validity.
 * Returns a score from 0-10 based on volume confirmation.
 */
export function analyzeVolumeConfirmation(
  bars: OHLCBar[],
  patternStartIndex: number,
  patternEndIndex: number,
  direction: 'long' | 'short'
): { score: number; description: string; confirmed: boolean } {
  if (!bars[0]?.volume || bars.every(b => !b.volume || b.volume === 0)) {
    return { score: 5, description: 'Volume data unavailable', confirmed: false };
  }
  
  const patternBars = bars.slice(patternStartIndex, patternEndIndex + 1);
  const priorBars = bars.slice(Math.max(0, patternStartIndex - 20), patternStartIndex);
  
  if (patternBars.length < 3 || priorBars.length < 5) {
    return { score: 5, description: 'Insufficient bars for volume analysis', confirmed: false };
  }
  
  // Calculate average volumes
  const patternAvgVolume = patternBars.reduce((s, b) => s + (b.volume || 0), 0) / patternBars.length;
  const priorAvgVolume = priorBars.reduce((s, b) => s + (b.volume || 0), 0) / priorBars.length;
  
  // Volume contraction during pattern formation (good for breakouts)
  const volumeContraction = priorAvgVolume > 0 ? patternAvgVolume / priorAvgVolume : 1;
  
  // Check breakout bar volume
  const breakoutBar = bars[patternEndIndex];
  const breakoutVolumeRatio = priorAvgVolume > 0 ? (breakoutBar.volume || 0) / priorAvgVolume : 1;
  
  let score = 5; // Start neutral
  let descriptions: string[] = [];
  
  // Volume contraction during pattern (ideal: 0.5-0.8x average)
  if (volumeContraction >= 0.5 && volumeContraction <= 0.8) {
    score += 2;
    descriptions.push('Healthy volume contraction during pattern');
  } else if (volumeContraction < 0.3) {
    score -= 1;
    descriptions.push('Excessive volume decline');
  }
  
  // Breakout volume surge (ideal: >1.5x average)
  if (breakoutVolumeRatio >= 2.0) {
    score += 3;
    descriptions.push('Strong breakout volume (2x+ average)');
  } else if (breakoutVolumeRatio >= 1.5) {
    score += 2;
    descriptions.push('Good breakout volume (1.5x+ average)');
  } else if (breakoutVolumeRatio < 0.8) {
    score -= 2;
    descriptions.push('Weak breakout volume');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(10, score));
  const confirmed = score >= 7;
  
  return {
    score,
    description: descriptions.join('; ') || 'Normal volume pattern',
    confirmed
  };
}

// ============= TREND ALIGNMENT =============

/**
 * Checks if the pattern aligns with higher timeframe trend.
 * Counter-trend patterns are penalized.
 */
export function analyzeTrendAlignment(
  bars: OHLCBar[],
  direction: 'long' | 'short'
): { score: number; description: string; aligned: boolean } {
  if (bars.length < 50) {
    return { score: 5, description: 'Insufficient data for trend analysis', aligned: false };
  }
  
  // Calculate SMAs
  const recentBars = bars.slice(-20);
  const extendedBars = bars.slice(-50);
  
  const sma20 = recentBars.reduce((s, b) => s + b.close, 0) / recentBars.length;
  const sma50 = extendedBars.reduce((s, b) => s + b.close, 0) / extendedBars.length;
  const currentPrice = bars[bars.length - 1].close;
  
  // Determine trend
  const uptrend = currentPrice > sma20 && sma20 > sma50;
  const downtrend = currentPrice < sma20 && sma20 < sma50;
  
  let score = 5;
  let description = '';
  let aligned = false;
  
  if (direction === 'long') {
    if (uptrend) {
      score = 9;
      description = 'Strong alignment: Long signal in uptrend';
      aligned = true;
    } else if (downtrend) {
      score = 3;
      description = 'Counter-trend: Long signal in downtrend';
    } else {
      score = 6;
      description = 'Neutral trend context';
    }
  } else {
    if (downtrend) {
      score = 9;
      description = 'Strong alignment: Short signal in downtrend';
      aligned = true;
    } else if (uptrend) {
      score = 3;
      description = 'Counter-trend: Short signal in uptrend';
    } else {
      score = 6;
      description = 'Neutral trend context';
    }
  }
  
  return { score, description, aligned };
}

// ============= PATTERN SYMMETRY =============

/**
 * Analyzes the geometric symmetry of the pattern.
 * Well-formed patterns have balanced structure.
 */
function getTriangleTouchBonus(patternType: string, touchCount: number): number {
  if (!['ascending-triangle', 'descending-triangle'].includes(patternType)) return 0;
  if (touchCount >= 5) return 1.5;
  if (touchCount >= 4) return 1.0;
  if (touchCount >= 3) return 0;
  return -1.0;
}

export function analyzePatternSymmetry(
  pivots: ZigZagPivot[],
  patternType: string,
  touchCount?: number
): { score: number; description: string } {
  if (pivots.length < 3) {
    return { score: 5, description: 'Insufficient pivots for symmetry analysis' };
  }
  
  let score = 5;
  let descriptions: string[] = [];
  
  // Check pivot spacing (should be relatively even)
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
  
  // Pattern-specific symmetry checks
  if (patternType.includes('double') || patternType.includes('head')) {
    const highs = pivots.filter(p => p.type === 'high');
    const lows = pivots.filter(p => p.type === 'low');
    
    // Check for equal peaks/troughs
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
  
  // Triangle touch count bonus/penalty
  const touchBonus = getTriangleTouchBonus(patternType, touchCount ?? 3);
  if (touchBonus !== 0) {
    score += touchBonus;
    descriptions.push(touchBonus > 0 ? `${touchCount} touches — strong confirmation` : 'Few touches — weak confirmation');
  }

  score = Math.max(0, Math.min(10, score));
  
  return {
    score,
    description: descriptions.join('; ') || 'Standard pattern structure'
  };
}

// ============= PRICE ACTION CLARITY =============

/**
 * Evaluates the clarity of price action in the pattern.
 * Clean patterns with minimal noise score higher.
 */
export function analyzePriceActionClarity(
  bars: OHLCBar[],
  patternStartIndex: number,
  patternEndIndex: number
): { score: number; description: string } {
  const patternBars = bars.slice(patternStartIndex, patternEndIndex + 1);
  
  if (patternBars.length < 5) {
    return { score: 5, description: 'Insufficient bars for clarity analysis' };
  }
  
  let score = 5;
  let descriptions: string[] = [];
  
  // Calculate average bar size
  const avgRange = patternBars.reduce((s, b) => s + (b.high - b.low), 0) / patternBars.length;
  const avgBody = patternBars.reduce((s, b) => s + Math.abs(b.close - b.open), 0) / patternBars.length;
  const bodyToRangeRatio = avgRange > 0 ? avgBody / avgRange : 0;
  
  // Strong bodies indicate conviction
  if (bodyToRangeRatio > 0.6) {
    score += 2;
    descriptions.push('Strong candle bodies (conviction)');
  } else if (bodyToRangeRatio < 0.3) {
    score -= 1;
    descriptions.push('Many doji/spinning tops (indecision)');
  }
  
  // Check for excessive wicks (noise)
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

// ============= ATR-NORMALIZED TARGETS =============

/**
 * Validates that target distances are appropriate relative to ATR.
 */
export function analyzeTargetValidity(
  atr: number,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  direction: 'long' | 'short'
): { score: number; description: string } {
  const stopDistance = Math.abs(entryPrice - stopLoss);
  const targetDistance = Math.abs(takeProfit - entryPrice);
  const riskReward = targetDistance / stopDistance;
  
  let score = 5;
  let descriptions: string[] = [];
  
  // Stop should be 1-3 ATR
  const stopATRs = stopDistance / atr;
  if (stopATRs >= 1 && stopATRs <= 3) {
    score += 2;
    descriptions.push(`Stop at ${stopATRs.toFixed(1)} ATR (optimal)`);
  } else if (stopATRs < 0.5) {
    score -= 2;
    descriptions.push('Stop too tight (likely to get stopped)');
  } else if (stopATRs > 5) {
    score -= 1;
    descriptions.push('Stop too wide');
  }
  
  // Risk/Reward should be >= 1.5
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
    description: descriptions.join('; ') || 'Standard target structure'
  };
}

/**
 * Cup & Handle handle depth bonus/penalty.
 * Rewards shallow handles (Bulkowski: shallower handles have higher breakout success).
 */
function getCupHandleHandleBonus(patternType: string, handleDepth?: number): number {
  if (!['cup-and-handle', 'inverse-cup-and-handle'].includes(patternType)) return 0;
  if (handleDepth === undefined || handleDepth === null) return 0;
  
  if (handleDepth <= 0.15) return 1.0;   // very shallow — strong signal
  if (handleDepth <= 0.25) return 0.5;   // shallow — good signal
  if (handleDepth <= 0.33) return 0;     // normal — no bonus
  return -0.5;                            // deep handle — slight penalty
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
  handleDepth?: number; // Cup & Handle: handle retracement as ratio of cup depth (0-1)
  mtfConfirmed?: boolean; // true if same pattern exists on next higher timeframe
  mtfTimeframe?: string;  // the higher timeframe where confirmation was found
}

/**
 * Calculates a comprehensive quality score for a detected pattern.
 * Uses multiple weighted factors to produce a 0-10 score.
 */
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
  
  // Calculate ZigZag pivots
  const pivots = calculateZigZagPivots(bars.slice(patternStartIndex, patternEndIndex + 1), 3);
  
  // Factor 1: Volume Confirmation (weight: 0.20)
  const volumeAnalysis = analyzeVolumeConfirmation(bars, patternStartIndex, patternEndIndex, direction);
  factors.push({
    name: 'Volume Confirmation',
    score: volumeAnalysis.score,
    weight: 0.20,
    description: volumeAnalysis.description,
    passed: volumeAnalysis.confirmed
  });
  if (volumeAnalysis.score < 5) warnings.push('Low volume confirmation');
  
  // Factor 2: Trend Alignment (weight: 0.25)
  const trendAnalysis = analyzeTrendAlignment(bars, direction);
  factors.push({
    name: 'Trend Alignment',
    score: trendAnalysis.score,
    weight: 0.25,
    description: trendAnalysis.description,
    passed: trendAnalysis.aligned
  });
  if (trendAnalysis.score < 5) warnings.push('Counter-trend signal');
  
  // Factor 3: Pattern Symmetry (weight: 0.15)
  const symmetryAnalysis = analyzePatternSymmetry(pivots, patternType);
  factors.push({
    name: 'Pattern Symmetry',
    score: symmetryAnalysis.score,
    weight: 0.15,
    description: symmetryAnalysis.description,
    passed: symmetryAnalysis.score >= 6
  });
  
  // Factor 4: Price Action Clarity (weight: 0.15)
  const clarityAnalysis = analyzePriceActionClarity(bars, patternStartIndex, patternEndIndex);
  factors.push({
    name: 'Price Action Clarity',
    score: clarityAnalysis.score,
    weight: 0.15,
    description: clarityAnalysis.description,
    passed: clarityAnalysis.score >= 6
  });
  
  // Factor 5: Target Validity (weight: 0.25)
  const targetAnalysis = analyzeTargetValidity(atr, entryPrice, stopLoss, takeProfit, direction);
  factors.push({
    name: 'Target Structure',
    score: targetAnalysis.score,
    weight: 0.25,
    description: targetAnalysis.description,
    passed: targetAnalysis.score >= 6
  });
  
  // Detect whether volume data was available
  const volumeDataAvailable = !factors
    .filter(f => f.name === 'Volume Confirmation')
    .some(f => f.description.includes('unavailable'));

  // Calculate weighted score — no redistribution for missing volume
  let weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  
  // Cup & Handle handle depth bonus/penalty
  const handleBonus = getCupHandleHandleBonus(input.patternType, input.handleDepth);
  weightedScore += handleBonus;
  
  // MTF Confirmation bonus — additive, does not affect factor weights
  const MTF_BONUS = input.mtfConfirmed ? 0.8 : 0;
  weightedScore += MTF_BONUS;
  
  const finalScore = Math.max(0, Math.min(10, Math.round(weightedScore * 10) / 10));
  
  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (finalScore >= 8) grade = 'A';
  else if (finalScore >= 6.5) grade = 'B';
  else if (finalScore >= 5) grade = 'C';
  else if (finalScore >= 3.5) grade = 'D';
  else grade = 'F';
  
  // Calculate confidence (based on how many factors passed)
  const passedFactors = factors.filter(f => f.passed).length;
  const confidence = Math.round((passedFactors / factors.length) * 100);
  
  // Determine tradeability
  const tradeable = finalScore >= 5 && warnings.length <= 2;
  
  // Generate summary
  const passedNames = factors.filter(f => f.passed).map(f => f.name);
  const summary = passedNames.length >= 3
    ? `Strong pattern with ${passedNames.slice(0, 3).join(', ')}`
    : `Pattern detected with ${passedNames.length}/${factors.length} quality factors`;
  
  if (!volumeDataAvailable) {
    warnings.push('Volume data unavailable — score based on non-volume factors only');
  }

  return {
    score: finalScore,
    grade,
    confidence,
    factors,
    pivots,
    summary,
    tradeable,
    warnings,
    volumeDataAvailable,
    mtfConfirmed: !!input.mtfConfirmed,
    mtfTimeframe: input.mtfConfirmed ? input.mtfTimeframe : undefined
  };
}

/**
 * Converts the detailed quality result to a simplified format for artifacts.
 */
export function toArtifactQuality(result: PatternQualityResult): {
  score: number;
  grade: string;
  confidence: number;
  reasons: string[];
  warnings: string[];
  tradeable: boolean;
} {
  return {
    score: result.score,
    grade: result.grade,
    confidence: result.confidence,
    reasons: result.factors.filter(f => f.passed).map(f => f.description),
    warnings: result.warnings,
    tradeable: result.tradeable
  };
}
