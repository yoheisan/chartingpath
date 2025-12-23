/**
 * Regime Computation Engine
 * 
 * Deterministic, bar-close-only regime labeling for research analytics.
 * All computations use closed bar data only - no lookahead.
 */

import {
  RegimeConfig,
  RegimeLabel,
  TrendRegime,
  VolatilityRegime,
  TradeLedgerEntry,
  BucketStats,
  PatternStrengthScore,
  StrengthScoreComponents,
  SAMPLE_SIZE_THRESHOLDS,
  DEFAULT_REGIME_CONFIG,
  createRegimeKey,
  scoreToGrade,
  getSampleSizeTier,
} from '@/types/RegimeAnalytics';

// ============================================
// BAR DATA INTERFACE
// ============================================

export interface OHLCBar {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// ============================================
// INDICATOR CALCULATIONS (Bar-Close Only)
// ============================================

/**
 * Simple Moving Average - uses only closed bars
 */
export function calculateSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((sum, p) => sum + p, 0) / period;
}

/**
 * Exponential Moving Average - uses only closed bars
 */
export function calculateEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(closes.slice(0, period), period)!;
  
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }
  return ema;
}

/**
 * Average True Range - uses only closed bars
 */
export function calculateATR(bars: OHLCBar[], period: number): number | null {
  if (bars.length < period + 1) return null;
  
  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const highLow = bars[i].high - bars[i].low;
    const highPrevClose = Math.abs(bars[i].high - bars[i - 1].close);
    const lowPrevClose = Math.abs(bars[i].low - bars[i - 1].close);
    trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
  }
  
  if (trueRanges.length < period) return null;
  return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
}

/**
 * Calculate percentile rank of a value in an array
 */
function percentileRank(values: number[], target: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  let count = 0;
  for (const v of sorted) {
    if (v < target) count++;
  }
  return count / sorted.length;
}

// ============================================
// REGIME LABELING (Core Algorithm)
// ============================================

/**
 * Compute trend regime for a specific bar
 * 
 * Decision rule:
 * - UP: close > MA * (1 + threshold)
 * - DOWN: close < MA * (1 - threshold)
 * - FLAT: otherwise
 * 
 * @param bars - All bars up to and including the target bar (closed bars only)
 * @param config - Regime configuration
 * @returns Trend regime label
 */
export function computeTrendRegime(
  bars: OHLCBar[],
  config: RegimeConfig
): TrendRegime {
  const closes = bars.map(b => b.close);
  const currentClose = closes[closes.length - 1];
  
  const ma = config.trend.indicator === 'EMA'
    ? calculateEMA(closes, config.trend.period)
    : calculateSMA(closes, config.trend.period);
  
  if (ma === null) return 'FLAT'; // Insufficient data
  
  const threshold = config.trend.thresholdPercent / 100;
  const upperBand = ma * (1 + threshold);
  const lowerBand = ma * (1 - threshold);
  
  if (currentClose > upperBand) return 'UP';
  if (currentClose < lowerBand) return 'DOWN';
  return 'FLAT';
}

/**
 * Compute volatility regime for a specific bar
 * 
 * Decision rule based on ATR percentile over lookback:
 * - HIGH: ATR > 67th percentile
 * - LOW: ATR < 33rd percentile
 * - MED: otherwise
 * 
 * @param bars - All bars up to and including the target bar (closed bars only)
 * @param config - Regime configuration
 * @returns Volatility regime label
 */
export function computeVolatilityRegime(
  bars: OHLCBar[],
  config: RegimeConfig
): VolatilityRegime {
  const atrPeriod = config.volatility.atrPeriod;
  const lookback = config.volatility.lookbackBars;
  
  // Calculate ATR for lookback period
  const atrHistory: number[] = [];
  for (let i = atrPeriod + 1; i <= Math.min(bars.length, lookback + atrPeriod); i++) {
    const atr = calculateATR(bars.slice(0, i), atrPeriod);
    if (atr !== null) atrHistory.push(atr);
  }
  
  if (atrHistory.length < 10) return 'MED'; // Insufficient data
  
  const currentATR = atrHistory[atrHistory.length - 1];
  const rank = percentileRank(atrHistory, currentATR);
  
  if (rank >= 0.67) return 'HIGH';
  if (rank <= 0.33) return 'LOW';
  return 'MED';
}

