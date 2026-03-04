/**
 * Shared utility for deriving trade outcomes from bar data.
 * 
 * Checks if price has breached SL or TP after the pattern's detection date
 * by scanning bars chronologically. Used across all chart surfaces to ensure
 * consistent outcome resolution.
 */

import type { CompressedBar } from '@/types/VisualSpec';

export type DerivedOutcome = 'hit_sl' | 'hit_tp' | 'timeout' | null;

export interface OutcomeCheckParams {
  direction: string;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  detectedAt: string;  // ISO timestamp of detection
  bars: CompressedBar[];
  status?: string;     // optional pattern status (e.g. 'expired')
}

/**
 * Derive trade outcome by scanning bars after detection for SL/TP breach.
 * Returns 'hit_sl', 'hit_tp', 'timeout', or null (still active).
 */
export function deriveLiveOutcome(params: OutcomeCheckParams): DerivedOutcome {
  const { direction, entryPrice, stopLossPrice, takeProfitPrice, detectedAt, bars, status } = params;

  if (status === 'expired') return 'timeout';

  if (!Number.isFinite(entryPrice) || bars.length === 0) return null;

  const isLong = direction === 'long' || direction === 'bullish';
  const sl = stopLossPrice;
  const tp = takeProfitPrice;

  for (const bar of bars) {
    if (bar.t <= detectedAt) continue;
    if (isLong) {
      if (Number.isFinite(sl) && bar.l <= sl) return 'hit_sl';
      if (Number.isFinite(tp) && bar.h >= tp) return 'hit_tp';
    } else {
      if (Number.isFinite(sl) && bar.h >= sl) return 'hit_sl';
      if (Number.isFinite(tp) && bar.l <= tp) return 'hit_tp';
    }
  }
  return null;
}

/**
 * Check if an outcome string represents a resolved (finished) trade.
 */
export function isResolvedOutcome(outcome?: string | null): boolean {
  return ['hit_tp', 'hit_sl', 'timeout', 'win', 'loss'].includes(
    String(outcome || '').toLowerCase()
  );
}

/**
 * Derive outcome for a SetupWithVisuals object using its own bars.
 * Convenience wrapper for use in MobileCommandCenter / CommandCenterLayout.
 */
export function deriveSetupOutcome(setup: {
  direction: string;
  signalTs: string;
  tradePlan: { entry: number; stopLoss: number; takeProfit: number };
  bars: CompressedBar[];
  outcome?: string | null;
}): DerivedOutcome {
  // If already has a resolved outcome, respect it
  if (isResolvedOutcome(setup.outcome)) return null;

  return deriveLiveOutcome({
    direction: setup.direction,
    entryPrice: setup.tradePlan.entry,
    stopLossPrice: setup.tradePlan.stopLoss,
    takeProfitPrice: setup.tradePlan.takeProfit,
    detectedAt: setup.signalTs,
    bars: setup.bars,
  });
}
