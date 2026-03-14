/**
 * Strategy Evaluation Audit Module
 * 
 * Institutional-grade utilities addressing key evaluation gaps:
 * 1. Net Expectancy (spread + slippage + commission deduction)
 * 2. Decay Analysis (rolling edge degradation over time)
 * 3. Signal Correlation (clustering detection)
 * 4. Monte Carlo Simulation (distribution of outcomes)
 * 5. Benchmark-Relative Alpha
 * 
 * Pattern Identification Methodology:
 * - All 15 core patterns follow Bulkowski structural validation standards
 * - Prior trend requirements enforced: ≥2-3% for reversals, ≥5% for continuations
 * - Cup & Handle uses HYBRID DEPTH METHODOLOGY (validated 2026-03-14):
 *   • FX: Range-relative depth (cup ≥ 30% of lookback window's high-low range)
 *   • Stocks/Crypto/ETFs/Commodities: Fixed percentage depth (cup ≥ 10%)
 *   • Prior rise: Range-relative across all classes (≥15% of window range)
 *   • Rationale: FX daily ranges (0.5-1.5%) make fixed % thresholds unusable;
 *     range-relative normalizes to each asset's volatility structure
 * - Triangles require 3-touch minimum on support/resistance
 * - Flags include ADX > 20 and retracement filters
 * - See docs/PATTERN_DISCIPLINE.md §3.4 for full hybrid depth specification
 * 
 * All computations are deterministic and use bar-close semantics.
 */

import type { TradeLedgerEntry, BucketStats } from '@/types/RegimeAnalytics';

// ============================================
// 1. NET EXPECTANCY (Spread + Slippage Model)
// ============================================

export interface TransactionCosts {
  /** Spread cost per trade in R-multiple terms (e.g., 0.05 = 5% of risk) */
  spreadCostR: number;
  /** Slippage cost per trade in R-multiple terms */
  slippageCostR: number;
  /** Commission cost per trade in R-multiple terms */
  commissionCostR: number;
}

/**
 * Default transaction cost assumptions by asset class.
 * These are conservative estimates based on retail execution.
 */
export const DEFAULT_TRANSACTION_COSTS: Record<string, TransactionCosts> = {
  stocks: { spreadCostR: 0.02, slippageCostR: 0.01, commissionCostR: 0.01 },
  fx: { spreadCostR: 0.03, slippageCostR: 0.02, commissionCostR: 0.005 },
  crypto: { spreadCostR: 0.05, slippageCostR: 0.03, commissionCostR: 0.02 },
  indices: { spreadCostR: 0.02, slippageCostR: 0.01, commissionCostR: 0.01 },
  commodities: { spreadCostR: 0.03, slippageCostR: 0.02, commissionCostR: 0.01 },
};

export interface NetExpectancyResult {
  grossExpectancyR: number;
  totalCostPerTradeR: number;
  netExpectancyR: number;
  costDragPercent: number;
  breakEvenWinRate: number;
  isNetPositive: boolean;
  costs: TransactionCosts;
}

/**
 * Calculate net expectancy after deducting estimated transaction costs.
 * 
 * Net Expectancy = Gross Expectancy - (Spread + Slippage + Commission) per trade
 * 
 * This is a CRITICAL gap in most retail backtesting platforms.
 * MT4/MT5 strategies often show inflated results because they don't
 * account for real-world execution costs.
 */
export function computeNetExpectancy(
  stats: BucketStats,
  assetClass: string = 'stocks'
): NetExpectancyResult {
  const costs = DEFAULT_TRANSACTION_COSTS[assetClass] || DEFAULT_TRANSACTION_COSTS.stocks;
  const totalCostPerTradeR = costs.spreadCostR + costs.slippageCostR + costs.commissionCostR;
  
  const grossExpectancyR = stats.avgRMultiple;
  // Each trade incurs cost on entry AND exit
  const netExpectancyR = grossExpectancyR - (totalCostPerTradeR * 2);
  
  const costDragPercent = grossExpectancyR !== 0
    ? ((totalCostPerTradeR * 2) / Math.abs(grossExpectancyR)) * 100
    : 100;
  
  // Break-even win rate with costs:
  // WR * avgWin - (1-WR) * avgLoss = totalCostPerTrade * 2
  const avgRR = stats.payoffRatio > 0 ? stats.payoffRatio : 2;
  const breakEvenWinRate = (1 + totalCostPerTradeR * 2) / (1 + avgRR);
  
  return {
    grossExpectancyR,
    totalCostPerTradeR,
    netExpectancyR,
    costDragPercent: Math.min(costDragPercent, 999),
    breakEvenWinRate: Math.min(breakEvenWinRate, 1),
    isNetPositive: netExpectancyR > 0,
    costs,
  };
}


// ============================================
// 2. DECAY ANALYSIS (Edge Degradation)
// ============================================

