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

## Write-path guard rule: quarantine, never raise
**A write-time guard must never abort a batch. Mark the row and let downstream
filters exclude it.** On 2026-08-17 21:07 UTC
`trg_guard_occurrence_risk_distance` RAISEd a `check_violation` on a single
sub-0.1% risk-distance row. The seeder inserts in batches, so that one row
aborted the whole batch and the edge function threw — ingestion was dead for
about nine hours. A data-quality issue became an availability outage.

The guard now sets `execution_status = 'invalid_risk_distance'` and returns the
row; every consumer already filters on `execution_status = 'valid'`.
`guard_paper_trade_exit` follows the same rule (`data_quality_suspect = true`,
never RAISE). Audit of 2026-08-18: the only triggers that still raise are
`check_alert_limit`, `enforce_master_plan_quality_gate` and
`prevent_self_subscription_change` — all single-row, user-initiated writes
where rejecting the write is the correct answer, none on a batch path.

## Pieces
- `data_health_checks` — the check definitions (name, severity, expectation).
- `data_health_results` — every run, with observed value, detail and duration.
- `data_health_vocabulary` — canonical asset-class and direction values.
- `data_health_cron_expectations` — job → table it must write to, and window.
- `run_data_health_checks(p_only)` — Postgres function; runs all or one check.
- `run_extra_health_check(name)` — extension point for newer checks.
- `run-data-health-checks` edge function — nightly runner (`data-health-nightly`,
  03:20 UTC), emails admins on critical failures, max one per check per day.
- Admin → Data Health panel — status, last run, 30-day sparkline, manual run.

## `ingestion_alive` (critical)
Fails when `historical_pattern_occurrences` has gained no rows in **6 hours**.
The seeder writes every ~12 minutes, so six hours of silence is dead, not slow.
`detections_fresh_per_asset_class` runs on a 48h window — far too slow to catch
the outage above, which was noticed only through GitHub failure emails.

## Honest limitation

## `seeder_error_rate` (critical)
Fails when more than 20% of `seed-historical-patterns-mtf` invocations in the
last 3 hours did not complete. HTTP **546** is the edge runtime's
resource-limit kill: the process dies with no response, so there is no error
handler and nothing in the function's own logging. The only way to see it from
Postgres is `seed_invocation_log` — a row written when the run starts and
updated when it finishes. A row still `running` after 15 minutes is a run the
runtime killed. On 2026-08-17 the seeder returned 546 from 19:21 to 21:45 and
the only signal was GitHub failure email.

Per-invocation cost is bounded by `maxPerRun` (1 instrument) and a persisted
cursor in `scan_rotation_cursor` (`asset_type = 'seed_mtf'`), and the function
flushes detections to the database per pattern instead of accumulating a whole
run in memory. Peak heap is logged as `[seed-mtf][mem]` and returned as
`peakRssMb`, so headroom is visible without waiting for the next failure.


These checks catch only what we thought to assert. They would **not** have
caught the Edge Atlas hardcoded positive-expectancy filter: that produced
plausible, internally consistent data from flawed logic. A green board is a
safety net, not a proof of correctness.

## Performance note
`prices_fresh_per_asset_class` and `scanner_coverage` deliberately query
`historical_prices.date` (indexed) rather than `updated_at`. `historical_prices`
is 2.4 GB; a full scan made the monitor itself time out, which is the exact
failure mode the monitor exists to prevent.
