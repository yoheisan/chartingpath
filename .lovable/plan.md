

# Copilot Full Integration Plan: Connecting Missing Data Sources

## Current State

The Trading Copilot has **9 tools** covering pattern search, Edge Atlas, market breadth, chart context, scripts, articles, and watchlist. However, several major platform services are **disconnected** from the copilot, preventing the multimodal/combined analysis that would make it truly powerful.

## Gap Analysis

| Service | Data Source | Copilot Access | Status |
|---------|-----------|---------------|--------|
| Live Patterns | `live_pattern_detections` | `search_patterns` | Connected |
| Edge Atlas | `historical_pattern_occurrences` | `query_edge_atlas` | Connected |
| Market Breadth | `fetch-market-breadth` function | `get_market_breadth` | Connected |
| Chart Context | Passed from UI | `analyze_chart_context` | Connected |
| Pattern Education | Hardcoded + articles | `explain_pattern` / `find_article` | Connected |
| Pine Script | AI-generated | `generate_pine_script` | Connected |
| **Economic Calendar** | `economic_events` table (real-time) | **None** | **Missing** |
| **Market Reports** | `cached_market_reports` table | **None** | **Missing** |
| **Price Data (OHLC)** | EODHD / Yahoo edge functions | **None** | **Missing** |
| **User's Backtests** | `backtest_result_cache` | **None** | **Missing** |
| **User's Alerts** | `alerts` table | **None** | **Missing** |
| **Paper Portfolio** | `paper_trades` / `paper_portfolios` | **None** | **Missing** |

## What This Unlocks

With all services connected, the copilot can answer compound questions like:
- "Is it a good time to go long on EURUSD?" -- combines live patterns + economic calendar + market breadth + Edge Atlas win rates
- "What does the market look like today?" -- combines market report + breadth + top patterns + upcoming events
- "How did my Double Bottom backtest on AAPL compare to the Edge Atlas average?" -- combines user backtest results + Edge Atlas stats
- "Show my portfolio and suggest adjustments based on current setups" -- combines paper portfolio + live patterns + economic risk

## Implementation Plan

### 1. Add `get_economic_events` tool

Query the `economic_events` table for upcoming/recent high-impact events filtered by region, importance, and date range. Returns event name, scheduled time, forecast, actual, previous values, and impact level.

### 2. Add `get_market_report` tool

Fetch the latest cached market report from `cached_market_reports` for the user's timezone. Returns the AI-generated daily market summary covering stocks, forex, crypto, and commodities.

### 3. Add `get_price_data` tool

Call the existing `fetch-eodhd` / `fetch-yahoo-finance` edge functions to retrieve recent OHLC bars for a symbol. This enables the copilot to discuss actual price levels, recent moves, and percentage changes without relying on chart context being passed from the UI.

### 4. Add `get_user_backtests` tool

Query `backtest_result_cache` for the authenticated user's recent backtest results. Returns pattern, symbol, timeframe, win rate, expectancy, and trade count from their personal runs.

### 5. Add `get_user_alerts` tool

Query the `alerts` table for the authenticated user's active alerts. Returns symbol, pattern, timeframe, status, and trigger conditions. Enables the copilot to reference what the user is already monitoring.

### 6. Add `get_paper_portfolio` tool

Query `paper_portfolios` and `paper_trades` for the authenticated user. Returns current balance, P&L, and open/recent trades. Enables portfolio-aware recommendations.

### 7. Update system prompt for combined analysis

Add guidance in the system prompt instructing the copilot to proactively combine multiple tools when answering broad questions (e.g., "What should I trade today?" triggers patterns + economic events + breadth + report).

---

## Technical Details

### Files to modify

**`supabase/functions/trading-copilot/index.ts`**:
- Add 6 new tool definitions to the `tools` array (economic events, market report, price data, user backtests, user alerts, paper portfolio)
- Add 6 new `execute*` functions for each tool
- Add 6 new cases to the `executeTool` switch statement
- Update system prompt to document new capabilities and instruct combined analysis behavior

### Tool Specifications

**`get_economic_events`**:
- Parameters: `region` (US, EU, GB, JP, etc.), `importance` (high/medium/low), `days_ahead` (default 3), `days_back` (default 1)
- Source: Direct query to `economic_events` table
- Auth: Not required (public data)

**`get_market_report`**:
- Parameters: `timezone` (auto-detected or specified)
- Source: Query `cached_market_reports` table for most recent report
- Auth: Not required

**`get_price_data`**:
- Parameters: `symbol`, `interval` (1d default), `days` (default 30)
- Source: Internal call to `fetch-eodhd` with Yahoo fallback
- Auth: Not required

**`get_user_backtests`**:
- Parameters: `symbol` (optional), `pattern` (optional), `limit` (default 5)
- Source: Query `backtest_result_cache` filtered by user_id
- Auth: Required (returns empty array for anonymous users)

**`get_user_alerts`**:
- Parameters: `status` (active/triggered/all), `limit` (default 10)
- Source: Query `alerts` table filtered by user_id
- Auth: Required

**`get_paper_portfolio`**:
- Parameters: none
- Source: Query `paper_portfolios` + `paper_trades` filtered by user_id
- Auth: Required

### System Prompt Updates

Add a "Combined Analysis" section instructing the AI to:
- When asked broad market questions, call `get_market_report` + `get_market_breadth` + `get_economic_events` together
- When asked about a specific instrument, call `search_patterns` + `get_price_data` + `get_economic_events` (filtered by relevant region)
- When asked "what should I trade", combine Edge Atlas top setups + live patterns + economic risk assessment
- When user has auth context, proactively reference their alerts, backtests, and portfolio

### Implementation Sequence

1. Economic Calendar + Market Report tools (highest value, no auth needed)
2. Price Data tool (enables standalone price analysis)
3. User Backtests + Alerts + Portfolio tools (auth-gated, personalized insights)
4. System prompt update for combined analysis behavior