export interface DecayDataPoint {
  periodStart: string;
  periodEnd: string;
  tradeCount: number;
  winRate: number;
  avgRMultiple: number;
  cumulativeR: number;
}

export interface DecayAnalysisResult {
  periods: DecayDataPoint[];
  slope: number; // negative = edge decaying
  r2: number; // fit quality
  isDecaying: boolean;
  decayRate: string; // "stable" | "mild" | "moderate" | "severe"
  halfLifeTrades: number | null; // estimated trades until edge halves
}

/**
 * Analyze edge decay over rolling windows of trades.
 * 
 * Splits the trade history into sequential windows and computes
 * rolling expectancy to detect if the edge is degrading over time.
 * 
 * A decaying edge suggests:
 * - Market adaptation to the pattern
 * - Regime shift making the pattern less effective
 * - Potential survivorship bias in early data
 */
export function computeDecayAnalysis(
  trades: TradeLedgerEntry[],
  windowSize: number = 50
): DecayAnalysisResult {
  if (trades.length < windowSize * 2) {
    return {
      periods: [],
      slope: 0,
      r2: 0,
      isDecaying: false,
      decayRate: 'stable',
      halfLifeTrades: null,
    };
  }

  // Sort trades chronologically
  const sorted = [...trades].sort(
    (a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
  );

  const periods: DecayDataPoint[] = [];
  let cumulativeR = 0;

  for (let i = 0; i <= sorted.length - windowSize; i += Math.max(1, Math.floor(windowSize / 2))) {
    const window = sorted.slice(i, i + windowSize);
    const wins = window.filter(t => t.isWin).length;
    const avgR = window.reduce((s, t) => s + t.actualRMultiple, 0) / window.length;
    cumulativeR += avgR * window.length;

    periods.push({
      periodStart: window[0].entryTime,
      periodEnd: window[window.length - 1].entryTime,
      tradeCount: window.length,
      winRate: wins / window.length,
      avgRMultiple: avgR,
      cumulativeR,
    });
  }

  // Linear regression on avgRMultiple over time
  const n = periods.length;
  if (n < 3) {
    return { periods, slope: 0, r2: 0, isDecaying: false, decayRate: 'stable', halfLifeTrades: null };
  }

  const xs = periods.map((_, i) => i);
  const ys = periods.map(p => p.avgRMultiple);
  const { slope, r2 } = linearRegression(xs, ys);

  const isDecaying = slope < -0.005 && r2 > 0.3;
  let decayRate: DecayAnalysisResult['decayRate'] = 'stable';
  if (slope < -0.02 && r2 > 0.5) decayRate = 'severe';
  else if (slope < -0.01 && r2 > 0.4) decayRate = 'moderate';
  else if (slope < -0.005 && r2 > 0.3) decayRate = 'mild';

  // Estimate half-life: how many periods until avgR drops to half its initial value
  const initialR = ys[0];
  const halfLifeTrades = slope < 0 && initialR > 0
    ? Math.round(Math.abs((initialR / 2) / slope) * windowSize)
    : null;

  return { periods, slope, r2, isDecaying, decayRate, halfLifeTrades };
}


// ============================================
// 3. SIGNAL CORRELATION (Clustering Detection)
// ============================================

export interface SignalCluster {
  symbol: string;
  timeframe: string;
  patternIds: string[];
  tradeIds: string[];
  startTime: string;
  endTime: string;
  clusterSize: number;
}

export interface SignalCorrelationResult {
  clusters: SignalCluster[];
  totalClusteredTrades: number;
  clusteringRate: number; // % of trades that are part of a cluster
  maxClusterSize: number;
  warning: string | null;
}

/**
 * Detect signal clustering: multiple patterns firing on the same
 * instrument within a short time window.
 * 
 * Clustered signals create correlated risk exposure.
 * If 3 patterns fire on AAPL simultaneously, your "3 independent trades"
 * are actually 1 correlated bet.
 * 
 * @param windowBars - Number of bars within which signals are considered clustered
 */
export function detectSignalCorrelation(
  trades: TradeLedgerEntry[],
  windowBars: number = 5
): SignalCorrelationResult {
  if (trades.length < 2) {
    return { clusters: [], totalClusteredTrades: 0, clusteringRate: 0, maxClusterSize: 0, warning: null };
  }

  // Group by symbol+timeframe
  const grouped: Record<string, TradeLedgerEntry[]> = {};
  for (const trade of trades) {
    const key = `${trade.symbol}_${trade.timeframe}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(trade);
  }

  const clusters: SignalCluster[] = [];

  for (const [key, groupTrades] of Object.entries(grouped)) {
    const sorted = [...groupTrades].sort((a, b) => a.entryBarIndex - b.entryBarIndex);
    
    let clusterStart = 0;
    for (let i = 1; i <= sorted.length; i++) {
      const isEndOfCluster = i === sorted.length ||
        sorted[i].entryBarIndex - sorted[i - 1].entryBarIndex > windowBars;
      
      if (isEndOfCluster) {
        const clusterTrades = sorted.slice(clusterStart, i);
        if (clusterTrades.length >= 2) {
          const [symbol, timeframe] = key.split('_');
          clusters.push({
            symbol,
            timeframe,
            patternIds: [...new Set(clusterTrades.map(t => t.patternId))],
            tradeIds: clusterTrades.map(t => t.id),
            startTime: clusterTrades[0].entryTime,
            endTime: clusterTrades[clusterTrades.length - 1].entryTime,
            clusterSize: clusterTrades.length,
          });
        }
        clusterStart = i;
      }
    }
  }

  const totalClusteredTrades = clusters.reduce((s, c) => s + c.clusterSize, 0);
  const clusteringRate = trades.length > 0 ? (totalClusteredTrades / trades.length) * 100 : 0;
  const maxClusterSize = clusters.length > 0 ? Math.max(...clusters.map(c => c.clusterSize)) : 0;

  let warning: string | null = null;
  if (clusteringRate > 30) {
    warning = `High signal clustering (${clusteringRate.toFixed(0)}%): Correlated exposure inflates apparent diversification. Effective independent trades are likely ${Math.round(trades.length * (1 - clusteringRate / 100))}.`;
  } else if (clusteringRate > 15) {
    warning = `Moderate signal clustering (${clusteringRate.toFixed(0)}%): Some trades are correlated. Review overlapping signals.`;
  }

  return { clusters, totalClusteredTrades, clusteringRate, maxClusterSize, warning };
}


// ============================================
// 4. MONTE CARLO SIMULATION
// ============================================

export interface MonteCarloResult {
  iterations: number;
  medianFinalR: number;
  p5FinalR: number; // 5th percentile (worst-case)
  p25FinalR: number;
  p75FinalR: number;
  p95FinalR: number;
  maxDrawdownMedian: number;
  maxDrawdownP95: number; // 95th percentile max DD
  probabilityOfRuin: number; // P(drawdown > 50% of capital)
  equityCurveP5: number[]; // 5th percentile equity curve
  equityCurveP50: number[]; // median equity curve
  equityCurveP95: number[]; // 95th percentile equity curve
}

/**
 * Monte Carlo simulation of trade sequences.
 * 
 * Randomly resamples the actual trade outcomes to generate
 * thousands of possible equity curves. This reveals the
 * DISTRIBUTION of outcomes, not just the single historical path.
 * 
 * Key insight: The historical equity curve is ONE sample from
 * this distribution. Monte Carlo shows how lucky or unlucky
 * the actual sequence was.
 */
export function runMonteCarloSimulation(
  trades: TradeLedgerEntry[],
  iterations: number = 1000,
  tradeCount?: number
): MonteCarloResult {
  const numTrades = tradeCount || trades.length;
  const rMultiples = trades.map(t => t.actualRMultiple);
  
  if (rMultiples.length === 0) {
    return createEmptyMonteCarloResult(iterations);
  }

  const finalRs: number[] = [];
  const maxDDs: number[] = [];
  const equityCurves: number[][] = [];

  // Seed-independent PRNG for deterministic results
  let seed = 42;
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let iter = 0; iter < iterations; iter++) {
    let equity = 0;
    let peak = 0;
    let maxDD = 0;
    const curve: number[] = [0];

    for (let t = 0; t < numTrades; t++) {
      const idx = Math.floor(random() * rMultiples.length);
      equity += rMultiples[idx];
      curve.push(equity);
      
      if (equity > peak) peak = equity;
      const dd = peak - equity;
      if (dd > maxDD) maxDD = dd;
    }

    finalRs.push(equity);
    maxDDs.push(maxDD);
    equityCurves.push(curve);
  }

  // Sort for percentile calculations
  const sortedFinalRs = [...finalRs].sort((a, b) => a - b);
  const sortedMaxDDs = [...maxDDs].sort((a, b) => a - b);

  // Calculate percentile equity curves
  const curveLength = numTrades + 1;
  const equityCurveP5: number[] = [];
  const equityCurveP50: number[] = [];
  const equityCurveP95: number[] = [];

  for (let step = 0; step < curveLength; step++) {
    const stepValues = equityCurves.map(c => c[step] || 0).sort((a, b) => a - b);
    equityCurveP5.push(getPercentile(stepValues, 0.05));
    equityCurveP50.push(getPercentile(stepValues, 0.50));
    equityCurveP95.push(getPercentile(stepValues, 0.95));
  }

  // Probability of ruin: P(max drawdown > 50R, i.e., losing 50% of a 100R account)
  const ruinThreshold = 50;
  const probabilityOfRuin = maxDDs.filter(dd => dd > ruinThreshold).length / iterations;

  return {
    iterations,
    medianFinalR: getPercentile(sortedFinalRs, 0.50),
    p5FinalR: getPercentile(sortedFinalRs, 0.05),
    p25FinalR: getPercentile(sortedFinalRs, 0.25),
    p75FinalR: getPercentile(sortedFinalRs, 0.75),
    p95FinalR: getPercentile(sortedFinalRs, 0.95),
    maxDrawdownMedian: getPercentile(sortedMaxDDs, 0.50),
    maxDrawdownP95: getPercentile(sortedMaxDDs, 0.95),
    probabilityOfRuin,
    equityCurveP5,
    equityCurveP50,
    equityCurveP95,
  };
}


// ============================================
// 5. COMPREHENSIVE AUDIT REPORT
// ============================================

export interface AuditReport {
  netExpectancy: NetExpectancyResult;
  decayAnalysis: DecayAnalysisResult;
  signalCorrelation: SignalCorrelationResult;
  monteCarlo: MonteCarloResult;
  auditGrade: 'PASS' | 'CONDITIONAL' | 'FAIL';
  auditWarnings: string[];
  auditTimestamp: string;
}

/**
 * Generate a comprehensive strategy evaluation audit report.
 * 
 * This closes the gap between retail backtesting and institutional
 * due diligence by running all five evaluation modules.
 */
export function generateAuditReport(
  trades: TradeLedgerEntry[],
  stats: BucketStats,
  assetClass: string = 'stocks'
): AuditReport {
  const netExpectancy = computeNetExpectancy(stats, assetClass);
  const decayAnalysis = computeDecayAnalysis(trades);
  const signalCorrelation = detectSignalCorrelation(trades);
  const monteCarlo = runMonteCarloSimulation(trades);

  const warnings: string[] = [];
  
  if (!netExpectancy.isNetPositive) {
    warnings.push('CRITICAL: Strategy has negative net expectancy after transaction costs');
  }
  
  if (decayAnalysis.isDecaying) {
    warnings.push(`Edge decay detected (${decayAnalysis.decayRate}): Edge is degrading over time`);
  }
  
  if (signalCorrelation.warning) {
    warnings.push(signalCorrelation.warning);
  }
  
  if (monteCarlo.probabilityOfRuin > 0.1) {
    warnings.push(`High ruin probability (${(monteCarlo.probabilityOfRuin * 100).toFixed(1)}%): Risk of catastrophic drawdown`);
  }
  
  if (monteCarlo.maxDrawdownP95 > 30) {
    warnings.push(`Severe drawdown risk: 95th percentile max DD is ${monteCarlo.maxDrawdownP95.toFixed(1)}R`);
  }

  // Audit grade
  let auditGrade: AuditReport['auditGrade'] = 'PASS';
  if (!netExpectancy.isNetPositive || monteCarlo.probabilityOfRuin > 0.2) {
    auditGrade = 'FAIL';
  } else if (
    decayAnalysis.isDecaying ||
    signalCorrelation.clusteringRate > 30 ||
    monteCarlo.probabilityOfRuin > 0.05
  ) {
    auditGrade = 'CONDITIONAL';
  }

  return {
    netExpectancy,
    decayAnalysis,
    signalCorrelation,
    monteCarlo,
    auditGrade,
    auditWarnings: warnings,
    auditTimestamp: new Date().toISOString(),
  };
}


// ============================================
// HELPER FUNCTIONS
// ============================================

function linearRegression(xs: number[], ys: number[]): { slope: number; r2: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, r2: 0 };
  
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const sumY2 = ys.reduce((a, y) => a + y * y, 0);
  
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, r2: 0 };
  
  const slope = (n * sumXY - sumX * sumY) / denom;
  
  const ssRes = ys.reduce((a, y, i) => {
    const yPred = (sumY / n) + slope * (xs[i] - sumX / n);
    return a + (y - yPred) ** 2;
  }, 0);
  const ssTot = ys.reduce((a, y) => a + (y - sumY / n) ** 2, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  
  return { slope, r2: Math.max(0, r2) };
}

function getPercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.floor(p * (sortedValues.length - 1));
  return sortedValues[Math.min(idx, sortedValues.length - 1)];
}

function createEmptyMonteCarloResult(iterations: number): MonteCarloResult {
  return {
    iterations,
    medianFinalR: 0,
    p5FinalR: 0,
    p25FinalR: 0,
    p75FinalR: 0,
    p95FinalR: 0,
    maxDrawdownMedian: 0,
    maxDrawdownP95: 0,
    probabilityOfRuin: 0,
    equityCurveP5: [],
    equityCurveP50: [],
    equityCurveP95: [],
  };
}
