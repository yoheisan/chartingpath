

## Strategic Analysis: Strategy Workspace vs Pattern Lab Redundancy

### The Problem

You have **two separate pages** that ask users to do fundamentally the same thing:

```text
Pick instrument → Pick pattern → Pick timeframe → Run backtest → View results

Strategy Builder (/strategy-workspace)     Pattern Lab (/projects/pattern-lab/new)
├── Asset & Timeframe selector              ├── Asset class + instrument selector
├── Pattern library                         ├── Pattern checkboxes
├── TP/SL configuration                     ├── Timeframe + lookback
├── Position sizing                         ├── Grade filter (A-F)
├── Discipline filters                      ├── Risk per trade
├── Backtest period                         ├── Credit estimation
└── → calls backtest-strategy               └── → calls projects-run
```

A new user lands on the platform and sees **three** backtest-related entry points: Strategy Builder, Agent Backtest, and Pattern Lab. They have no idea which one to use. This violates the core Apple design principle: **one obvious path to each outcome**.

### What Each Tool Actually Does (Unique Value)

| Capability | Strategy Builder | Pattern Lab | Unique to |
|---|---|---|---|
| Single instrument backtest | Yes | Yes | Neither (duplicate) |
| Multi-instrument batch | No | Yes | Pattern Lab |
| Grade quality filter | No | Yes | Pattern Lab |
| Credit-gated usage | No | Yes | Pattern Lab |
| TP/SL fine-tuning | Yes | No | Strategy Builder |
| Position management rules | Yes | No | Strategy Builder |
| Discipline filters | Yes | No | Strategy Builder |
| Validate vs Automate modes | No | Yes | Pattern Lab |
| Agent multi-scoring (weights) | Yes (separate tab) | No | Agent Backtest |
| Save/load strategies | Yes | No | Strategy Builder |
| Export to Pine Script | Yes | No | Strategy Builder |

### Recommendation: Merge into One Unified Research Hub

**Consolidate Pattern Lab as the single backtest destination.** Absorb Strategy Builder's unique features (TP/SL, position management, discipline filters) into Pattern Lab as an "Advanced" collapsible section. Keep Agent Backtest as a distinct tool since it serves a genuinely different purpose (multi-agent portfolio scoring, not pattern backtesting).

### Proposed Architecture

```text
/projects/pattern-lab/new  ← THE single backtest page
├── Mode picker: Validate | Research (renamed from Automate)
├── Core config (instrument, pattern, timeframe, lookback, grade)
├── Advanced section (collapsed by default)
│   ├── TP/SL overrides
│   ├── Position sizing
│   └── Discipline filters
├── Run Backtest → projects-run edge function
├── Results with save/export
└── "Analyze with AI Agents" CTA → opens Agent Backtest

/strategy-workspace → REMOVED (redirect to /projects/pattern-lab/new)
Agent Backtest → moved to standalone route or kept as secondary tab on Pattern Lab
```

### Implementation Plan

1. **Add Strategy Builder's advanced controls to Pattern Lab** -- Add collapsible "Advanced Strategy" section to PatternLabWizard with TP/SL, position sizing, and discipline filter controls (ported from ChartingPathStrategyBuilder).

2. **Add save/export to Pattern Lab results** -- Port the strategy save and Pine Script export functionality from StrategyWorkspaceInterface into Pattern Lab's results page.

3. **Relocate Agent Backtest** -- Move AgentBacktestPanel to its own route (`/tools/agent-scoring` or similar) or make it accessible from Pattern Lab results as a "Score with AI Agents" action.

4. **Redirect Strategy Workspace** -- Change `/strategy-workspace`, `/strategy`, `/backtest`, `/ai-builder` routes to redirect to `/projects/pattern-lab/new`. Update all internal navigation links.

5. **Remove dead code** -- Delete StrategyWorkspaceInterface, ChartingPathStrategyBuilder, GuidedStrategyBuilder, and related components no longer referenced.

### Impact

- Eliminates user confusion ("which backtest tool do I use?")
- Reduces maintenance surface (one backtest flow instead of two)
- Preserves all functionality -- nothing is lost, just consolidated
- Aligns with Apple principle: one clear path per intent

This is a significant refactor touching 15-20 files. Shall I proceed?

