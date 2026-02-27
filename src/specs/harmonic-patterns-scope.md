# Harmonic Patterns — Implementation Scope

> **Status:** Planned (not yet implemented)
> **Priority:** High — next detection paradigm after classical patterns
> **Estimated complexity:** High

---

## 1. Patterns in Scope

| Pattern   | XA→B Ratio     | BC→D Ratio     | D Completion (of XA) | Key Trait                        |
|-----------|----------------|----------------|----------------------|----------------------------------|
| Gartley   | 0.618          | 1.272–1.618    | 0.786                | Most common, moderate RR         |
| Bat       | 0.382–0.500    | 1.618–2.618    | 0.886                | Deep D retracement, tight SL     |
| Butterfly | 0.786          | 1.618–2.618    | 1.272–1.414 (ext)    | D extends beyond X               |
| Crab      | 0.382–0.618    | 2.240–3.618    | 1.618 (ext)          | Extreme D extension, high RR     |

### Ratio Tolerance
- Primary ratios: ±2% tolerance (e.g., 0.618 accepts 0.606–0.630)
- Secondary ratios: ±5% tolerance
- Ratio precision feeds directly into quality score

---

## 2. Detection Methodology

### How it differs from the current engine
The existing 15-pattern engine uses **structural pivot detection** with close-based confirmation (breakout above/below a level). Harmonics require:

1. **XABCD leg identification** — five pivot points forming a specific geometric shape
2. **Fibonacci ratio measurement** between each leg pair
3. **Projected D-point** — the pattern is actionable BEFORE D completes (anticipatory entry)

### Algorithm Outline

```
1. Identify zigzag pivots (reuse existing pivot infrastructure)
2. For each sequence of 4 pivots (X, A, B, C):
   a. Calculate XA→B ratio: (B - A) / (A - X)
   b. For each harmonic template, check if XA→B ratio matches
   c. If match: project D-point using the template's D-completion ratio
   d. Calculate BC→D ratio to validate
   e. Score the completion quality
3. If price is approaching projected D: emit signal
4. If price has reached D and reversed: confirm signal
```

### Pivot Reuse
The existing `ZigZagPivot` infrastructure in `VisualSpec.ts` provides the foundation. Harmonic detection layers on top by measuring ratios between consecutive pivots.

---

## 3. Entry Logic

### Primary: Limit Order at Projected D-Point
- Calculate D-point price from Fibonacci projection
- Entry = limit order at D (or D ± buffer based on ATR)
- This is fundamentally different from current close-based breakout entries

### Optional: Close-Confirmation Filter
- Wait for a close-based reversal candle at D (hammer, engulfing, etc.)
- Reduces false signals but delays entry and worsens RR
- Configurable per user preference

### Stop Loss
- **Bullish patterns:** SL below X (Gartley/Bat) or below D-extension (Butterfly/Crab)
- **Bearish patterns:** SL above X or above D-extension
- SL distance is inherently tighter than classical patterns (advantage of harmonics)

### Take Profit
- TP1: 0.382 retracement of AD leg
- TP2: 0.618 retracement of AD leg
- TP3: Full A-point retest
- Multiple TP levels align with existing `tradePlan` structure

---

## 4. Required Infrastructure

### Backend (Edge Functions)

#### New file: `supabase/functions/_shared/harmonicDetectors.ts`
- `detectGartley(pivots: ZigZagPivot[]): HarmonicResult`
- `detectBat(pivots: ZigZagPivot[]): HarmonicResult`
- `detectButterfly(pivots: ZigZagPivot[]): HarmonicResult`
- `detectCrab(pivots: ZigZagPivot[]): HarmonicResult`
- Shared helper: `measureFibRatio(legStart, legEnd, referenceStart, referenceEnd)`
- Shared helper: `projectDPoint(X, A, B, C, template)`

#### Integration: `supabase/functions/scan-live-patterns/index.ts`
- Add harmonic scan pass after classical pattern scan
- Harmonic scan runs on same bar data but uses different pivot window (needs more history — ~100 bars vs current ~60)
- Results merge into same `live_pattern_detections` table

### Database

