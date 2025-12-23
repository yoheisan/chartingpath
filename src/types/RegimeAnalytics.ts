/**
 * Regime-Conditioned Analytics Type System
 * 
 * Research-grade infrastructure for pattern strength scoring
 * with statistical reliability guarantees.
 * 
 * Key Design Principles:
 * - Deterministic: No ML inference in core path
 * - Bar-close only: All signals computed on closed bars
 * - Explainable: Every score component is auditable
 * - Trust-preserving: Explicit uncertainty quantification
 */

import { z } from 'zod';

// ============================================
// REGIME DEFINITIONS
// ============================================

/**
 * Valid timeframes for regime computation
 * Must match playbook timeframe for single-TF consistency
 */
export const VALID_TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W'] as const;
export type ValidTimeframe = typeof VALID_TIMEFRAMES[number];

/**
 * Trend Regime: Determined by price vs moving average
 * - UP: Price > MA by threshold
 * - DOWN: Price < MA by threshold  
 * - FLAT: Price within neutral band
 */
export const TrendRegime = z.enum(['UP', 'DOWN', 'FLAT']);
export type TrendRegime = z.infer<typeof TrendRegime>;

/**
 * Volatility Regime: Determined by ATR percentile
 * - LOW: ATR below 33rd percentile of lookback
 * - MED: ATR between 33rd-67th percentile
 * - HIGH: ATR above 67th percentile
 */
export const VolatilityRegime = z.enum(['LOW', 'MED', 'HIGH']);
export type VolatilityRegime = z.infer<typeof VolatilityRegime>;

/**
 * Combined regime label for a single bar
 */
export const RegimeLabel = z.object({
  trend: TrendRegime,
  volatility: VolatilityRegime,
  // Combined key for aggregation: "UP_HIGH", "DOWN_LOW", etc.
  key: z.string(),
});
export type RegimeLabel = z.infer<typeof RegimeLabel>;

/**
 * Configuration for regime computation
 * All parameters are explicit and versioned
 */
export const RegimeConfig = z.object({
  version: z.literal(1),
  
  // Trend parameters
  trend: z.object({
    indicator: z.enum(['SMA', 'EMA']),
    period: z.number().int().min(5).max(500), // e.g., 50, 200
    thresholdPercent: z.number().min(0).max(10), // e.g., 0.5% neutral band
  }),
  
  // Volatility parameters
  volatility: z.object({
    atrPeriod: z.number().int().min(5).max(100), // e.g., 14
    lookbackBars: z.number().int().min(50).max(1000), // for percentile calc
  }),
});
export type RegimeConfig = z.infer<typeof RegimeConfig>;

/**
 * Default regime configuration (conservative, research-tested)
 */
export const DEFAULT_REGIME_CONFIG: RegimeConfig = {
  version: 1,
  trend: {
    indicator: 'EMA',
    period: 50,
    thresholdPercent: 0.5,
  },
  volatility: {
    atrPeriod: 14,
    lookbackBars: 100,
  },
};

// ============================================
// TRADE LEDGER (Canonical Trade Record)
// ============================================

/**
 * Single trade record with full attribution
 * This is the data foundation for all analytics
 */
export const TradeLedgerEntry = z.object({
  // Identity
  id: z.string().uuid(),
  runId: z.string().uuid(), // backtest run reference
  strategyId: z.string().uuid().optional(),
  
  // Instrument
  symbol: z.string(),
  timeframe: z.enum(VALID_TIMEFRAMES),
  
  // Pattern
  patternId: z.string(), // e.g., "double-bottom", "head-shoulders"
  patternName: z.string(),
  patternDirection: z.enum(['long', 'short']),
  
  // Timing (ISO strings for serialization)
  entryTime: z.string().datetime(),
  exitTime: z.string().datetime(),
  entryBarIndex: z.number().int().min(0),
  exitBarIndex: z.number().int().min(0),
  holdingBars: z.number().int().min(1),
  
  // Prices
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  stopLossPrice: z.number().positive(),
  takeProfitPrice: z.number().positive(),
  
  // R-Multiple Metrics (core edge measurement)
  riskAmount: z.number().positive(), // |entry - stop|
  rewardPotential: z.number().positive(), // |target - entry|
  plannedRR: z.number().positive(), // reward / risk
  actualRMultiple: z.number(), // actual P&L / risk (can be negative)
  
  // Excursion Metrics
  mfe: z.number(), // Max Favorable Excursion (highest unrealized profit)
  mae: z.number(), // Max Adverse Excursion (deepest unrealized loss)
  mfeRMultiple: z.number(), // MFE as R-multiple
  maeRMultiple: z.number(), // MAE as R-multiple
  
  // Outcome
  exitReason: z.enum(['target', 'stop-loss', 'timeout', 'manual']),
  pnlPercent: z.number(),
  pnlAbsolute: z.number(),
  isWin: z.boolean(),
  
  // Regime at Entry (critical for conditioning)
  regimeAtEntry: RegimeLabel,
  
  // Discipline Filter Outcome
  disciplineValidation: z.object({
    passed: z.boolean(),
    filtersApplied: z.array(z.string()),
    rejectionReasons: z.array(z.string()),
  }),
  
  // Metadata
  createdAt: z.string().datetime(),
});
export type TradeLedgerEntry = z.infer<typeof TradeLedgerEntry>;

