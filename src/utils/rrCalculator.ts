/**
 * Risk:Reward Calculator Utility
 * 
 * Recalculates Take Profit based on user-selected R:R tier.
 * Uses fixed Stop Loss distance and multiplies by the selected R:R ratio.
 * 
 * Formula:
 * - Long: TP = Entry + (stopDistance × selectedRR)
 * - Short: TP = Entry - (stopDistance × selectedRR)
 */

export interface TradePlanInput {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  rr: number;
  stopDistance?: number;
  tpDistance?: number;
}

export interface RecalculatedTradePlan extends TradePlanInput {
  stopDistance: number;
  tpDistance: number;
}

/**
 * Standard R:R tiers available to users (professional standard)
 */
export const RR_TIERS = [2, 3, 4, 5] as const;
export type RRTier = typeof RR_TIERS[number];
export const DEFAULT_RR: RRTier = 2;

/**
 * Recalculates Take Profit and related fields based on selected R:R tier
 * 
 * @param tradePlan - Original trade plan from backend
 * @param direction - 'long' or 'short'
 * @param selectedRR - User-selected R:R tier (2, 3, 4, or 5)
 * @returns Recalculated trade plan with new TP, rr, and tpDistance
 */
export function recalculateTradePlan(
  tradePlan: TradePlanInput,
  direction: 'long' | 'short',
  selectedRR: RRTier
): RecalculatedTradePlan {
  const { entry, stopLoss } = tradePlan;
  
  // Calculate stop distance (should always be positive)
  const stopDistance = Math.abs(entry - stopLoss);
  
  // Calculate new TP distance based on selected R:R
  const tpDistance = stopDistance * selectedRR;
  
  // Calculate new Take Profit based on direction
  const takeProfit = direction === 'long' 
    ? entry + tpDistance 
    : entry - tpDistance;
  
  return {
    ...tradePlan,
    takeProfit,
    rr: selectedRR,
    stopDistance,
    tpDistance,
  };
}

/**
 * Format R:R for display (e.g., "1:2", "1:3")
 */
export function formatRR(rr: number): string {
  return `1:${rr}`;
}