/**
 * Compute full regime label for a specific bar
 * 
 * CRITICAL: This uses only data up to and including the target bar.
 * No lookahead. Bar-close semantics enforced.
 */
export function computeRegimeLabel(
  bars: OHLCBar[],
  config: RegimeConfig = DEFAULT_REGIME_CONFIG
): RegimeLabel {
  const trend = computeTrendRegime(bars, config);
  const volatility = computeVolatilityRegime(bars, config);
  
  return {
    trend,
    volatility,
    key: createRegimeKey(trend, volatility),
  };
}

/**
 * Compute regime labels for all bars in a series
 * Returns array indexed by bar index
 */
export function computeRegimeSeries(
  bars: OHLCBar[],
  config: RegimeConfig = DEFAULT_REGIME_CONFIG
): RegimeLabel[] {
  const labels: RegimeLabel[] = [];
  const minBars = Math.max(config.trend.period, config.volatility.atrPeriod + 10);
  
  for (let i = 0; i < bars.length; i++) {
    if (i < minBars) {
      // Insufficient data - use FLAT_MED as default
      labels.push({ trend: 'FLAT', volatility: 'MED', key: 'FLAT_MED' });
    } else {
      // Use only bars 0..i (bar-close semantics)
      labels.push(computeRegimeLabel(bars.slice(0, i + 1), config));
    }
  }
  
  return labels;
}

// ============================================
// TRADE STATISTICS COMPUTATION
// ============================================

/**
 * Compute bucket statistics from trade entries
 */
export function computeBucketStats(
  trades: TradeLedgerEntry[],
  bucketKey: string,
  patternId: string,
  regimeKey: string
): BucketStats {
  const n = trades.length;
  
  // Handle empty bucket
  if (n === 0) {
    return createEmptyBucketStats(bucketKey, patternId, regimeKey);
  }
  
  // R-Multiple statistics
  const rMultiples = trades.map(t => t.actualRMultiple);
  const wins = trades.filter(t => t.isWin);
  const losses = trades.filter(t => !t.isWin);
  
  const avgRMultiple = mean(rMultiples);
  const medianRMultiple = median(rMultiples);
  const stdDevRMultiple = standardDeviation(rMultiples);
  
  // Win/loss metrics
  const winRate = wins.length / n;
  const avgWin = wins.length > 0 ? mean(wins.map(t => t.actualRMultiple)) : 0;
  const avgLoss = losses.length > 0 ? Math.abs(mean(losses.map(t => t.actualRMultiple))) : 1;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin;
  
  // Distribution tails
  const sorted = [...rMultiples].sort((a, b) => a - b);
  const r5th = percentile(sorted, 0.05);
  const r95th = percentile(sorted, 0.95);
  const skewness = computeSkewness(rMultiples);
  
  // Risk metrics
  const maes = trades.map(t => t.maeRMultiple);
  const mfes = trades.map(t => t.mfeRMultiple);
  const avgMAE = mean(maes);
  const avgMFE = mean(mfes);
  const maxDD = Math.max(...maes.map(Math.abs));
  
  // Confidence interval (assumes approximate normality for large n)
  const se = stdDevRMultiple / Math.sqrt(n);
  const ci95Lower = avgRMultiple - 1.96 * se;
  const ci95Upper = avgRMultiple + 1.96 * se;
  
  // Time stability (split trades chronologically)
  const midpoint = Math.floor(n / 2);
  const firstHalf = rMultiples.slice(0, midpoint);
  const secondHalf = rMultiples.slice(midpoint);
  const firstHalfAvgR = mean(firstHalf);
  const secondHalfAvgR = mean(secondHalf);
  
  // Stability score: penalize large drift between halves
  const drift = Math.abs(firstHalfAvgR - secondHalfAvgR);
  const stabilityScore = Math.max(0, 100 - drift * 50);
  
  // Reliability score: composite of sample size and CI width
  const ciWidth = ci95Upper - ci95Lower;
  const sampleSizeScore = Math.min(100, (n / SAMPLE_SIZE_THRESHOLDS.EXCELLENT) * 100);
  const ciScore = Math.max(0, 100 - ciWidth * 25);
  const reliabilityScore = (sampleSizeScore * 0.6 + ciScore * 0.4);
  
  return {
    bucketKey,
    patternId,
    regimeKey,
    n,
    winRate,
    avgRMultiple,
    medianRMultiple,
    payoffRatio,
    stdDevRMultiple,
    skewness,
    r5thPercentile: r5th,
    r95thPercentile: r95th,
    maxDrawdownContribution: maxDD,
    avgMAE,
    avgMFE,
    confidenceInterval95: { lower: ci95Lower, upper: ci95Upper },
    standardError: se,
    reliabilityScore,
    firstHalfAvgR,
    secondHalfAvgR,
    stabilityScore,
  };
}

