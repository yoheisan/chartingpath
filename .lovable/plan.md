
Stable fix plan for recurring SL/ENTRY/TP desync (dashboard chart)

Do I know what the issue is? Yes.

What is actually happening
- The chart candles and the pattern trade levels are coming from different freshness states.
- Candles in `historical_prices` for `MXNJPY=X` `1h` are stale (latest around 2026-03-02), while `live_pattern_detections` has much newer pattern levels (2026-03-26).
- Result: ENTRY/SL/TP lines are numerically correct for the detected pattern, but visually “out of sync” with the displayed bars.

Why previous fixes kept failing
- Previous fixes focused on rendering/marker alignment (canvas vs native markers, snapping).
- This bug is primarily a data-coherence problem, not a coordinate-rendering problem.
- The frontend currently treats “enough bars” as valid even if those bars are old, so refresh reintroduces stale candles.
- Pattern and candle fetches run independently with no strict “same as-of time” gate.

Implementation plan (fundamental fix)
1) Add freshness validation for chart bars before accepting DB data
- File: `src/components/command-center/CommandCenterChart.tsx`
- Add timeframe-based max age thresholds (e.g., 1h: 8–12h, 4h: 24h, 8h: 48h, 1d: 5d, 1wk: 21d).
- In `fetchChartData`, after DB read, reject DB data as stale if latest bar is older than threshold, even if bar count is high.
- If stale, force provider fetch (`fetchMarketBars`) and replace cache with fresh bars.

2) Add overlay coherence gate (pattern must match loaded chart window)
- File: `src/components/command-center/CommandCenterChart.tsx`
- Before building `overlayPattern`/`tradePlan`/`historicalPatternOverlays`, require:
  - pattern `detectedAt` <= latest chart bar time + 1 interval
  - pattern `detectedAt` >= earliest visible chart window (or within allowed lookback)
  - entry/SL/TP within extended chart price range guard (already partly present; tighten)
- If not coherent, do not render pattern trade levels (fail-safe: no misleading lines).

3) Enforce stable source-of-truth synchronization on refresh
- File: `src/components/command-center/CommandCenterChart.tsx`
- Sequence fetch so pattern eligibility is computed only after bars are known fresh.
- Recompute eligible overlays when bars update to avoid stale overlay state surviving refresh.

4) Durable backend fix so stale DB does not reappear
- File: `supabase/functions/scan-live-patterns/index.ts`
- When Yahoo fallback provides newer bars, upsert those bars into `historical_prices` (`onConflict: symbol,timeframe,date`).
- This keeps the chart’s DB source aligned with detector data over time (not just current session).

5) Normalize timeframe/symbol consistency safeguards
- Files:
  - `src/components/command-center/CommandCenterChart.tsx`
  - `supabase/functions/scan-live-patterns/index.ts`
- Standardize timeframe casing (`1h`, `4h`, etc.) and ensure reads/writes are consistent.
- Prevent silent drift caused by mixed-case timeframe records.

6) Add diagnostics for future regressions
- Files:
  - `src/components/command-center/CommandCenterChart.tsx`
  - `supabase/functions/scan-live-patterns/index.ts`
- Log:
  - chart latest bar timestamp
  - pattern detected timestamp
  - freshness decision (db accepted/rejected)
  - coherence decision (overlay shown/hidden)
- This makes root-cause verification immediate if issue reappears.

Validation plan
- Reproduce current failing case on `/members/dashboard` with `MXNJPY=X` 1H.
- Hard refresh multiple times; confirm:
  - bars latest timestamp is fresh
  - rendered ENTRY/SL/TP belong to same time context as candles
  - no re-desync after reload
- Switch timeframes (1H ↔ 4H ↔ 1D) and symbols to confirm guards are stable.
- Verify no overlay is shown when coherence checks fail (safe fail behavior).

Technical details (for implementation)
- Primary files to modify:
  - `src/components/command-center/CommandCenterChart.tsx`
  - `supabase/functions/scan-live-patterns/index.ts`
- Optional supporting update:
  - shared helper for timeframe freshness thresholds (if extracted)
- No UI redesign required; this is a data synchronization and gating correction.
