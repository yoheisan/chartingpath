

## Diagnosis: Why Zero A-Grade Patterns Have Ever Been Detected

### Root Causes (3 compounding barriers)

**1. The Weighted Score Ceiling Is Too Low**

The 12-factor model produces a weighted sum where each factor scores 0–10 and carries a weight (totaling ~100%). The theoretical maximum is 10.0, but in practice:

- **MTF Confirmation** is almost always missing (−0.5 penalty), because the multi-timeframe check rarely fires for live scans.
- **Volume data** is unavailable for FX/Crypto (2 factors stuck at ~5.0 neutral, contributing ~17% of weight at mediocre scores).
- **Session Quality** returns 6.5 ("exempt") for 24h markets and rarely exceeds 7.0 for stocks.
- **Pattern Maturity** gives 4.0 ("freshly broken") for most new detections.

In practice, even a perfect-looking pattern maxes out around **6.5–7.2** on `finalScore`. The A-grade threshold is **7.5**.

**2. The Repeatability Gate Is a Double Lock**

Even if a pattern somehow scored ≥7.5, line 1054–1057 requires:
- Historical sample size ≥ 20–30 (depending on asset class)
- Win rate ≥ 50–55%
- Positive expectancy (R > 0)

If ANY of these conditions fail, the grade is **forcibly downgraded to B**. And line 1070 adds: if NO historical proof data is passed at all, grades A and B are **capped at C**.

So a pattern needs to both (a) score ≥7.5 on form AND (b) have strong historical proof — two independent high bars.

**3. Historical Performance Data Often Missing at Scoring Time**

The `historicalPerformance` input relies on `pattern_hit_rates` data being available for the exact pattern+instrument combination. For many instruments (especially newly scanned ones), this data doesn't exist yet, triggering the "No historical proof — capped at C" rule (line 1070).

### Summary: It's a Triple Gate

```text
Raw Score ≥ 7.5?  ──NO──> Max B (or lower)
       │ YES
Has proof data?   ──NO──> Capped at C
       │ YES  
Proof strong enough? ─NO─> Downgraded to B
       │ YES
       └── A grade ✅
```

Each gate alone would be hard to pass. Together, they make A-grade statistically impossible with current calibration.

---

### Proposed Fix: Recalibrate to Make A-Grade Rare but Achievable (~3–5%)

1. **Lower A-grade threshold from 7.5 → 7.0** on `finalScore` — this alone would promote ~100–200 of the current 2,121 B-grade patterns to A.

2. **Soften the MTF penalty**: Change the "no MTF" penalty from −0.5 → −0.2 (most patterns lack MTF data through no fault of their own).

3. **Relax Repeatability Gate for A**: Lower `aWinRate` thresholds by 3–5% per asset class (e.g., stocks from 55% → 50%), and reduce `aMinSample` (e.g., 20 → 15 for stocks). The gate should filter bad patterns, not block all of them.

4. **Ensure historical data is passed**: Verify the scan pipeline always queries `pattern_hit_rates` before scoring, so the "no proof = cap at C" rule doesn't trigger unnecessarily.

### Files to Modify

- `supabase/functions/_shared/patternQualityScorer.ts` — Threshold adjustments (lines 1037, 1030–1031, 68–75)
- Redeploy all edge functions that import this shared scorer (`scan-live-patterns`, `score-pattern-quality`, etc.)

