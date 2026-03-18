

## Issue #2: Lack of Historical Performance Data — Deep Dive

### What's happening

The problem has **three layers**:

**Layer 1 — The Analyst Agent returns 0 for data-poor instruments**

In `score-agent-detections/index.ts`, the `scoreAnalyst()` function returns `raw: 0` when `sampleSize < 5`. For instruments with 5–29 samples, it scores but with a halved confidence component (`* 0.5`). This means:

- **<5 trades**: Analyst score = **0%** (drags composite down heavily)
- **5–29 trades**: Analyst score is suppressed by ~20% vs. identical stats at 30+ trades
- **30+ trades**: Full scoring

Since the Analyst agent typically carries 30–40% weight in the composite, a zero Analyst score can push an otherwise decent signal below the SKIP threshold.

**Layer 2 — `historical_performance` is often NULL on live detections**

The `scan-live-patterns` pipeline tries to enrich each detection with per-symbol stats from `historical_pattern_occurrences`. When a pattern/symbol/timeframe combo has zero resolved trades, the field stays `null`. The scoring pipeline then reads `sampleSize = 0` → Analyst = 0.

There IS a cross-timeframe fallback (`fetchCrossTimeframeFallback`) and a pattern-level aggregate fallback, but these only populate `historical_performance` on the screener response — they don't always persist back to the DB row that `score-agent-detections` later reads.

**Layer 3 — The Proof Gate creates a binary cliff**

The `is_proven` flag (`sampleSize >= 15 AND winRate >= 45%`) splits signals into "scored" and "UNPROVEN". UNPROVEN signals show "—" for Analyst and Composite columns. This is intentional for integrity, but for instruments where aggregate pattern stats exist (just not per-symbol), the signal appears data-less when it isn't.

### Where it surfaces in the UI

1. **Agent Scoring table** (`TradeOpportunityTable.tsx`): UNPROVEN badge, Analyst column shows "—"
2. **Copilot ScoreExplanationCard**: Analyst bar shows 0%
3. **Copilot text responses**: "Analyst score: 0 due to lack of historical data"

### What's already mitigated

- Cross-timeframe fallback in `scan-live-patterns` (1h→4h→8h→1d→1wk)
- Pattern-level aggregate fallback (all symbols pooled)
- Grading engine caps data-poor patterns at C-grade
- `pattern-confidence-scorer` uses Bayesian prior (assumes 50% win rate with virtual 10-sample prior)

### Proposed Fix (3 parts)

**Part A — Fallback Analyst scoring in `score-agent-detections`**

When `historical_performance` on the detection is null or has sampleSize < 5:
1. Query `historical_pattern_occurrences` for the same `pattern_id` across ALL symbols (pattern-level aggregate)
2. If that also has <5 trades, use the Bayesian prior from `pattern-confidence-scorer` (50% win rate, 0R expectancy) → produces a neutral ~0.40 raw instead of 0
3. Tag `analyst_details` with `{ source: "pattern_aggregate" }` or `{ source: "bayesian_prior" }` for transparency

**Part B — Persist enriched stats back to detection rows**

Ensure the cross-timeframe fallback stats from `scan-live-patterns` are always written back to `live_pattern_detections.historical_performance`, so the background scorer reads them (currently some fallback results are only returned in the API response but not persisted).

**Part C — UI: Replace "0" with contextual messaging**

In the `TradeOpportunityTable` and `ScoreExplanationCard`:
- When Analyst source is `"pattern_aggregate"` or `"bayesian_prior"`, show a subtle indicator (e.g., "~48% est." with a tooltip: "Based on pattern-level aggregate, not per-instrument data")
- Keep the UNPROVEN badge for truly unproven signals (<15 trades AND no aggregate), but add an "Estimated" tier between UNPROVEN and fully proven

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/score-agent-detections/index.ts` | Add pattern-aggregate lookup + Bayesian fallback in `scoreAnalyst` |
| `supabase/functions/scan-live-patterns/index.ts` | Ensure cross-TF fallback stats persist to DB |
| `src/components/agent-backtest/TradeOpportunityTable.tsx` | Show "estimated" indicator for aggregate-sourced scores |
| `src/components/copilot/CopilotRichMessage.tsx` | Surface data source in ScoreExplanationCard |