function createEmptyBucketStats(bucketKey: string, patternId: string, regimeKey: string): BucketStats {
  return {
    bucketKey,
    patternId,
    regimeKey,
    n: 0,
    winRate: 0,
    avgRMultiple: 0,
    medianRMultiple: 0,
    payoffRatio: 0,
    stdDevRMultiple: 0,
    skewness: 0,
    r5thPercentile: 0,
    r95thPercentile: 0,
    maxDrawdownContribution: 0,
    avgMAE: 0,
    avgMFE: 0,
    confidenceInterval95: { lower: 0, upper: 0 },
    standardError: 0,
    reliabilityScore: 0,
    firstHalfAvgR: 0,
    secondHalfAvgR: 0,
    stabilityScore: 0,
  };
}

// ============================================
// PATTERN STRENGTH SCORE COMPUTATION
// ============================================

/**
 * Compute Pattern Strength Score
 * 
 * Formula (weighted components):
 * - Edge (40%): Risk-adjusted return quality
 * - Reliability (30%): Sample size + confidence interval
 * - Stability (20%): Consistency over time
 * - Risk (10%): Tail risk and MAE
 */
export function computePatternStrengthScore(
  trades: TradeLedgerEntry[],
  patternId: string,
  patternName: string
): PatternStrengthScore {
  const n = trades.length;
  const now = new Date().toISOString();
  
  // Insufficient data case
  if (n < SAMPLE_SIZE_THRESHOLDS.MINIMUM) {
    return createInsufficientDataScore(patternId, patternName, n, now);
  }
  
  // Compute baseline stats
  const baseline = computeBucketStats(trades, `${patternId}_BASELINE`, patternId, 'BASELINE');
  
  // Group trades by regime
  const regimeGroups = groupByRegime(trades);
  const regimeBuckets: Record<string, BucketStats> = {};
  const regimeScores: PatternStrengthScore['regimeScores'] = {};
  
  for (const [regimeKey, regimeTrades] of Object.entries(regimeGroups)) {
    const bucketKey = `${patternId}_${regimeKey}`;
    const stats = computeBucketStats(regimeTrades, bucketKey, patternId, regimeKey);
    regimeBuckets[regimeKey] = stats;
    
    const score = computeScoreFromStats(stats);
    regimeScores[regimeKey] = {
      score,
      grade: scoreToGrade(score, stats.n),
      n: stats.n,
      isReliable: stats.n >= SAMPLE_SIZE_THRESHOLDS.LOW,
    };
  }
  
  // Compute component scores
  const components = computeScoreComponents(trades, baseline);
  
  // Weighted combination
  const overallScore = Math.round(
    components.edgeScore * 0.40 +
    components.reliabilityScore * 0.30 +
    components.stabilityScore * 0.20 +
    components.riskScore * 0.10
  );
  
  // Find optimal regime
  const reliableRegimes = Object.entries(regimeScores)
    .filter(([_, r]) => r.isReliable)
    .sort((a, b) => b[1].score - a[1].score);
  
  const optimalRegime = reliableRegimes.length > 0 ? {
    regimeKey: reliableRegimes[0][0],
    score: reliableRegimes[0][1].score,
    description: formatRegimeDescription(reliableRegimes[0][0]),
  } : undefined;
  
  // Generate warnings
  const warnings = generateScoreWarnings(trades, baseline, components);
  
  // Date range
  const dates = trades.map(t => new Date(t.entryTime).getTime());
  const fromDate = new Date(Math.min(...dates)).toISOString();
  const toDate = new Date(Math.max(...dates)).toISOString();
  
  return {
    patternId,
    patternName,
    overallScore,
    grade: scoreToGrade(overallScore, n),
    components,
    regimeScores,
    optimalRegime,
    warnings,
    computedAt: now,
    dataRange: { from: fromDate, to: toDate },
    totalTrades: n,
  };
}

