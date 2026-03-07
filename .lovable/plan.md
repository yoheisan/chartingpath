

## Add Kelly Criterion Deep-Dive Section to FAQ

**What**: Insert a new dedicated "Kelly Criterion — Why It Matters" section into `AgentWeightsFAQ.tsx`, placed between the existing "The Four Agents" section and "Verdict Labels" section (around line 160). This section will explain:

1. **The formula** — `K = winRate − (1 − winRate) / R:R` with a brief plain-English interpretation
2. **Why it's used at the scoring stage** — it acts as a mathematical edge filter: if Kelly ≤ 0, the setup has no statistical edge regardless of how good the pattern looks, contributing 0 of 7 possible points to the Risk Agent
3. **The 25% cap** — prevents over-betting even when the formula suggests larger sizing; a Kelly of 25%+ earns the full 7 points, lower values scale linearly
4. **Practical examples** — a small table or list showing 2–3 scenarios (e.g., 60% win rate + 2:1 R:R = 10% Kelly → 4 pts; 50% win rate + 1.5 R:R = 16.7% Kelly → 4.7 pts; 40% win rate + 1.5 R:R = negative Kelly → 0 pts)
5. **Key takeaway** — Kelly ensures only setups with a genuine mathematical edge contribute to a passing Risk score, filtering out "looks good but doesn't pay" patterns

**File changed**: `src/components/agent-backtest/AgentWeightsFAQ.tsx` only — new `<section>` block with a styled info box, formula display, and example scenarios.

