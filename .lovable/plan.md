

## Diagnosis: Why Zero Trades Are Being Executed

### The Root Cause — Scale Mismatch in Both `scan-setups` AND `evaluate-gate`

The agent scoring system produces **raw scores on a 0–1 scale** (e.g., `analyst_raw = 0.72`). The composite is a weighted average of these, so the composite is also **0–1** (e.g., `0.58`).

However, the **cutoff thresholds** (`take_cutoff`, `watch_cutoff`) default to **70 and 40 on a 0–100 scale**:

```text
Score:     0.58  (0–1 scale)
Cutoff:   70     (0–100 scale)

0.58 >= 70?  → NO  → verdict = "WATCH" or "SKIP"
```

**No score on a 0–1 scale will EVER reach 70.** Therefore `agentVerdict` is always `"WATCH"` or `"SKIP"`, which maps to `gateResult = "partial"` or `"conflict"`. The auto-trade engine (`scan-setups`) only opens trades when `gateResult === "aligned"` — so **zero trades are ever opened**.

This bug exists in **two places**:

| File | Line | Problem |
|------|------|---------|
| `supabase/functions/scan-setups/index.ts` | 167–172 | Compares 0–1 composite against 70/40 cutoffs |
| `supabase/functions/evaluate-gate/index.ts` | 109–118 | Same comparison |

The client-side `useScanningCandidates.ts` was already fixed (lines 146–148 use 0.70/0.40), but the **server-side functions that actually execute trades were not**.

### Additional Issue: `partial` Never Trades

Even if scores were correct, only `"aligned"` triggers a trade. A broad plan with no rule violations but a score of, say, 65 (which is objectively good) would be `"partial"` and never trade. This is overly conservative for a paper trading system.

---

## Plan

### 1. Fix scale mismatch in `scan-setups/index.ts`
- Convert the composite score to 0–100 **before** comparing to cutoffs: `agentScore = composite * 100`
- OR convert cutoffs to 0–1: `takeCutoff / 100`
- **Recommendation**: multiply composite by 100 to align with the settings UI which shows 0–100

### 2. Fix scale mismatch in `evaluate-gate/index.ts`
- Same fix: scale composite to 0–100 before comparing to `takeCutoff` / `watchCutoff`

### 3. Allow `partial` gate results to auto-trade (with attribution)
- Currently only `"aligned"` opens trades. For a paper trading system, `"partial"` should also trade but with `attribution: "ai_partial"` so the user can compare performance
- This makes the system commercially viable — users with broad plans will see activity

### 4. Deploy both edge functions

### Technical detail

In both `scan-setups/index.ts` and `evaluate-gate/index.ts`, the fix is a single line change:

```ts
// BEFORE (broken):
agentScore = Math.round(composite * 100) / 100;  // e.g. 0.58

// AFTER (fixed):
agentScore = Math.round(composite * 10000) / 100; // e.g. 58.00
```

This scales the 0–1 composite to 0–100, matching the cutoff thresholds (70/40).

