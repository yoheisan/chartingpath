/**
 * Economic-significance gate.
 *
 * Statistical significance and economic significance are SEPARATE tests.
 * A cell can beat its own random-walk baseline on win rate — a genuine,
 * measurable statistical edge — while its reward-to-risk is poor enough that
 * the wins do not cover the losses. Beating chance does not make a trade worth
 * taking: risking 1% to earn 0.04% is not an opportunity.
 *
 * So a cell must ALSO clear a minimum gross expectancy before it qualifies.
 * Mirrors public.min_expectancy_r() in Postgres — keep the two in step.
 */
export const MIN_EXPECTANCY_R = 0.10;

/** Expectancy at or above this reads as a strong cell. */
export const STRONG_EXPECTANCY_R = 0.20;

export type ExpectancyBand = 'strong' | 'moderate' | 'below';

export function expectancyBand(expectancyR?: number | null): ExpectancyBand | null {
  if (expectancyR == null || Number.isNaN(expectancyR)) return null;
  if (expectancyR >= STRONG_EXPECTANCY_R) return 'strong';
  if (expectancyR >= MIN_EXPECTANCY_R) return 'moderate';
  return 'below';
}

export const EXPECTANCY_BAND_LABEL: Record<ExpectancyBand, string> = {
  strong: 'Strong',
  moderate: 'Moderate',
  below: 'Below bar',
};

export const EXPECTANCY_BAND_CLASS: Record<ExpectancyBand, string> = {
  strong: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  moderate: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  below: 'border-border bg-muted text-muted-foreground',
};
