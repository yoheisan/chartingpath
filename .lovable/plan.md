

# Pattern Shape Overlay (Blue Zigzag Line)

## What You'll See

For a Head & Shoulders pattern, the blue line will trace:

```text
    Left Shoulder ------- Head ------- Right Shoulder
         \               / \               /
          \             /   \             /
           \           /     \           /
            ----------        -----------
                    Neckline
```

The 4 pivot points (Left Shoulder, Head, Right Shoulder, Neckline) are already detected and stored. We just need to draw a line connecting them.

## Changes

### 1. `src/components/charts/chartConstants.ts`
Add one constant:
- `PATTERN_SHAPE_COLOR: '#3b82f6'` (blue)

### 2. `src/components/charts/FullChartViewer.tsx`
After the existing pivot arrow markers section, add a `LineSeries` that:
- Takes `visualSpec.pivots` array
- Maps each pivot to `{ time, value: pivot.price }` (using the same time-snapping logic already used for pivot markers)
- Renders as a blue line (width 2, no price label)
- Pivots are sorted by time before rendering

### 3. `src/components/charts/FullChartPlaybackView.tsx`
Same change — add a blue `LineSeries` connecting pivots during playback mode. Only show pivots that are within the currently visible bars (so the shape builds progressively during playback).

### 4. No backend changes needed
The H&S detector already returns pivot data with labels (`Left Shoulder`, `Head`, `Right Shoulder`, `Neckline`). All 17 pattern detectors return pivots in the same format. The blue line will work for every pattern type automatically.

## Technical Notes
- The `LineSeries` uses the main price scale (same as candles), so no extra pane is needed
- Existing arrow markers with labels are kept — the line just connects the dots visually
- For playback mode, pivots are filtered to only show those within `visibleBars` so the shape reveals progressively
