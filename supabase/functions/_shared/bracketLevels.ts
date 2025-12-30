/**
 * Bracket Levels Calculator
 * 
 * SINGLE SOURCE OF TRUTH for computing Stop Loss and Take Profit levels at entry time.
 * 
 * ARCHITECTURE NOTE: Due to Deno bundling constraints, this file is duplicated:
 * - Edge functions: supabase/functions/_shared/bracketLevels.ts (this file)
 * - Frontend/Tests: src/utils/bracketLevels.ts
 * 
 * BOTH FILES MUST BE IDENTICAL (except for this header comment).
 * A sync test in tests/utils/computeBracketLevels.test.ts verifies they match.
 * 
 * Rounding contract (ROUNDING_CONFIG):
 * - Prices: 8 decimal places
 * - Distances: 8 decimal places  
 * - Risk/Reward Ratio: 4 decimal places
 */

export interface BracketLevelsInput {
  direction: 'long' | 'short';
  entryPrice: number;
  stopPercent: number;      // e.g., 1.5 for 1.5%
  targetPercent: number;    // e.g., 3.0 for 3.0%
  atr?: number;             // Optional: ATR value at entry
  atrMultiplier?: number;   // Optional: multiplier for ATR-based stops
  stopLossMethod?: 'percent' | 'atr' | 'fixed';
  takeProfitMethod?: 'percent' | 'ratio' | 'fixed';
}

export interface BracketLevelsOutput {
  stopLossPrice: number;
  takeProfitPrice: number;
  stopDistance: number;     // Absolute distance from entry to SL
  tpDistance: number;       // Absolute distance from entry to TP
  riskRewardRatio: number;  // TP distance / SL distance
  stopLossMethod: string;
  takeProfitMethod: string;
}

/**
 * Rounding configuration - single source of truth for precision
 */
export const ROUNDING_CONFIG = {
  priceDecimals: 8,
  distanceDecimals: 8,
  rrDecimals: 4
} as const;

/**
 * Version constant for sync verification between frontend and edge function implementations.
 * MUST match src/utils/bracketLevels.ts
 * Increment when making any changes to the computation logic.
 */
export const BRACKET_LEVELS_VERSION = '1.0.0';

/**
 * Computes bracket levels (SL/TP) at entry time.
 * This is the single source of truth for both backtesting and alerts.
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
    takeProfitMethod = 'percent'
  } = input;

  // Validate critical inputs
  if (entryPrice <= 0) {
    throw new Error('entryPrice must be greater than 0');
  }

  let stopLossPrice: number;
  let takeProfitPrice: number;
  let actualStopMethod = stopLossMethod;
  let actualTpMethod = takeProfitMethod;

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
    takeProfitMethod: actualTpMethod
  };
}
