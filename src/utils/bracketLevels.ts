/**
 * Bracket Levels Calculator
 * 
 * SINGLE SOURCE OF TRUTH for computing Stop Loss and Take Profit levels at entry time.
 * 
 * ARCHITECTURE NOTE: Due to Deno bundling constraints, this file is duplicated:
 * - Edge functions: supabase/functions/_shared/bracketLevels.ts
 * - Frontend/Tests: src/utils/bracketLevels.ts (this file)
 * 
 * BOTH FILES MUST BE IDENTICAL (except for the header comment).
 * A sync test in tests/utils/computeBracketLevels.test.ts verifies they match.
 * 
 * Rounding contract (ROUNDING_CONFIG):
 * - Prices: 8 decimal places
 * - Distances: 8 decimal places  
 * - Risk/Reward Ratio: 4 decimal places
 * 
 * ATR-Based Minimum SL Floor (v1.1.0):
 * - Ensures SL is at least 1× ATR from entry to avoid stops clipped by noise/spread
 * - Minimum percent floor (0.3%) prevents micro-stops on low-volatility instruments
 * - Minimum R:R guard (1.5:1) scales TP when SL is widened to maintain viability
 * - References: Wilder (1978) ATR, Turtle Trading rules, Bulkowski pattern methodology
 */

/**
 * Asset-class specific minimum stop loss floors (% of entry price).
 * Prevents micro-stops that are inappropriate for each asset class's volatility profile.
 */
export const MIN_STOP_PERCENT: Record<string, number> = {
  forex:       0.5,   // ~50 pips on major pairs — appropriate for intraday
  crypto:      1.0,   // crypto volatility warrants wider floor
  stocks:      0.5,   // gaps make 0.3% too tight
  indices:     0.3,   // indices rarely gap — original value appropriate
  commodities: 0.6,   // commodity volatility varies widely
};

/**
 * Derives asset class from instrument symbol for bracket level computation.
 */
export function deriveAssetClass(instrument: string): string {
  if (/USDT?$|BTC|ETH|SOL|BNB|XRP/i.test(instrument)) return 'crypto';
  if (/=X$|USD|EUR|GBP|JPY|AUD|CAD|NZD|CHF/i.test(instrument)) return 'forex';
  if (/\^/.test(instrument)) return 'indices';
  if (/=F$/.test(instrument)) return 'commodities';
  return 'stocks';
}

export interface BracketLevelsInput {
  direction: 'long' | 'short';
  entryPrice: number;
  stopPercent: number;      // e.g., 1.5 for 1.5%
  targetPercent: number;    // e.g., 3.0 for 3.0%
  atr?: number;             // Optional: ATR value at entry
  atrMultiplier?: number;   // Optional: multiplier for ATR-based stops (default: 2.0)
  stopLossMethod?: 'percent' | 'atr' | 'fixed';
  takeProfitMethod?: 'percent' | 'ratio' | 'fixed';
  /** Minimum ATR multiple for SL floor (default: 1.0). Set to 0 to disable. */
  minAtrMultiplier?: number;
  /** Minimum R:R ratio — TP is scaled up if bracket falls below this (default: 1.5) */
  minRiskRewardRatio?: number;
  /** Minimum SL distance as % of entry price. If omitted, derived from instrument's asset class. */
  minStopPercent?: number;
  /** Instrument symbol — used to derive asset class for min stop floor when minStopPercent is not explicitly set. */
  instrument?: string;
}

export interface BracketLevelsOutput {
  stopLossPrice: number;
  takeProfitPrice: number;
  stopDistance: number;     // Absolute distance from entry to SL
  tpDistance: number;       // Absolute distance from entry to TP
  riskRewardRatio: number;  // TP distance / SL distance
  stopLossMethod: string;
  takeProfitMethod: string;
  /** True if SL was widened by the ATR/percent floor */
  slFloored?: boolean;
  /** True if TP was scaled up to meet minimum R:R */
  tpScaled?: boolean;
}

/**
 * Rounding configuration - single source of truth for precision
 * Must match supabase/functions/_shared/bracketLevels.ts
 */
export const ROUNDING_CONFIG = {
  priceDecimals: 8,
  distanceDecimals: 8,
  rrDecimals: 4
} as const;

/**
 * Version constant for sync verification between frontend and edge function implementations.
 * MUST match supabase/functions/_shared/bracketLevels.ts
 * Increment when making any changes to the computation logic.
 */
export const BRACKET_LEVELS_VERSION = '1.1.0';

/**
 * Computes bracket levels (SL/TP) at entry time.
 * This is the single source of truth for both backtesting and alerts.
 * 
 * v1.1.0 additions:
 * - ATR-based minimum SL floor (Wilder, 1978): SL must be ≥ minAtrMultiplier × ATR
 * - Minimum percent floor: SL must be ≥ minStopPercent% of entry price
 * - Minimum R:R guard: TP is scaled to maintain ≥ minRiskRewardRatio
 * 
 * @param input - Entry parameters including direction, price, and risk settings
 * @returns Computed bracket levels with prices and distances
 * @throws Error if entryPrice <= 0
 */
