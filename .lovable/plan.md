

# Backtesting Multi-Agent Orchestration for Portfolio Management

## Current State

The BacktesterV2 engine already supports three modes that map well to this use case:

| Mode | Class | Multi-Asset | Current Use |
|------|-------|-------------|-------------|
| `single` | `SingleCrossTriggerStrategy` | No | Single instrument threshold trading |
| `pair` | `PairZScoreStrategy` | 2 assets | Statistical arbitrage |
| `basket` | `EqualWeightDCAPolicy` | N assets | DCA + rebalancing |

The engine has a clean architecture: `Strategy/Policy` → `SignalSet` → `ExecutionEngine` → `Portfolio`. The `Portfolio` class already tracks multi-asset positions, weights, exposures, and P&L. The `basket` mode with `EqualWeightDCAPolicy` already handles N-asset rebalancing with drift thresholds.

**The gap**: There is no strategy/policy that maps agent-scored verdicts into trading signals. The existing strategies use technical indicators (thresholds, z-scores), not composite decision scores.

---

## Plan: Agent-Orchestrated Portfolio Strategy

### 1. New strategy: `AgentOrchestratedPolicy` (`engine/backtester-v2/policies/AgentOrchestrated.ts`)

A new policy class that replaces indicator-based logic with the multi-agent scoring pipeline. For each date and each symbol in the portfolio:

- **Analyst sub-agent**: Reads from pre-computed `pattern_hit_rates` data (win probability, expectancy) passed as a config lookup table
- **Risk sub-agent**: Computes ATR-based stop loss from price history, Kelly-fraction sizing, validates R:R
- **Timing sub-agent**: Checks a pre-loaded economic events calendar for high-impact events within N bars
- **Portfolio sub-agent**: Checks current weights, concentration, directional heat

Each sub-agent returns a 0-25 score. The composite (0-100) determines the signal:
- **>=70 (TAKE)**: Generate BUY signal with Kelly-sized position
- **50-69 (WATCH)**: No action
- **<50 (SKIP)**: Generate CLOSE signal if position exists

The policy implements the same `generateSignals(date, prices, portfolioValue, currentWeights)` interface as `EqualWeightDCAPolicy`, so it plugs directly into `BacktesterV2.runBasket()`.

### 2. New backtest mode config: `AgentBacktestConfig`

```typescript
interface AgentBacktestConfig extends BacktestConfig {
  mode: "agent";
  policy: AgentOrchestratedParams;
}
```

Where `AgentOrchestratedParams` includes:
- `symbols: string[]` — the portfolio universe
- `agentWeights: { analyst, risk, timing, portfolio }` — user-overridable weights (default 25 each)
- `agentThresholds` — per-agent tunable parameters (min R:R, Kelly cap, drift threshold, etc.)
- `verdictCutoffs: { take: 70, watch: 50 }` — user-overridable
- `rebalanceFrequency` — how often the orchestrator re-evaluates
- `patternStats` — pre-loaded lookup of symbol-level hit rates/expectancy (from `pattern_hit_rates` or `instrument_pattern_stats_mv`)
- `economicEvents` — pre-loaded calendar events for the backtest period

### 3. Add `runAgent()` to `BacktesterV2`

A new method mirroring `runBasket()` but using `AgentOrchestratedPolicy`. It outputs the standard `BacktestResult` plus additional metadata:
- `agentScores`: Per-date, per-symbol breakdown of each agent's score
- `verdicts`: Array of `{ date, symbol, verdict, compositeScore }` for auditability

### 4. Extend `BacktesterV2Adapter` for UI integration

Add an `runAgentBacktest()` method that:
- Pre-loads `pattern_hit_rates` data for the selected symbols from Supabase
- Pre-loads `economic_events` for the date range
- Converts these into the lookup tables the policy expects
- Calls `backtester.runAgent(config)`
- Returns `V2BacktestResult` with agent score metadata attached

### 5. UI: Agent Backtest tab in Strategy Workspace

A new section in the workspace that lets users:
- Select a basket of symbols (multi-asset)
- Adjust agent weights via sliders (or pick a preset: Conservative, Balanced, Aggressive)
- Set verdict cutoffs
- Run the backtest and see equity curve, drawdown, per-trade agent score breakdown

---

## Why This Works with Existing Infrastructure

- **Portfolio class** already handles N-asset positions, weights, exposures — no changes needed
- **ExecutionEngine** already handles multi-symbol `SignalSet` with slippage/cost — no changes needed
- **Metrics** (`calculateMetrics`) already work on any equity curve — no changes needed
- **PriceProvider** already loads multi-symbol EOD data — no changes needed
- The agent scoring is **pure math** (no LLM calls), so backtests run at the same speed as existing modes

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `engine/backtester-v2/policies/AgentOrchestrated.ts` |
| Create | `engine/backtester-v2/agents/AnalystAgent.ts` |
| Create | `engine/backtester-v2/agents/RiskAgent.ts` |
| Create | `engine/backtester-v2/agents/TimingAgent.ts` |
| Create | `engine/backtester-v2/agents/PortfolioAgent.ts` |
| Modify | `engine/backtester-v2/backtest.ts` — add `AgentBacktestConfig` + `runAgent()` |
| Modify | `src/adapters/backtesterV2.ts` — add `runAgentBacktest()` |
| Create | UI component for agent backtest configuration and results |