function computeScoreComponents(
  trades: TradeLedgerEntry[],
  baseline: BucketStats
): StrengthScoreComponents {
  const n = trades.length;
  
  // Edge Score (0-100)
  // Based on: avg R-multiple, win rate, payoff ratio
  const avgR = baseline.avgRMultiple;
  const winRate = baseline.winRate;
  const payoff = baseline.payoffRatio;
  
  // Expectancy in R: winRate * avgWin - (1-winRate) * avgLoss
  // Simplified: avgR captures this already
  // Score: 0R = 0 points, 0.5R = 70 points, 1R+ = 90+ points
  const edgeFromR = Math.min(100, Math.max(0, avgR * 80 + 50));
  const edgeFromWinRate = winRate * 100;
  const edgeFromPayoff = Math.min(100, payoff * 30);
  const edgeScore = Math.round(edgeFromR * 0.5 + edgeFromWinRate * 0.3 + edgeFromPayoff * 0.2);
  
  // Reliability Score (0-100)
  const sampleScore = Math.min(100, (n / SAMPLE_SIZE_THRESHOLDS.EXCELLENT) * 100);
  const seScore = Math.max(0, 100 - baseline.standardError * 100);
  const ciWidth = baseline.confidenceInterval95.upper - baseline.confidenceInterval95.lower;
  const ciScore = Math.max(0, 100 - ciWidth * 20);
  const reliabilityScore = Math.round(sampleScore * 0.5 + seScore * 0.25 + ciScore * 0.25);
  
  // Stability Score (0-100)
  const stabilityScore = Math.round(baseline.stabilityScore);
  
  // Risk Score (0-100) - higher is BETTER (lower risk)
  // Based on MAE and tail risk
  const avgMAE = Math.abs(baseline.avgMAE);
  const tail5 = Math.abs(baseline.r5thPercentile);
  // Lower MAE = higher score
  const maeScore = Math.max(0, 100 - avgMAE * 50);
  const tailScore = Math.max(0, 100 - tail5 * 25);
  const riskScore = Math.round(maeScore * 0.6 + tailScore * 0.4);
  
  return {
    edgeScore,
    edgeRaw: {
      avgRMultiple: avgR,
      winRate,
      payoffRatio: payoff,
    },
    reliabilityScore,
    reliabilityRaw: {
      sampleSize: n,
      standardError: baseline.standardError,
      ciWidth,
    },
    stabilityScore,
    stabilityRaw: {
      firstHalfAvgR: baseline.firstHalfAvgR,
      secondHalfAvgR: baseline.secondHalfAvgR,
      timeSplitCorrelation: 1 - Math.abs(baseline.firstHalfAvgR - baseline.secondHalfAvgR),
    },
    riskScore,
    riskRaw: {
      maxMAE: baseline.maxDrawdownContribution,
      tail5thPercentile: baseline.r5thPercentile,
      avgMAE: baseline.avgMAE,
    },
  };
}

