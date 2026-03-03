

## Simplify Pattern Overlays: Show Only Active Patterns with Full Identification

### Problem
Currently, the chart shows grey circle markers for historical/stale patterns that aren't interactive and provide no useful context without the pattern structure (zigzag, pivots). Additionally, TP/SL shaded zones can appear for patterns whose identification UI has been stripped, creating confusion.

### Approach
Only render pattern overlays (polyline, TP/SL shades, entry line, markers) for patterns that are **actively tradeable or pending resolution**. Once a pattern is resolved (SL hit, TP hit, or timed out), remove all its visual elements from the chart entirely.

### Changes

**File: `src/components/command-center/CommandCenterChart.tsx`**

1. **Remove grey/stale markers completely**
   - Delete the `else` branch (lines ~561-579) that renders grey circle markers for non-actionable historical patterns. These provide no value without the full pattern identification.

2. **Gate `overlayPattern` on active/pending status only**
   - Modify the `overlayPattern` memo to only select patterns that are still active or have a derived (live) outcome but are NOT fully resolved in the database (no `hit_tp`, `hit_sl`, `timeout`).
   - Current logic falls back to resolved historical patterns — this fallback will be removed.

3. **Gate `tradePlan` and `formationOverlays` accordingly**
   - Since these derive from `overlayPattern`, they will automatically stop rendering when no active pattern exists. No separate change needed.

4. **Gate `historicalPatternOverlays` accordingly**
   - Same as above — derived from `overlayPattern`, so it will clear automatically.

5. **Keep derived outcome rendering (live SL/TP hits)**
   - Patterns where the frontend has detected a live TP/SL breach (`_derivedOutcome`) should still show full UI with outcome coloring (green/red) until the backend confirms and marks them resolved. This preserves the real-time feedback loop.

### Result
- **Active patterns**: Full UI — zigzag polyline, pivot labels, TP/SL shaded zones, entry line, directional arrow
- **Live-resolved patterns** (derived outcome): Full UI with outcome color coding (green TP / red SL)
- **Backend-resolved patterns** (hit_tp, hit_sl, timeout): Nothing shown on chart
- **Stale/expired patterns**: Nothing shown on chart

### Technical Detail

```text
overlayPattern selection (updated):
  1. Active + non-expired pattern (with pivots preferred)
  2. Pattern with _derivedOutcome (live resolution, not yet backend-confirmed)
  3. null (no overlay)

Removed fallbacks:
  - latestUnresolvedPattern (was showing old pending patterns)
  - sortedPatterns[0] (was falling back to any historical pattern)

Marker rendering:
  - Only patterns in actionableIds or derivedOutcomeIds get markers
  - No more grey circle fallback branch
```

