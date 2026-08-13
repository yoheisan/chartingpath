# Data health monitoring

## Why
Every bug found on 2026-08-13 had been silently broken for weeks while every
dashboard said "success": FX pipeline dead 12 days, `stock` vs `stocks`,
`long` vs `bullish`, impossible paper-trade outcomes, alerts dead since
2026-04-17, `instruments.sector` never populated. Job-level monitoring proves a
job ran. It does not prove the job produced correct data.

## Design principle: detect and alert, never auto-fix
Auto-repair destroys the evidence needed to find the real bug, and a wrong
check silently corrupts good data. The only automatic actor is the **write-time
guard** (`guard_paper_trade_exit` plus the 50% deviation guards in
`manage-trades` and `monitor-paper-trades`), which refuses a bad row before it
exists. Everything else observes, records and notifies a human.

## Pieces
- `data_health_checks` — the 14 check definitions (name, severity, expectation).
- `data_health_results` — every run, with observed value, detail and duration.
- `data_health_vocabulary` — canonical asset-class and direction values.
- `data_health_cron_expectations` — job → table it must write to, and window.
- `run_data_health_checks(p_only)` — Postgres function; runs all or one check.
- `run-data-health-checks` edge function — nightly runner (`data-health-nightly`,
  03:20 UTC), emails admins on critical failures, max one per check per day.
- Admin → Data Health panel — status, last run, 30-day sparkline, manual run.

## Honest limitation
These checks catch only what we thought to assert. They would **not** have
caught the Edge Atlas hardcoded positive-expectancy filter: that produced
plausible, internally consistent data from flawed logic. A green board is a
safety net, not a proof of correctness.

## Performance note
`prices_fresh_per_asset_class` and `scanner_coverage` deliberately query
`historical_prices.date` (indexed) rather than `updated_at`. `historical_prices`
is 2.4 GB; a full scan made the monitor itself time out, which is the exact
failure mode the monitor exists to prevent.