export function computeBracketLevels(input: BracketLevelsInput): BracketLevelsOutput {
  const { 
    direction, 
    entryPrice, 
    stopPercent, 
    targetPercent,
    atr,
    atrMultiplier = 2.0,
    stopLossMethod = 'percent',
    takeProfitMethod = 'percent',
    minAtrMultiplier = 1.0,
    minRiskRewardRatio = 1.5,
    minStopPercent = 0.3,
  } = input;

  // Validate critical inputs
  if (entryPrice <= 0) {
    throw new Error('entryPrice must be greater than 0');
  }

  let stopLossPrice: number;
  let takeProfitPrice: number;
  let actualStopMethod: string = stopLossMethod;
  let actualTpMethod: string = takeProfitMethod;
  let slFloored = false;
  let tpScaled = false;

  // Compute stop loss price
  if (stopLossMethod === 'atr' && atr && atr > 0 && atrMultiplier > 0) {
    const stopDistance = atr * atrMultiplier;
    stopLossPrice = direction === 'long' 
      ? entryPrice - stopDistance 
      : entryPrice + stopDistance;
    actualStopMethod = 'atr';
  } else {
    // Default to percent-based (use Math.max to prevent negative stops)
    const effectiveStopPercent = Math.max(0, stopPercent);
    stopLossPrice = direction === 'long'
      ? entryPrice * (1 - effectiveStopPercent / 100)
      : entryPrice * (1 + effectiveStopPercent / 100);
    actualStopMethod = 'percent';
  }

  // === ATR-BASED MINIMUM SL FLOOR ===
  // Ensures the stop is not tighter than 1× ATR (configurable via minAtrMultiplier).
  // Reference: Wilder's ATR (1978), Turtle Trading original rules (2× ATR stops).
  // A stop tighter than 1× ATR is likely to be clipped by normal market noise.
  if (atr && atr > 0 && minAtrMultiplier > 0) {
    const currentStopDistance = Math.abs(entryPrice - stopLossPrice);
    const minAtrDistance = atr * minAtrMultiplier;

    if (currentStopDistance < minAtrDistance) {
      stopLossPrice = direction === 'long'
        ? entryPrice - minAtrDistance
        : entryPrice + minAtrDistance;
      slFloored = true;
      actualStopMethod = `${actualStopMethod}+atr_floor`;
    }
  }

  // === MINIMUM PERCENT FLOOR ===
  // Prevents micro-stops on low-volatility instruments where ATR might not be available.
  // Default: 0.3% minimum distance from entry.
  if (minStopPercent > 0) {
    const currentStopDistance = Math.abs(entryPrice - stopLossPrice);
    const minPercentDistance = entryPrice * (minStopPercent / 100);

    if (currentStopDistance < minPercentDistance) {
      stopLossPrice = direction === 'long'
        ? entryPrice - minPercentDistance
        : entryPrice + minPercentDistance;
      slFloored = true;
      if (!actualStopMethod.includes('floor')) {
        actualStopMethod = `${actualStopMethod}+pct_floor`;
      }
    }
  }

  // Compute take profit price
  if (takeProfitMethod === 'ratio' && atr && atr > 0) {
    // Ratio-based TP: use RR ratio from targetPercent/stopPercent
    const stopDistance = Math.abs(entryPrice - stopLossPrice);
    const effectiveStopPercent = Math.max(0.01, stopPercent); // Avoid division by zero
    const rrRatio = targetPercent / effectiveStopPercent;
    const tpDistance = stopDistance * rrRatio;
    takeProfitPrice = direction === 'long'
      ? entryPrice + tpDistance
      : entryPrice - tpDistance;
    actualTpMethod = 'ratio';
  } else {
    // Default to percent-based
    const effectiveTargetPercent = Math.max(0, targetPercent);
    takeProfitPrice = direction === 'long'
      ? entryPrice * (1 + effectiveTargetPercent / 100)
      : entryPrice * (1 - effectiveTargetPercent / 100);
    actualTpMethod = 'percent';
  }

  // === MINIMUM R:R GUARD ===
  // If SL was widened (floored), the original TP may produce a sub-optimal R:R.
  // Scale TP to maintain at least minRiskRewardRatio (default 1.5:1).
  // Reference: Bulkowski — patterns below ~1.5:1 R:R rarely justify risk after costs.
  if (minRiskRewardRatio > 0) {
    const stopDistance = Math.abs(entryPrice - stopLossPrice);
    const currentTpDistance = Math.abs(takeProfitPrice - entryPrice);
    const currentRR = stopDistance > 0 ? currentTpDistance / stopDistance : 0;

    if (currentRR < minRiskRewardRatio && stopDistance > 0) {
      const requiredTpDistance = stopDistance * minRiskRewardRatio;
      takeProfitPrice = direction === 'long'
        ? entryPrice + requiredTpDistance
        : entryPrice - requiredTpDistance;
      tpScaled = true;
      actualTpMethod = `${actualTpMethod}+rr_floor`;
    }
  }

  const stopDistance = Math.abs(entryPrice - stopLossPrice);
  const tpDistance = Math.abs(takeProfitPrice - entryPrice);
  const riskRewardRatio = stopDistance > 0 ? tpDistance / stopDistance : 0;

  return {
    stopLossPrice: Number(stopLossPrice.toFixed(ROUNDING_CONFIG.priceDecimals)),
    takeProfitPrice: Number(takeProfitPrice.toFixed(ROUNDING_CONFIG.priceDecimals)),
    stopDistance: Number(stopDistance.toFixed(ROUNDING_CONFIG.distanceDecimals)),
    tpDistance: Number(tpDistance.toFixed(ROUNDING_CONFIG.distanceDecimals)),
    riskRewardRatio: Number(riskRewardRatio.toFixed(ROUNDING_CONFIG.rrDecimals)),
    stopLossMethod: actualStopMethod,
    takeProfitMethod: actualTpMethod,
    slFloored,
    tpScaled,
  };
}
