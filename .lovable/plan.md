

# Fix Pattern Detection Imbalance in Historical Seeder

## Problem
The `historical_pattern_occurrences` table shows extreme detection skew:

| Pattern | Resolved Trades | Issue |
|---------|----------------|-------|
| Donchian Short | 123,442 | Massively over-represented |
| Donchian Long | 1,219 | 100x fewer than Short — asymmetric |
| Ascending Triangle | 610 | Low |
| Descending Triangle | 95 | Very low |
| Cup & Handle | 47 | Nearly zero |
| Bull Flag | 17 | Nearly zero |
| Bear Flag | 2 | Nearly zero |

Meanwhile Triple Top (60k), Symmetrical Triangle (55k), Rising/Falling Wedge (41-45k) detect prolifically.

## Root Cause Analysis

All issues are in `supabase/functions/seed-historical-patterns-mtf/index.ts` detector functions:

### 1. Bull Flag / Bear Flag (lines 593-673) — Hardcoded bar indices
The detector demands the pole occupy **exactly bars 0-7** and the flag **exactly bars 8-17** within a 25-bar window. A 5% pole gain must occur in precisely 8 bars. The flag consolidation range is capped at 4%. This is far too rigid — real flags form at varying proportions.

### 2. Cup & Handle (lines 675-740) — Rigid proportional slicing
Cup ends at 70% of window, handle starts at 75%. With a default 25-bar lookback (40 for daily), the cup must form in ~17-28 bars. The 5% prior uptrend requirement is fine per Bulkowski, but the fixed slice points miss cups that form at different proportions.

### 3. Descending Triangle (lines 373-419) — Overly strict falling-high counter
The falling-high counter penalizes any bar where `recentHighs[i] > recentHighs[i-1] * 1.005` by decrementing. In choppy markets this kills detection. Ascending Triangle (610 detections) has the same structure but rising lows are more common in uptrends, explaining the 6x gap.

### 4. Donchian Long vs Short asymmetry (lines 509-591)
Both use identical ADX > 20 filter and identical threshold logic (1.001 / 0.999). The asymmetry is likely market-structural (bearish breakdowns are more common), but the Long threshold of `> recentHigh * 1.001` combined with the ADX check may be slightly stricter in trending-up contexts. This needs verification but is likely acceptable as-is.

## Implementation Plan

### File: `supabase/functions/seed-historical-patterns-mtf/index.ts`

**A. Rewrite Bull Flag detector (lines 593-632)**
- Use proportional pole/flag sizing instead of fixed bar indices:
  - Pole: first 30-50% of window (scan for strongest consecutive up-move)
  - Flag: next 20-40% of window after pole peak
- Reduce min pole gain from 5% → 3% (Bulkowski minimum)
- Widen flag consolidation range from 4% → 6%
- Reduce breakout threshold from 0.5% → 0.2%
- Keep retracement < 50% filter (Bulkowski standard)

**B. Rewrite Bear Flag detector (lines 634-673)**
- Mirror the Bull Flag changes for short direction

**C. Relax Cup & Handle detector (lines 675-740)**
- Use dynamic cup-end scanning instead of fixed 70% slice: find the deepest trough, then identify rims on either side
- Keep Bulkowski thresholds (5% prior trend, 7-40% cup depth, 3-60% handle)
- This structural change alone should significantly increase detections

**D. Relax Descending Triangle detector (lines 373-419)**
- Remove the penalty decrement for rising highs (line 400: `fallingHighCount--`)
- Just require net 2+ falling highs without penalizing noise bars
- Match the Ascending Triangle logic symmetry

**E. No changes to Donchian detectors**
- The Long/Short gap is market-structural (more downside breaks than upside). Both use identical logic. No code change needed.

### Post-deployment: Re-seed affected patterns

After deploying the updated detectors, run a targeted re-seed for the 5 underperforming patterns only:
```
POST seed-historical-patterns-mtf
{
  "patterns": ["bull-flag", "bear-flag", "cup-and-handle", "descending-triangle", "ascending-triangle"],
  "forceFullBackfill": true,
  "timeframe": "1d"
}
```
Repeat for each timeframe (1h, 4h, 8h, 1wk).

## Files Modified
| File | Change |
|------|--------|
| `supabase/functions/seed-historical-patterns-mtf/index.ts` | Rewrite Bull Flag, Bear Flag, Cup & Handle, Descending Triangle detectors |

## Scope
- Backend edge function only — no frontend changes
- No schema changes
- Existing high-volume patterns (Donchian Short, Triple Top, etc.) are untouched
- Quality scoring and grading pipeline remain unchanged

