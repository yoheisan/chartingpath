

## Fix: Chart Distortion from Stale Formation Overlays

### Problem
The chart for PL=F shows candles squashed at the bottom because a pattern's zigzag pivots have prices around ~2100 while the actual price is ~964. The zigzag and trendline LineSeries are included in the chart's autoscale calculation, forcing the Y-axis to stretch up to accommodate them. This is the same class of bug that was fixed for trade plan lines (the 35% Price Proximity Guard) but was never applied to formation overlays.

### Root Cause
In `StudyChart.tsx` (lines 662-694), the zigzag and trendline `LineSeries` are added **without** `autoscaleInfoProvider: () => null`. Unlike the EMA/Bollinger/VWAP indicator series (which all have this set), formation overlays participate in the default autoscale, pulling the price axis to include their extreme values.

### Solution (Two Layers)

**Layer 1: Decouple formation overlays from autoscale** (in `StudyChart.tsx`)
- Add `autoscaleInfoProvider: () => null` to all three formation overlay LineSeries (zigzag, upperTrend, lowerTrend) -- same pattern used by all indicator series already.

**Layer 2: Skip stale formation overlays entirely** (in `CommandCenterChart.tsx`)
- Add a price proximity guard to `formationOverlays` memo: if the pivot prices are more than 50% away from the latest chart bar close, skip deriving the overlay altogether. This prevents rendering irrelevant structural data from old patterns.

### Files to Edit

1. **`src/components/charts/StudyChart.tsx`** (~lines 662, 674, 686)
   - Add `autoscaleInfoProvider: () => null` to zigzag, upperTrend, and lowerTrend LineSeries options.

2. **`src/components/command-center/CommandCenterChart.tsx`** (~lines 549-558)
   - Add price proximity check in the `formationOverlays` useMemo: verify that the overlay pattern's pivot prices are within a reasonable range of the current chart price before deriving the formation.

### Technical Detail

```text
Before (zigzag LineSeries):
  chart.addSeries(LineSeries, {
    color: 'rgba(0, 200, 255, 0.85)',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
  });

After:
  chart.addSeries(LineSeries, {
    color: 'rgba(0, 200, 255, 0.85)',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: false,
    autoscaleInfoProvider: () => null,  // <-- decouple from Y-axis scaling
  });
```

For CommandCenterChart, the guard:
```text
const formationOverlays = useMemo(() => {
  if (!overlayPattern || bars.length === 0) return [];
  const vs = overlayPattern.visual_spec;
  const pivots = vs?.pivots;
  // Guard: skip if pivots are too far from current price
  if (pivots && pivots.length > 0) {
    const latestClose = bars[bars.length - 1].c;
    const maxDist = 0.5; // 50%
    const allClose = pivots.every(p =>
      Math.abs((p.price - latestClose) / latestClose) <= maxDist
    );
    if (!allClose) return [];
  }
  // ... derive overlay as before
}, [overlayPattern, bars]);
```

This is a minimal, targeted fix that follows the exact same patterns already established in the codebase for indicators and trade plan lines.