function computeScoreFromStats(stats: BucketStats): number {
  if (stats.n < SAMPLE_SIZE_THRESHOLDS.MINIMUM) return 0;
  
  // Simplified score for regime buckets
  const edgeScore = Math.min(100, Math.max(0, stats.avgRMultiple * 80 + 50));
  const reliabilityScore = stats.reliabilityScore;
  const stabilityScore = stats.stabilityScore;
  
  return Math.round(edgeScore * 0.5 + reliabilityScore * 0.3 + stabilityScore * 0.2);
}

function generateScoreWarnings(
  trades: TradeLedgerEntry[],
  baseline: BucketStats,
  components: StrengthScoreComponents
): string[] {
  const warnings: string[] = [];
  const n = trades.length;
  
  if (n < SAMPLE_SIZE_THRESHOLDS.LOW) {
    warnings.push(`Low sample size (${n} trades) - results may not be statistically significant`);
  }
  
  if (components.stabilityScore < 40) {
    warnings.push('Performance shows significant drift over time - possible overfitting');
  }
  
  if (baseline.avgRMultiple < 0) {
    warnings.push('Negative average R-multiple - pattern shows no edge historically');
  }
  
  const ciWidth = baseline.confidenceInterval95.upper - baseline.confidenceInterval95.lower;
  if (ciWidth > 1.0) {
    warnings.push(`Wide confidence interval (±${(ciWidth/2).toFixed(2)}R) - high uncertainty`);
  }
  
  if (Math.abs(baseline.r5thPercentile) > 3) {
    warnings.push('Extreme tail risk: 5th percentile exceeds -3R');
  }
  
  return warnings;
}

function createInsufficientDataScore(
  patternId: string,
  patternName: string,
  n: number,
  now: string
): PatternStrengthScore {
  return {
    patternId,
    patternName,
    overallScore: 0,
    grade: 'INSUFFICIENT',
    components: {
      edgeScore: 0,
      edgeRaw: { avgRMultiple: 0, winRate: 0, payoffRatio: 0 },
      reliabilityScore: 0,
      reliabilityRaw: { sampleSize: n, standardError: 0, ciWidth: 0 },
      stabilityScore: 0,
      stabilityRaw: { firstHalfAvgR: 0, secondHalfAvgR: 0, timeSplitCorrelation: 0 },
      riskScore: 0,
      riskRaw: { maxMAE: 0, tail5thPercentile: 0, avgMAE: 0 },
    },
    regimeScores: {},
    warnings: [`Insufficient data: ${n} trades (minimum ${SAMPLE_SIZE_THRESHOLDS.MINIMUM} required)`],
    computedAt: now,
    dataRange: { from: now, to: now },
    totalTrades: n,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function groupByRegime(trades: TradeLedgerEntry[]): Record<string, TradeLedgerEntry[]> {
  const groups: Record<string, TradeLedgerEntry[]> = {};
  for (const trade of trades) {
    const key = trade.regimeAtEntry.key;
    if (!groups[key]) groups[key] = [];
    groups[key].push(trade);
  }
  return groups;
}

function formatRegimeDescription(regimeKey: string): string {
  const [trend, vol] = regimeKey.split('_');
  const trendDesc = { UP: 'uptrend', DOWN: 'downtrend', FLAT: 'range-bound' }[trend] || trend;
  const volDesc = { LOW: 'low volatility', MED: 'moderate volatility', HIGH: 'high volatility' }[vol] || vol;
  return `${trendDesc.charAt(0).toUpperCase() + trendDesc.slice(1)}, ${volDesc}`;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.floor(p * (sortedValues.length - 1));
  return sortedValues[idx];
}

function computeSkewness(values: number[]): number {
  if (values.length < 3) return 0;
  const m = mean(values);
  const std = standardDeviation(values);
  if (std === 0) return 0;
  
  const n = values.length;
  const sum = values.reduce((acc, v) => acc + Math.pow((v - m) / std, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}
