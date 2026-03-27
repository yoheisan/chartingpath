

# Stable Chart Pattern Marker Layering — Root Cause Fix

## Problem Diagnosed

After extensive investigation of `StudyChart.tsx` (2135 lines), `CommandCenterChart.tsx`, `PatternOverlayRenderer.ts`, and `chartConstants.ts`, the root cause is clear:

**The entry arrow uses canvas overlay coordinate mapping (`priceToCoordinate` / `timeToCoordinate`) which is inherently unstable across refresh/zoom/scale changes.** This is why every previous fix was temporary — canvas coordinates are recalculated each frame and depend on the chart's current viewport state, which changes non-deterministically after refresh.

Specific issues:
1. Canvas triangle rendering fires via `setTimeout(250) + requestAnimationFrame` — timing-dependent
2. `normalizeBarsForConsistentColoring` inflates `h`/`l` values (line 268: `h: Math.max(bar.h, normalizedOpen, bar.c)`), creating a mismatch between raw bars used for entry-hit detection and chart bars used for coordinate rendering
3. Entry-hit scan uses raw `bars` but `findNearestCandleTime` maps to `safeChartData` (normalized) — timestamp mismatches cause wrong candle anchoring
4. Canvas overlays are redrawn on every `visibleLogicalRangeChange` subscription, competing with autoscale adjustments after data loads

## Solution: Remove Canvas Entry Arrow, Use Native APIs Only

Per user preference: anchor the entry arrow to the **detection candle** (not entry-hit candle).

### Architecture Change

```text
BEFORE (unstable):
  ENTRY/SL/TP lines  →  createPriceLine (stable ✓)
  Entry arrow        →  Canvas triangle via priceToCoordinate (UNSTABLE ✗)
  Formation zones    →  Canvas overlay (acceptable — full-width, no x precision needed)

AFTER (stable):
  ENTRY/SL/TP lines  →  createPriceLine (stable ✓)
  Entry arrow        →  Native series marker via createSeriesMarkers (stable ✓)
  Formation zones    →  Canvas overlay (unchanged)
```

### File Changes

**`src/components/charts/StudyChart.tsx`** — Main changes:

1. **Remove canvas triangle for current pattern entry** (lines ~989-1025): Delete the entire `entryHitTs` scan block that finds "first post-detection candle touching entry". Replace with a native series marker anchored to the detection date.

2. **Add current pattern to native markers** (lines ~1028-1033): Instead of filtering out the current pattern from `patternsForMarkers`, include it. The marker will use `detectedAt` (which is the pattern's confirmation date), not entry-hit time.

3. **Keep canvas triangles only for structural pivots** (Breakout/Breakdown labels from pivots) — these are less problematic since they snap to candle extremes and are less price-sensitive.

4. **Remove the entry-specific canvas triangle push** but keep breakout/breakdown pivot markers in `canvasTriangleMarkers`.

5. **Simplify `shouldDrawTriangles`** condition — only true when structural (non-entry) canvas markers exist.

**`src/components/charts/PatternOverlayRenderer.ts`** — Minor:

6. **Update `generatePatternMarkers`** to use `detectedAt` with proper intraday timestamp matching (currently uses date-only `split('T')[0]` which loses intraday precision for 1H/4H charts). Use `findNearestCandleTime` for robust time-snapping instead of date string matching.

### Why This Is Stable

- `createPriceLine` is **price-anchored** — immune to viewport/scale changes
- `createSeriesMarkers` snaps markers to **actual data points** in the series — the library handles coordinate mapping internally, survives resize/autoscale/refresh
- Removing canvas-based entry triangle **eliminates the coordinate desync** that caused every previous fix to be temporary
- Detection candle anchoring avoids the fragile entry-hit scan entirely

### Scope

- 2 files modified
- ~50 lines changed total
- No new dependencies
- No breaking changes to props/interfaces

