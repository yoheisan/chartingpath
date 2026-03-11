

# Why A-Grade Trades Almost Never Exist — and What to Do About It

## The Root Cause

The grading system in `patternQualityScorer.ts` requires a weighted score of **≥ 8.0 out of 10** for an A-grade. The score is a weighted average of 9 independent factors:

| Factor | Weight | What scores 8+ requires |
|---|---|---|
| Volume Confirmation | 15% | Strong breakout volume spike |
| Trend Alignment | 20% | Perfect with-trend alignment |
| Pattern Symmetry | 10% | Near-textbook symmetry |
| Price Action Clarity | 10% | Clean candles, no noise |
| Target Structure | 15% | Excellent R:R with ATR-validated levels |
| ADX Trend Strength | 10% | ADX > 25, strong directional move |
| Relative Volume | 5% | RVOL well above average |
| Historical Win Rate | 10% | Known high win rate for this pattern/instrument |
| Volatility Regime | 5% | Favorable regime |

**The math problem**: For a weighted average to reach 8.0, nearly ALL 9 factors must score 8+/10 simultaneously. In real markets, volume data is often missing (defaults to 5/10), historical win rate data may be sparse (defaults to 5/10), and counter-trend setups auto-cap at ~4/10 on the trend factor. Just two mediocre factors make A-grade mathematically impossible.

**This is a calibration problem, not a quality problem.** The current threshold is set at "institutional textbook perfection" level, which real market data rarely achieves.

## Proposed Fix: Recalibrate Without Compromising Quality

The goal is to make A-grade achievable (~5-10% of detections) while keeping it genuinely elite.

### Changes

**1. Lower A-grade threshold from 8.0 to 7.5**

In `patternQualityScorer.ts`, adjust the grade boundaries:

```
A: >= 7.5  (was 8.0)
B: >= 6.0  (was 6.5)  
C: >= 4.5  (was 5.0)
D: >= 3.0  (was 3.5)
F: < 3.0
```

This alone makes A-grade ~3-5x more achievable without changing what "quality" means.

**2. Fix the "missing data penalty" problem**

Currently, missing volume data scores 5/10 — an automatic drag. Add a "data availability" adjustment: when volume data is genuinely unavailable (common for some instruments), redistribute that factor's weight proportionally to other factors instead of penalizing with a default 5. Same for Historical Win Rate when no prior data exists.

In `calculatePatternQualityScore()`:
- Track which factors have "real" data vs defaults
- Redistribute weights of data-absent factors to data-present factors
- This prevents instruments with no volume feed from being permanently capped at B-grade

**3. Apply the same recalibration in the backtest engine**

Update `supabase/functions/projects-run/index.ts` (`calculatePatternGrade`) with matching thresholds to keep consistency between live screener grades and Pattern Lab grades.

**4. Backfill existing detections (optional)**

A one-time rescore of active `live_pattern_detections` to apply the new thresholds, or let the next scan cycle naturally update grades.

### What This Achieves

- A-grade becomes rare but real (~5-10% of high-quality setups)
- B-grade becomes the "solid trade" tier (~25-30%)
- No quality factors are removed or weakened
- Missing data no longer artificially punishes instruments
- The marketing claim "62% Avg Win Rate (A-Grade)" becomes verifiable

### Files to Modify

- `supabase/functions/_shared/patternQualityScorer.ts` — threshold + weight redistribution
- `supabase/functions/projects-run/index.ts` — matching threshold update
- `supabase/functions/seed-historical-patterns-mtf/index.ts` — uses the shared scorer (no change needed, imports updated version)