// ============================================
// CONDITIONED STATISTICS
// ============================================

/**
 * Statistical summary for a bucket (pattern × regime)
 */
export const BucketStats = z.object({
  // Identification
  bucketKey: z.string(), // e.g., "double-bottom_UP_HIGH"
  patternId: z.string(),
  regimeKey: z.string(), // e.g., "UP_HIGH"
  
  // Sample Size (critical for reliability)
  n: z.number().int().min(0),
  
  // Core Edge Metrics
  winRate: z.number().min(0).max(1),
  avgRMultiple: z.number(), // expectancy in R terms
  medianRMultiple: z.number(),
  payoffRatio: z.number(), // avgWin / avgLoss
  
  // Distribution
  stdDevRMultiple: z.number(),
  skewness: z.number(),
  r5thPercentile: z.number(), // 5th percentile (tail risk)
  r95thPercentile: z.number(), // 95th percentile
  
  // Risk Contribution
  maxDrawdownContribution: z.number(), // worst trade's DD contribution
  avgMAE: z.number(),
  avgMFE: z.number(),
  
  // Reliability Metrics
  confidenceInterval95: z.object({
    lower: z.number(),
    upper: z.number(),
  }),
  standardError: z.number(),
  reliabilityScore: z.number().min(0).max(100), // composite reliability
  
  // Time Stability (for overfitting detection)
  firstHalfAvgR: z.number(),
  secondHalfAvgR: z.number(),
  stabilityScore: z.number().min(0).max(100), // consistency over time
});
export type BucketStats = z.infer<typeof BucketStats>;

/**
 * Complete analytics output for a pattern
 */
export const PatternAnalytics = z.object({
  patternId: z.string(),
  patternName: z.string(),
  
  // Baseline (unconditioned)
  baseline: BucketStats,
  
  // Regime-conditioned buckets
  regimeBuckets: z.record(z.string(), BucketStats),
  
  // Comparative metrics
  bestRegime: z.object({
    regimeKey: z.string(),
    lift: z.number(), // % improvement over baseline
    n: z.number(),
  }),
  worstRegime: z.object({
    regimeKey: z.string(),
    lift: z.number(), // % degradation vs baseline
    n: z.number(),
  }),
});
export type PatternAnalytics = z.infer<typeof PatternAnalytics>;

// ============================================
// PATTERN STRENGTH SCORE
// ============================================

/**
 * Minimum sample requirements for statistical validity
 */
export const SAMPLE_SIZE_THRESHOLDS = {
  MINIMUM: 20, // Below this: hide or heavily dim
  LOW: 50, // Show with warning
  MODERATE: 100, // Acceptable for preliminary analysis
  HIGH: 250, // Statistically robust
  EXCELLENT: 500, // High confidence
} as const;

/**
 * Pattern Strength Score Components
 * Each component is 0-100, combined into final score
 */
export const StrengthScoreComponents = z.object({
  // Edge Component (40% weight)
  // Based on risk-adjusted returns (Sharpe-like)
  edgeScore: z.number().min(0).max(100),
  edgeRaw: z.object({
    avgRMultiple: z.number(),
    winRate: z.number(),
    payoffRatio: z.number(),
  }),
  
  // Reliability Component (30% weight)
  // Based on sample size and confidence intervals
  reliabilityScore: z.number().min(0).max(100),
  reliabilityRaw: z.object({
    sampleSize: z.number(),
    standardError: z.number(),
    ciWidth: z.number(),
  }),
  
  // Stability Component (20% weight)
  // Based on time-split consistency
  stabilityScore: z.number().min(0).max(100),
  stabilityRaw: z.object({
    firstHalfAvgR: z.number(),
    secondHalfAvgR: z.number(),
    timeSplitCorrelation: z.number(),
  }),
  
  // Risk Component (10% weight)
  // Based on tail risk and drawdown
  riskScore: z.number().min(0).max(100),
  riskRaw: z.object({
    maxMAE: z.number(),
    tail5thPercentile: z.number(),
    avgMAE: z.number(),
  }),
});
export type StrengthScoreComponents = z.infer<typeof StrengthScoreComponents>;

/**
 * Complete Pattern Strength Score
 */
