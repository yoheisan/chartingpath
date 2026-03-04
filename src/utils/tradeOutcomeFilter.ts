/**
 * Client-side trade outcome detection.
 * 
 * Filters out patterns where the trade has already ended (SL or TP hit)
 * based on the current price relative to trade plan levels.
 * 
 * This is a lightweight check using `currentPrice` (latest close from the scan).
 * The definitive outcome is derived by the chart's bar-by-bar `deriveLiveOutcome`.
 */

import type { LiveSetup } from '@/types/screener';

export type TradeOutcome = 'hit_sl' | 'hit_tp' | null;

/**
 * Determine if a trade's SL or TP has been breached based on current price.
 * Returns 'hit_sl', 'hit_tp', or null (still active).
 */
export function detectTradeOutcome(setup: LiveSetup): TradeOutcome {
  const { tradePlan, direction, currentPrice } = setup;
  if (!tradePlan || !currentPrice || !Number.isFinite(currentPrice)) return null;

  const { entry, stopLoss, takeProfit } = tradePlan;
  if (!Number.isFinite(entry) || !Number.isFinite(stopLoss) || !Number.isFinite(takeProfit)) return null;

  const isLong = direction === 'long';

  if (isLong) {
    // Long: SL is below entry, TP is above entry
    if (currentPrice <= stopLoss) return 'hit_sl';
    if (currentPrice >= takeProfit) return 'hit_tp';
  } else {
    // Short: SL is above entry, TP is below entry
    if (currentPrice >= stopLoss) return 'hit_sl';
    if (currentPrice <= takeProfit) return 'hit_tp';
  }

  return null;
}

/**
 * Filter an array of LiveSetups, removing any where the trade has already ended.
 * Returns only patterns where the trade is still active.
 */
export function filterActiveTradesOnly<T extends LiveSetup>(setups: T[]): T[] {
  return setups.filter(setup => detectTradeOutcome(setup) === null);
}

/**
 * Annotate setups with their trade outcome without filtering.
 * Useful for UIs that want to show resolved trades with visual indicators.
 */
export function annotateTradeOutcomes<T extends LiveSetup>(
  setups: T[]
): (T & { tradeOutcome: TradeOutcome })[] {
  return setups.map(setup => ({
    ...setup,
    tradeOutcome: detectTradeOutcome(setup),
  }));
}