#### New columns on `live_pattern_detections`:
- `harmonic_type`: enum ('gartley', 'bat', 'butterfly', 'crab') — nullable
- `xabcd_coordinates`: JSONB — `{ X: {price, ts}, A: {price, ts}, B: {price, ts}, C: {price, ts}, D: {price, ts} }`
- `fib_ratios`: JSONB — `{ xab: 0.618, bcd: 1.272, xad: 0.786 }`
- `d_projected_price`: numeric — projected D-point for pending patterns
- `d_completion_status`: enum ('approaching', 'completed', 'invalidated')

#### New columns on `historical_pattern_occurrences`:
- Same harmonic-specific columns for backtesting harmonic hit rates

### Frontend

#### VisualSpec extensions (`src/types/VisualSpec.ts`):
```typescript
export interface HarmonicOverlay {
  type: 'harmonic';
  id: string;
  harmonicType: 'gartley' | 'bat' | 'butterfly' | 'crab';
  points: {
    X: { price: number; timestamp: string };
    A: { price: number; timestamp: string };
    B: { price: number; timestamp: string };
    C: { price: number; timestamp: string };
    D: { price: number; timestamp: string };  // projected or actual
  };
  fibRatios: { xab: number; bcd: number; xad: number };
  dStatus: 'approaching' | 'completed' | 'invalidated';
  style: 'primary' | 'muted';
}
```
- Add `HarmonicOverlay` to the `Overlay` union type

#### SVG Renderer (`src/components/PrescriptivePatternSVG.tsx`):
- New rendering path for XABCD shapes
- Draw lines connecting X→A→B→C→D with labeled pivots
- Optional: shaded PRZ (Potential Reversal Zone) around projected D
- Fib ratio labels on each leg

#### Screener types (`src/types/screener.ts`):
- `LiveSetup.harmonicType` optional field
- `LiveSetup.dProjectedPrice` optional field

---

## 5. Quality Scoring

Harmonic quality score (0–10) based on:

| Factor              | Weight | Description                                                |
|---------------------|--------|------------------------------------------------------------|
| Ratio precision     | 35%    | How close each ratio is to the ideal (within tolerance)    |
| Volume at D         | 20%    | Volume spike at D-point suggests institutional interest    |
| Trend alignment     | 15%    | Pattern direction aligns with higher-timeframe trend       |
| Pattern symmetry    | 15%    | Time symmetry between AB and CD legs                       |
| PRZ confluence      | 15%    | Multiple Fib levels converging at D (e.g., XA 0.886 + BC ext 2.618) |

---

## 6. Asset & Timeframe Suitability

| Asset Class  | Recommended TFs | Notes                                    |
|-------------|-----------------|------------------------------------------|
| Forex       | 1H, 4H, 1D     | Best suited — clean Fib reactions         |
| Stocks      | 4H, 1D         | Good on liquid large-caps                 |
| Crypto      | 4H, 1D         | Higher noise, wider tolerances needed     |
| Commodities | 1D              | Works on Gold, Oil                        |
| Indices     | 4H, 1D         | Solid on SPX, NQ                          |

**Not recommended:** 5M, 15M — too much noise for reliable Fib measurements.

---

## 7. Implementation Order

1. **Phase 1:** `harmonicDetectors.ts` with Gartley + Bat (most common, well-defined ratios)
2. **Phase 2:** Butterfly + Crab (extensions beyond X, more complex SL logic)
3. **Phase 3:** SVG renderer for XABCD visualization
4. **Phase 4:** Quality scoring and screener integration
5. **Phase 5:** Historical backtesting and hit rate computation

---

## 8. Files That Will Need Modification

| File | Change Type |
|------|-------------|
| `supabase/functions/_shared/harmonicDetectors.ts` | **New file** — detection logic |
| `supabase/functions/scan-live-patterns/index.ts` | Add harmonic scan pass |
| `src/types/VisualSpec.ts` | Add `HarmonicOverlay` to Overlay union |
| `src/types/screener.ts` | Add optional harmonic fields to `LiveSetup` |
| `src/components/PrescriptivePatternSVG.tsx` | Add XABCD rendering path |
| DB migration | Add harmonic columns to detection tables |
