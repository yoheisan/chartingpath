# Geometry provenance (stop/target derivation)

## Finding
`seed-historical-patterns-mtf` falls back to a generic rule when pattern pivots are
insufficient: stop = 2x ATR, target = 4x ATR. That yields `risk_reward_ratio` of exactly
2.0 by construction. Two thirds of resolved 2024+ occurrences carry exactly 2.0, so most
cross-pattern comparisons were mixing measured-move geometry with a volatility rule.
The arithmetic was never wrong — the fallback path was simply indistinguishable from the
real one in stored data.

## What changed
- `geometry_source` column on `historical_pattern_occurrences` and `live_pattern_detections`
  (`pivot` | `atr_fallback` | `neckline_fallback` | `unknown`, default `unknown`).
- Set at write time in `seed-historical-patterns-mtf`. `scan-live-patterns` always tags
  `atr_fallback` — live brackets are ATR-derived, never pivot geometry.
- `get_pattern_outcome_cells(p_geometry_source)` and `get_pattern_edge(p_geometry_source)`
  can segment. `get_pattern_edge` defaults to `'pivot'`, and `v_live_detections_with_edge`
  computes edge from the pivot cohort only, so alerts no longer qualify on the fallback.
- `/outcomes` gains an "Exit geometry" filter plus a plain-language disclosure;
  `/methodology#geometry` explains the fallback.
- Health check `geometry_source_distribution` (warning) fires when any pattern derives
  more than 50% of its resolved occurrences from `atr_fallback`.
- `compute-multi-rr-outcomes` carries a header note: unused, and must be scoped to the
  pivot cohort before it is ever run.

## Backfill rules (deliberately conservative)
- `atr_fallback`: |rr - 2.0| < 0.001 AND stop distance within 5% of 2x `atr_value`.
  Tolerance is 5%, not 0.5%, because the stored `atr_value` was recomputed later with a
  true-range method while the seeder used its own ATR; the ratio clusters at 2.0 +/- 0.1.
- `pivot`: rr not exactly 2.0.
- everything else stays `unknown`. Roughly 325k rows are not retroactively determinable —
  chiefly rr exactly 2.0 with no `atr_value` recorded. `unknown` is the honest answer.

The backfill runs in batches via the `backfill-geometry-source` cron job; unschedule it
once `unknown` stops falling.

## Not changed
The detector's fallback behaviour. Having a fallback is reasonable; hiding it was not.
