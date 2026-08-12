# Vocabulary contract: live vs historical pattern tables

`live_pattern_detections` and `historical_pattern_occurrences` are joined on every
edge lookup, every alert dispatch decision and every kill-switch evaluation. They have
**diverged silently more than once**, and the failure mode is always the same: the join
returns zero rows, nothing throws, and the feature looks like it is simply finding
nothing interesting.

## Known divergences

| Column | live_pattern_detections | historical_pattern_occurrences | Status |
| --- | --- | --- | --- |
| `direction` | `long` / `short` | `bullish` / `bearish` | **Diverged.** Zero overlap. Must normalise. |
| `asset_type` | `stocks`, `fx`, `crypto`, `etfs`, `indices`, `commodities` | same | Agreed. A former UI map sent singular `stock`/`commodity`/`index` — that bug is fixed, do not reintroduce singulars. |
| `timeframe` | `15m`, `1h`, `4h`, `8h`, `1d`, `1wk` | same | Agreed. `15m` exists only for stocks historically. |
| `pattern_id` | 17 slugs | those 17 plus 6 more | Agreed vocabulary; live is a strict subset. Verified 2026-08-12. |
| `instrument` / `symbol` | column is `instrument` | column is `symbol` | Different column *names*, same ticker vocabulary. |

`paper_trades` uses `trade_type` with the **live** vocabulary (`long`/`short`).
`cell_status.direction` uses the **historical** vocabulary (`bullish`/`bearish`), and
is CHECK-constrained to it.

## The rule

Any new code that joins, filters or compares these columns **must** go through
`src/config/vocabularies.ts`:

- `toHistoricalDirection()` / `toLiveDirection()` / `sameDirection()`
- `toDbAssetType()` — never hand-write `'stock'`
- `toDbTimeframe()`
- `toDbPatternId()` / `directionForPatternId()`

In SQL, normalise inline with an explicit `CASE lower(direction) WHEN 'long' THEN
'bullish' WHEN 'short' THEN 'bearish' ELSE lower(direction) END`. `get_pattern_edge`
and `v_live_detections_with_edge` both do this; copy that shape.

## Why this file exists

Two vocabulary bugs surfaced on the same day (2026-08-12), both invisible. Neither
raised an error, neither showed in logs, and both were only caught by manually
comparing distinct values across the two tables. If you are adding a join, run the
distinct-value comparison first — it takes one query and it is the only reliable check.
