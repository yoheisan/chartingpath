/**
 * SINGLE SOURCE OF TRUTH for outcome statistics used as STATIC FALLBACKS.
 *
 * These are fallbacks only — used in meta tags, JSON-LD, and anywhere a live
 * query isn't possible. Prefer `useOutcomeCount()` (or another live hook)
 * wherever a live query CAN be run.
 *
 * Figures verified directly against the production Supabase database on
 * 2026-07-30. Re-verify with `scripts/verify-outcome-stats.sql` after each
 * backfill so these numbers don't drift again.
 */
export const OUTCOME_STATS = {
  /** Every row in historical_pattern_occurrences (resolved + timeout) */
  totalOccurrences: 660_143,
  /** outcome in ('hit_tp','hit_sl') — the only rows that are real outcomes */
  resolvedOutcomes: 509_881,
  /** Detections that never resolved */
  timeoutOccurrences: 150_261,
  /** Distinct symbols that have at least one outcome */
  symbolsWithOutcomes: 770,
  /** Active rows in the `instruments` table */
  activeInstruments: 821,
  patterns: 17,
  timeframes: 6,
  historyStart: '2006-05-06',
  /** Aggregate across all resolved outcomes */
  aggregateWinRate: 0.306,
  aggregateAvgRR: 1.83,
  /** NEGATIVE in aggregate — do not make "proven outcome" claims */
  aggregateExpectancyR: -0.136,
} as const;

/** Display label for the headline number (resolved outcomes only) */
export const RESOLVED_OUTCOMES_LABEL = '500K+';

/** Display label for the tradeable instrument universe */
export const INSTRUMENTS_LABEL = '820+';

/** Minimum sample size before a statistic is presented as meaningful */
export const MIN_SAMPLE_SIZE = 30;