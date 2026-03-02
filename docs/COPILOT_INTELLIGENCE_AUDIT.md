# Trading Copilot — Enhanced Intelligence Audit

> Last updated: 2026-03-02

## Overview

The Trading Copilot has been upgraded from a basic pattern-lookup chatbot to a **portfolio-aware, data-moat-powered research assistant** that delivers answers no generic AI (ChatGPT, Gemini) can replicate. The enhancements fall into four pillars.

---

## Pillar 1: Instrument-Specific Stats (`get_instrument_stats`)

**Problem solved**: Generic AI can only cite textbook averages ("Bull flags have ~65% win rate"). ChartingPath's Copilot now answers "How do Bull Flags perform **on AAPL specifically**?"

**Data source**: `instrument_pattern_stats_mv` (materialized view)

**Returns per symbol × pattern:**
| Field | Description |
|---|---|
| `total_trades` | Sample size for this symbol + pattern |
| `win_rate` | Win rate on this specific ticker |
| `avg_pnl_pct` | Average P&L % per trade |
| `expectancy_r` | Expectancy in R-multiples |
| `best_timeframe` | Timeframe with highest win rate |
| `last_occurrence` | Most recent detection date |

**Edge function handler**: `supabase/functions/trading-copilot/index.ts` → `get_instrument_stats` tool

---

## Pillar 2: Comparative Analysis (`compare_pattern_performance`)

**Problem solved**: Users don't know if a pattern works better or worse on their chosen ticker vs the broader market.

**Logic**:
1. Fetch instrument-specific stats from `instrument_pattern_stats_mv`
2. Fetch market-wide stats from `pattern_hit_rates`
3. Compare win rates and expectancy
4. Return verdict: **OUTPERFORMS**, **UNDERPERFORMS**, or **IN LINE** (±5% threshold)

**Output includes**:
- Instrument win rate vs market average win rate
- Instrument expectancy vs market average expectancy
- Sample size for statistical significance assessment
- Clear natural-language verdict

---

## Pillar 3: Decision Confidence Scoring (`get_decision_confidence`)

**Problem solved**: Users ask "Should I take this trade?" — previously the Copilot could only give qualitative opinions. Now it returns a **composite 0–100 score**.

**Scoring model** (100 points max):

| Factor | Weight | Source |
|---|---|---|
| Pattern Quality Grade | 25 pts | A=25, B=18, C=10 |
| Trend Alignment | 20 pts | with_trend=20, neutral=12, counter=5 |
| Historical Hit Rate | 30 pts | From `pattern_hit_rates` — scaled 0–30 |
| Sample Size | 15 pts | ≥100 trades=15, ≥50=12, ≥30=8, <30=3 |
| Risk Environment | 10 pts | Checks proximity to high-impact economic events |

**Score interpretation**:
| Range | Label | Guidance |
|---|---|---|
| 80–100 | 🟢 High Confidence | Strong setup — consider full position size |
| 60–79 | 🟡 Moderate Confidence | Decent setup — consider reduced size |
| 40–59 | 🟠 Low Confidence | Weak setup — paper trade or skip |
| 0–39 | 🔴 Very Low | Avoid — too many negatives |

---

## Pillar 4: Portfolio-Aware Context (Enhanced Context Builder)

**Problem solved**: The Copilot previously had no knowledge of the user's open positions, leading to advice that could increase concentration risk or conflict with existing trades.

**Pre-fetched context** (injected into every Gemini call for authenticated users):

| Data | Source Table | Purpose |
|---|---|---|
| Watchlist symbols | `watchlists` + `watchlist_items` | Know what the user is tracking |
| Open paper trades | `paper_trades` | Detect concentration/directional risk |
| Portfolio P&L | `paper_portfolios` | Factor in current exposure |
| Active alerts | `alerts` | Avoid redundant alert suggestions |
| Copilot feedback | `copilot_feedback` | Personalize tone based on history |

**Risk detection**:
- **Concentration risk**: Flagged when >1 open trade on the same symbol
- **Directional risk**: Flagged when all open trades are in the same direction (all LONG or all SHORT)
- Surfaced in the system prompt so Gemini can warn users proactively

---

## Tool Inventory (Full)

| Tool | Category | New? | Description |
|---|---|---|---|
| `search_patterns` | Core | No | Live pattern scan across 8,500+ instruments |
| `get_pattern_stats` | Core | No | Historical win rates per pattern/timeframe |
| `explain_pattern` | Education | No | Pattern psychology and trading approach |
| `generate_pine_script` | Export | No | TradingView Pine Script generation |
| `find_article` | Education | No | Search 120+ learning articles |
| `add_to_watchlist` | Action | No | Add symbol to user's watchlist |
| `get_market_breadth` | Market | No | A/D ratio, VIX, Put/Call, Fear & Greed |
| `analyze_chart_context` | Analysis | No | Analyze captured chart indicators |
| `query_edge_atlas` | Data | No | 380K+ backtested trade rankings |
| `get_economic_events` | Market | No | Upcoming macro events (GDP, CPI, NFP) |
| `get_market_report` | Market | No | AI-generated daily market summary |
| `get_price_data` | Data | No | Recent OHLC price data |
| `get_user_backtests` | User | No | Personal backtest results |
| `get_user_alerts` | User | No | Active pattern alerts |
| `get_paper_portfolio` | User | No | Paper trading portfolio & P&L |
| `get_instrument_stats` | **Intelligence** | **Yes** | Ticker-specific pattern performance |
| `compare_pattern_performance` | **Intelligence** | **Yes** | Ticker vs market average comparison |
| `get_decision_confidence` | **Intelligence** | **Yes** | Composite 0–100 confidence score |

---

## System Prompt Enhancements

The system prompt now mandates that for any "Should I trade X?" query, the Copilot must:
1. Call `get_instrument_stats` for ticker-specific data
2. Call `compare_pattern_performance` to show vs-market context
3. Call `get_decision_confidence` for the composite score
4. Reference the user's portfolio context if logged in
5. Warn about concentration or directional risk when detected

This ensures every answer is **more specific and data-backed** than what users could get from any generic AI.

---

## Dependencies

- `instrument_pattern_stats_mv` — Materialized view (must be refreshed periodically)
- `pattern_hit_rates` — Aggregate performance data
- `paper_portfolios` / `paper_trades` — User portfolio state
- `watchlists` / `watchlist_items` — User watchlist
- `economic_events` — Macro calendar for risk environment scoring
- `copilot_feedback` — Historical interaction quality

## Files Modified

- `supabase/functions/trading-copilot/index.ts` — All tool definitions, handlers, context builder, system prompt