export const PatternStrengthScore = z.object({
  patternId: z.string(),
  patternName: z.string(),
  
  // Overall Score (0-100)
  overallScore: z.number().min(0).max(100),
  grade: z.enum(['A', 'B', 'C', 'D', 'F', 'INSUFFICIENT']),
  
  // Component breakdown
  components: StrengthScoreComponents,
  
  // Regime-specific scores
  regimeScores: z.record(z.string(), z.object({
    score: z.number().min(0).max(100),
    grade: z.enum(['A', 'B', 'C', 'D', 'F', 'INSUFFICIENT']),
    n: z.number(),
    isReliable: z.boolean(),
  })),
  
  // Best conditions
  optimalRegime: z.object({
    regimeKey: z.string(),
    score: z.number(),
    description: z.string(), // e.g., "Strong uptrend, low volatility"
  }).optional(),
  
  // Warnings
  warnings: z.array(z.string()),
  
  // Metadata
  computedAt: z.string().datetime(),
  dataRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  totalTrades: z.number().int(),
});
export type PatternStrengthScore = z.infer<typeof PatternStrengthScore>;

// ============================================
// DASHBOARD STATE
// ============================================

/**
 * Dashboard filter state
 */
export const DashboardFilters = z.object({
  symbols: z.array(z.string()),
  timeframes: z.array(z.enum(VALID_TIMEFRAMES)),
  patterns: z.array(z.string()),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  regimeFilter: z.object({
    trends: z.array(TrendRegime),
    volatilities: z.array(VolatilityRegime),
  }),
  minSampleSize: z.number().int().min(0),
});
export type DashboardFilters = z.infer<typeof DashboardFilters>;

/**
 * Heatmap cell data
 */
export const HeatmapCell = z.object({
  regimeKey: z.string(),
  trendLabel: TrendRegime,
  volatilityLabel: VolatilityRegime,
  value: z.number(), // the metric being displayed
  n: z.number(),
  isReliable: z.boolean(),
  tooltip: z.string(),
});
export type HeatmapCell = z.infer<typeof HeatmapCell>;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create regime key from components
 */
export function createRegimeKey(trend: TrendRegime, volatility: VolatilityRegime): string {
  return `${trend}_${volatility}`;
}

/**
 * Parse regime key back to components
 */
export function parseRegimeKey(key: string): { trend: TrendRegime; volatility: VolatilityRegime } {
  const [trend, volatility] = key.split('_') as [TrendRegime, VolatilityRegime];
  return { trend, volatility };
}

/**
 * Human-readable regime description
 */
export function describeRegime(trend: TrendRegime, volatility: VolatilityRegime): string {
  const trendDesc = {
    UP: 'Uptrend',
    DOWN: 'Downtrend', 
    FLAT: 'Range-bound',
  }[trend];
  
  const volDesc = {
    LOW: 'low volatility',
    MED: 'moderate volatility',
    HIGH: 'high volatility',
  }[volatility];
  
  return `${trendDesc}, ${volDesc}`;
}

/**
 * Convert score to letter grade
 */
export function scoreToGrade(score: number, n: number): PatternStrengthScore['grade'] {
  if (n < SAMPLE_SIZE_THRESHOLDS.MINIMUM) return 'INSUFFICIENT';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

/**
 * Get reliability tier from sample size
 */
export function getSampleSizeTier(n: number): 'insufficient' | 'low' | 'moderate' | 'high' | 'excellent' {
  if (n < SAMPLE_SIZE_THRESHOLDS.MINIMUM) return 'insufficient';
  if (n < SAMPLE_SIZE_THRESHOLDS.LOW) return 'low';
  if (n < SAMPLE_SIZE_THRESHOLDS.MODERATE) return 'moderate';
  if (n < SAMPLE_SIZE_THRESHOLDS.HIGH) return 'high';
  return 'excellent';
}

/**
 * Calculate reliability warning messages
 */
export function getReliabilityWarnings(stats: BucketStats): string[] {
  const warnings: string[] = [];
  
  if (stats.n < SAMPLE_SIZE_THRESHOLDS.MINIMUM) {
    warnings.push(`Insufficient data: ${stats.n} trades (minimum ${SAMPLE_SIZE_THRESHOLDS.MINIMUM} required)`);
  } else if (stats.n < SAMPLE_SIZE_THRESHOLDS.LOW) {
    warnings.push(`Low sample size: ${stats.n} trades - interpret with caution`);
  }
  
  // Wide confidence interval warning
  const ciWidth = stats.confidenceInterval95.upper - stats.confidenceInterval95.lower;
  if (ciWidth > 1.0) { // > 1R uncertainty
    warnings.push(`High uncertainty: 95% CI spans ${ciWidth.toFixed(2)}R`);
  }
  
  // Time stability warning
  if (stats.stabilityScore < 40) {
    warnings.push('Unstable performance: significant drift between time periods');
  }
  
  return warnings;
}
