# CI status

The Jest suite is currently red. As of the last full local run: **18 suites — 4 pass / 14 fail**,
**104 tests — 71 pass / 33 fail**. These are pre-existing, real failures (assertion-level), not
environmental. The `unit-tests-known-failing` job in `.github/workflows/test.yml` runs with
`continue-on-error: true` so the rest of the pipeline still gives real signal. Flip it back to
blocking (`continue-on-error: false`) as soon as the suite is green.

## Failing suites

- `tests/backtester-v2/01_fx_golden` — **config failure, likely a quick fix**: needs
  `resolveJsonModule` enabled so `fixtures/legacyFx.golden.json` can be imported.
- `tests/backtester-v2/02_fx_costs`
- `tests/backtester-v2/03_fx_rollover`
- `tests/backtester-v2/04_pair_zscore_signals`
- `tests/backtester-v2/06_pair_borrow_cost`
- `tests/backtester-v2/07_basket_equal_bh`
- `tests/backtester-v2/08_basket_dca`
- `tests/backtester-v2/09_basket_rebalance_band`
- `tests/backtester-v2/11_head_shoulders`
- `tests/backtester-v2/12_double_top_bottom`
- `tests/backtester-v2/13_triangle_patterns`
- `tests/components/BacktestResultSummary`
- `tests/config/plansSync`
- `utils/computeBracketLevels`

Except for `01_fx_golden`, these are assertion failures that need real investigation — do not
silence them by loosening assertions.

## Passing suites

- `tests/backtester-v2/05_pair_beta_sizing`
- `tests/backtester-v2/10_flag_routes`
- `tests/backtester-v2/14_wedge_id_resolution`
- `tests/projects/creditsEstimation`

## Known dependency conflict

`npm ci` requires `--legacy-peer-deps` across all workflows: `react-day-picker@^8.10.1` declares a
peer of `date-fns@^2.28.0 || ^3.0.0` while the project uses `date-fns@^4.1.0`. The real fix is
upgrading to `react-day-picker@9`, a breaking change deferred to its own task.