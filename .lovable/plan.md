

## Problem

The screenshot shows AAPL with SL at 256.69 — current price is 262.52, but the trade plan lines (Entry, SL, TP) are still rendered. The `CommandCenterChart` thumbnail already has `deriveLiveOutcome` logic that suppresses trade plans for resolved patterns (line 610-612), but this outcome derivation is **not propagated** to:

1. **FullChartViewer** — receives `setup` as-is with no outcome check; always renders trade plan lines
2. **MobileCommandCenter / CommandCenterLayout** — build `selectedSetup` from raw pattern data without applying the derived outcome

The core gap: `deriveLiveOutcome` runs inside `CommandCenterChart` only for thumbnail rendering. When the user taps to open the full chart, the setup is rebuilt from the raw DB record (via `get-live-pattern-details`), which doesn't have a resolved outcome field yet.

## Plan

### 1. Extract `deriveLiveOutcome` into a shared utility

Move the bar-by-bar SL/TP breach detection from `CommandCenterChart` into a new shared utility (e.g., `src/utils/deriveLiveOutcome.ts`). This makes it reusable across all chart surfaces.

```
deriveLiveOutcome(pattern, bars) → 'hit_sl' | 'hit_tp' | 'timeout' | null
```

### 2. Apply outcome derivation when building `selectedSetup` for FullChartViewer

In both `MobileCommandCenter.tsx` and `CommandCenterLayout.tsx`, after fetching pattern details and constructing the setup, run `deriveLiveOutcome` against the pattern's bars. If the trade is resolved:

- Clear the `tradePlan` overlay (set entry/SL/TP lines to not render)
- Or mark `setup.outcome` so `FullChartViewer` can suppress trade plan rendering

### 3. Add outcome guard inside `FullChartViewer`

Add a check at the top of `FullChartViewer`'s rendering logic: if the setup has a resolved outcome (`hit_sl`, `hit_tp`, `timeout`), suppress:
- Horizontal price lines (Entry, SL, TP)
- Shaded TP/SL zones
- Autoscale inclusion of trade plan prices

Keep structural overlays (ZigZag, formation zones, markers) visible per existing policy.

### 4. Update `CommandCenterChart` to use the shared utility

Replace the inline `deriveLiveOutcome` function in `CommandCenterChart.tsx` with an import from the new shared utility to maintain a single source of truth.

### Files to change
- **Create**: `src/utils/deriveLiveOutcome.ts`
- **Edit**: `src/components/command-center/CommandCenterChart.tsx` — import shared utility
- **Edit**: `src/components/command-center/MobileCommandCenter.tsx` — apply outcome derivation to selectedSetup
- **Edit**: `src/components/command-center/CommandCenterLayout.tsx` — same
- **Edit**: `src/components/charts/FullChartViewer.tsx` — suppress trade plan when outcome is resolved

