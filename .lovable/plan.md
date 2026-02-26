

# Make Share Chart Images More Prescriptive About Pattern Location

## Problem
The current share image (both `generate-share-image` and `pre-generate-pattern-images`) renders candlesticks with Entry/SL/TP horizontal lines, but gives **zero visual indication of where the actual pattern formation is happening** on the chart. Users can't tell at a glance what the pattern looks like or where it occurred.

## Key Insight
The data already exists. Every detection stores a `visual_spec` with:
- **ZigZag pivots** — the exact swing points (high/low, bar index, price) that define the pattern shape
- **Bar data** with indices that map to the pivot locations

The SVG renderer simply never uses this data.

## Plan

### 1. Pass visual_spec pivots into the SVG renderer
Both edge functions (`generate-share-image` and `pre-generate-pattern-images`) will extract `visual_spec.pivots` from the detection record and pass them into `renderCandlestickSVG` as a new `pivots` parameter.

### 2. Draw the ZigZag pattern line on the chart
Add SVG rendering logic to connect the pivot points with a distinctive polyline:
- **Color**: Semi-transparent cyan/blue (`#38bdf8`, opacity 0.7) to contrast with the red/green candles
- **Style**: 2px solid line connecting each pivot in sequence (high-to-low-to-high zigzag)
- **Circles**: Small dots at each pivot point for emphasis

### 3. Highlight the pattern formation zone
Add a subtle vertical shaded region covering only the bars where the pattern formed (from the first pivot's bar index to the last pivot's bar index):
- **Fill**: Very subtle gradient (`#38bdf8` at 0.06 opacity) behind the pattern bars
- **Label**: Small "PATTERN" text label at the top of the highlighted zone

### 4. Add a signal arrow marker
Place a directional arrow (up for bullish, down for bearish) at the signal/breakout bar to clearly mark where the trade triggers:
- Positioned at the last bar (entry point)
- Colored to match direction (green up arrow / red down arrow)

### 5. Keep both edge functions in sync
Apply the same rendering changes to both `generate-share-image/index.ts` and `pre-generate-pattern-images/index.ts` since they share the same SVG logic.

## Technical Details

### Modified files
- `supabase/functions/generate-share-image/index.ts` — add pivot rendering + pattern zone highlight
- `supabase/functions/pre-generate-pattern-images/index.ts` — same changes (shared renderer)

### Rendering additions (inside `renderCandlestickSVG`)

```text
New parameters:
  pivots?: Array<{ index: number; price: number; type: 'high' | 'low' }>

New SVG layers (rendered between candles and level lines):
  1. Pattern zone background  — rect from first pivot X to last pivot X
  2. ZigZag polyline          — line connecting all pivots
  3. Pivot dots               — filled circles at each pivot
  4. Signal arrow             — triangle at last bar
```

### Data flow
```text
detection.visual_spec.pivots  -->  parsePivots()  -->  renderCandlestickSVG({ pivots })
                                                          |
                                                          +--> Pattern zone rect
                                                          +--> ZigZag polyline SVG
                                                          +--> Pivot circle markers
                                                          +--> Signal arrow marker
```

### Fallback
If `pivots` is empty or missing (older detections), the chart renders exactly as it does today — no regression.

