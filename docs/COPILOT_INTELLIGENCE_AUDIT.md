# Trading Copilot — Enhanced Intelligence Audit

> Last updated: 2026-03-07

## Overview

The Trading Copilot has been upgraded from a basic pattern-lookup chatbot to a **portfolio-aware, data-moat-powered research assistant** that delivers answers no generic AI (ChatGPT, Gemini) can replicate. The enhancements fall into five pillars.

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

## Pillar 5: Agent Scoring Copilot Control (`get_agent_scoring_settings` + `adjust_agent_scoring`)

**Problem solved**: Users had to manually navigate to the Agent Scoring page and tweak sliders to change scoring behavior. Now they can simply tell the Copilot what they want in natural language.

**Tools**:
| Tool | Purpose |
|---|---|
| `get_agent_scoring_settings` | Reads user's current weights, cutoffs, filters, and presets |
| `adjust_agent_scoring` | Modifies settings with suggest-first (default) or direct-apply mode |

**Capabilities**:
- Adjust agent weights (Analyst, Risk, Timing, Portfolio) — auto-normalized to sum=100
- Modify TAKE/WATCH cutoff thresholds with validation (WATCH must be < TAKE)
- Change asset class and timeframe filters
- Two modes: **suggest** (shows before/after comparison) and **apply** (saves directly)
- Creates or updates presets in `agent_scoring_settings` table

**Example interactions**:
- "Increase take rate by 5% without increasing risk" → lowers TAKE cutoff by ~3-5 points, keeps risk weight unchanged
- "Make scoring more conservative" → raises TAKE cutoff, increases risk weight
- "Only show forex signals" → sets asset_class_filter to 'fx'

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
| `get_agent_scoring_settings` | **Scoring** | **Yes** | Read user's Agent Scoring weights, cutoffs & filters |
| `adjust_agent_scoring` | **Scoring** | **Yes** | Modify Agent Scoring settings via natural language |

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

---

## Copilot Orchestration Layer — v2.0 (March 2026)

### What Changed

The monolithic `trading-copilot` edge function has been extended with a domain routing layer. The original function is **unchanged and untouched** — it now serves as the `general` domain fallback.

### New Architecture

User message → CopilotSidebar (frontend) → copilot-router (intent classifier) → copilot-scoring-handler (domain: scoring) → copilot-screener-handler (domain: screener) → copilot-research-handler (domain: research) → trading-copilot (domain: general — unchanged) → SSE stream piped back to user → Classification logged to copilot_training_pairs

### New Edge Functions

| Function | Purpose |
|---|---|
| `copilot-router` | Classifies intent via Gemini Flash Lite into 4 domains. Confidence < 0.6 → general. Logs domain + intent to `copilot_training_pairs`. Pipes SSE stream without buffering. |
| `copilot-scoring-handler` | Specialist for agent scoring. Tools: `get_agent_scoring_settings`, `adjust_agent_scoring`. Suggest-before-apply pattern. |
| `copilot-screener-handler` | Specialist for pattern search. Tools: `search_patterns`, `query_edge_atlas`. NL filter builder. Includes `last_scanned_at` for data freshness. Auto-fallback on empty results. |
| `copilot-research-handler` | Specialist for instrument research and backtesting. Tools: `query_edge_atlas`, `run_backtest`, `check_backtest_quota`. Hard limit: 3 backtests per day per user (DB-backed counter). |
| `copilot-outcome` | RLHF feedback loop. Accepts `{ training_pair_id, outcome }` and updates `copilot_training_pairs.outcome_signals`. Fires when user sends follow-up message. |

### Database Changes

**Table: `copilot_training_pairs` — 3 new columns added:**
| Column | Type | Purpose |
|---|---|---|
| `domain` | TEXT | Which handler processed the request |
| `intent_classification` | TEXT | Router's sub-intent label |
| `parameters_used` | JSONB | Structured parameters + classification confidence |

**New table: `copilot_model_versions`**
Tracks fine-tuned model versions (model_type, version_tag, training_date, accuracy_metrics, is_active). RLS locked to admin + service_role only.

### Frontend Changes

`CopilotSidebar.tsx` — Optional `context` prop added:
- No context passed = routes to `trading-copilot` (unchanged behaviour)
- Context passed = routes to `copilot-router` with domain hint and quick prompt chips

Pages updated:
| Page | Domain | Quick Prompts |
|---|---|---|
| `AgentScoring.tsx` | scoring | Make conservative, Optimise win rate, Show settings |
| `LivePatternsPage.tsx` | screener | What's working now, A-grade crypto, Best forex today |
| `PatternLabWizard.tsx` | research | Most profitable pattern, >60% win rate, Check quota |

### RLHF Data Pipeline (Active)

Every routed message now logs `domain` and `intent_classification` to `copilot_training_pairs`. Outcome signals fire when users send follow-up messages (`clicked_through`). This data accumulates toward the 10K labeled interaction threshold required for Phase 3 fine-tuning of a proprietary intent classifier.

### Files Added

| File | Action |
|---|---|
| `supabase/functions/copilot-router/index.ts` | New |
| `supabase/functions/copilot-scoring-handler/index.ts` | New |
| `supabase/functions/copilot-screener-handler/index.ts` | New |
| `supabase/functions/copilot-research-handler/index.ts` | New |
| `supabase/functions/copilot-outcome/index.ts` | New |

### Files Unchanged

`supabase/functions/trading-copilot/index.ts` — untouched. Serves as general domain fallback.

---

## Copilot ACS Layer — v3.0 (March 2026)

**Added**: Master Plan mandate system, AI Gate, paper trading engine, AI vs Human performance tracking, Deploy to Live (Alpaca), hybrid Gemini/Claude model routing, moat data strategy.

### What Changed

The Copilot has been extended beyond research and scoring into **autonomous trade execution**. Users define trading rules in natural language. Copilot scans, enters, manages, and exits paper trades automatically within those rules. Every decision is logged with full attribution to build a proprietary per-user intelligence database.

The existing `trading-copilot`, `copilot-router`, and all domain handlers are **unchanged**. This layer adds new edge functions, new database tables, and new UI surfaces on top.

### New Edge Functions

| Function | Schedule | Purpose |
|---|---|---|
| `evaluate-gate` | On demand | Maps Agent Scoring verdicts to gate results, checks Master Plan rules, generates plain-language gate reason via Gemini Flash |
| `scan-setups` | Every 5 min | Scans candidates during trading window, auto-opens aligned paper trades, notifies on partial, skips conflicts |
| `manage-trades` | Every 5 min | Monitors open paper trades: trailing stop updates, TP/SL exits, trading window close |
| `monitor-paper-trades` | Every 5 min | Outcome resolution: TP hit, SL hit, 7-day timeout |
| `generate-insight` | On demand | Gemini Flash insight comparing AI-approved vs human override performance. Cached 1hr in `insight_cache`. |
| `alpaca-broker` | On demand | Verifies Alpaca credentials, places live orders via REST API, flattens all positions on Stop+Flatten |
| `copilot-outcome` | On demand | RLHF feedback loop — existing, unchanged |

### New Database Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `master_plans` | User trading mandates | `max_position_pct`, `trading_window_start/end`, `preferred_patterns`, `trend_direction`, `stop_loss_rule`, `raw_nl_input`, `is_active` |
| `gate_evaluations` | Every gate decision logged permanently | `ticker`, `agent_score`, `agent_verdict` (TAKE/WATCH/SKIP), `gate_result` (aligned/partial/conflict), `gate_reason`, `master_plan_id`, `source` |
| `paper_trades` | All paper trade records with full attribution | `entry/exit_price`, `pnl_r`, `attribution` (ai_approved/human_overwrite), `copilot_reasoning`, `gate_evaluation_id`, `outcome`, `stop_price`, `target_price` |
| `live_trades` | Real broker trade records | Same as paper_trades + `broker_order_id`, `filled_price`, `slippage_r` |
| `session_logs` | Daily session summaries | `total_scanned`, `trades_taken`, `ai_pnl_r`, `human_pnl_r`, `summary_text` |
| `broker_connections` | Alpaca credentials + live state | `api_key` (encrypted), `capital_allocated`, `is_live`, `account_balance` |
| `insight_cache` | Cached AI performance insights | `insight` text, `generated_at` (1hr TTL) |
| `session_overrides` | Mid-session NL overrides | `override_text`, `session_id`, `created_at` |

### AI Gate Logic

Every setup entering the paper engine — whether AI-proposed or user-selected — passes through the same gate:

1. Fetch user's active `master_plan`
2. Run Agent Scoring: composite score from 4 agents (Analyst 35%, Risk 25%, Timing 20%, Portfolio 20%)
3. Map verdict: **TAKE → aligned**, **WATCH → partial**, **SKIP → conflict**
4. Check Master Plan rule violations:
   - Direction conflicts `trend_direction` → conflict
   - Setup type not in `preferred_patterns` → partial
   - Sector in `sector_filters` exclusions → conflict
   - Current time outside `trading_window` → partial
5. Take the stricter of verdict vs rule check
6. Generate `gate_reason` in plain language via Gemini Flash
7. Persist to `gate_evaluations` with `master_plan_id` FK

Gate results drive badges across all pages: Screener signal cards, Copilot watchlist, Agent Scoring table, Edge Atlas, Pattern Library.

### Paper Trading Engine

| Component | Logic |
|---|---|
| Entry | `mid_price + (0.5 × spread)`; `R_unit = entry × (max_position_pct / 100)` |
| Stop Loss | `entry − 2R` (default); trails to breakeven at +1R, to +1R at +2R |
| Take Profit | `entry + 3R` (default) |
| Entry rationale | Claude Sonnet — 2-sentence specific rationale stored permanently in `paper_trades.copilot_reasoning` |
| Session end | All open positions auto-closed at `trading_window_end` |
| Attribution | `ai_approved` (auto-entered) or `human_overwrite` (user override) |

### AI Model Routing

| Function | Model | Reason |
|---|---|---|
| Intent classify | Gemini Flash (via Lovable AI Gateway) | Fires on every NL input — high volume |
| Mandate parse JSON | Gemini Flash (`gemini-3-flash-preview`) | Strong JSON extraction |
| Mandate confirmation | Gemini Flash Lite | Simple summarisation |
| Gate reason generation | Gemini Flash | Fires on every setup scan — high volume |
| Trade entry rationale | Claude Sonnet (Anthropic API direct) | Stored permanently in DB — quality required |
| Performance insight | Gemini Flash | Fires on every closed trade, cached 1hr |
| Session debrief summary | Gemini Flash | Template-based summarisation |
| Session debrief Q&A | Claude Sonnet (Anthropic API direct) | Multi-turn nuanced reasoning |
| Live order parameters | Claude Sonnet | Real money — zero tolerance for errors |
| Pine Script generation | Claude Sonnet | Must produce runnable code |
| `copilot-router` classification | Gemini Flash Lite | Existing — unchanged |
| Domain handler queries | Gemini Flash | Existing — unchanged |

**Rule**: Gemini for anything firing >10× per user per day. Claude for anything stored permanently in the DB or touching real money.

### Deploy to Live — Guardrails + Flow

**Guardrails** (all must pass before enabling):
- Minimum 20 closed paper trades
- Positive AI-approved expectancy (`AVG(pnl_r) > 0`)
- Active Master Plan exists

**4-Step Wizard**:

| Step | Action |
|---|---|
| 1. Connect Broker | Verify Alpaca API keys against `paper-api.alpaca.markets/v2/account` |
| 2. Set Capital | Slider $0 to account balance; shows estimated position size per mandate |
| 3. Risk Disclosure | Legal disclaimer + required checkbox acknowledgment |
| 4. Confirm | Summary card with track record; Go Live activates `broker_connections.is_live = true` |

**Live Controls**:
- **Pause entries**: No new trades, existing positions managed to close
- **Stop + flatten**: Market sell all open positions via Alpaca API, `is_live = false`
- **Divergence monitor**: Alert if live underperforms paper by >10% over same period
- Paper runs in parallel always — same logic, simulated fills, for comparison

### Cross-Page Integration Points (v3.0 additions)

| Page | What was added |
|---|---|
| `/dashboard` | Copilot Context Bar + AI vs Human strip above Active Patterns widget |
| `/screener` | Gate badges (aligned/partial/conflict) on signal cards + "Add to Copilot paper" link |
| `/agent-scoring` | "+" button wired to `evaluate-gate` before adding to paper |
| `/pattern-lab` | "Send winner patterns to Master Plan" button post-backtest |
| `/alerts` | "Also send to Copilot paper when triggered" toggle on alert creation |
| `/scripts` | "Copilot Strategy" tab — imports script logic as Master Plan mandate |
| `/edge-atlas` | "In your plan" badge on cards matching active `preferred_patterns` |
| `/pattern-library` | "In plan" chip on matching pattern cards, links to `/copilot` |
| `/copilot` (new) | Full Copilot ACS workspace — 3-panel layout (see UI/UX spec) |

### Moat Data Strategy

Every interaction through the Copilot ACS loop stores intelligence that competitors cannot replicate without years of the same loop running.

**Stored per trade** (`paper_trades`):
- `copilot_reasoning` — Claude's entry rationale, permanent record
- `gate_result` + `gate_reason` — every setup evaluated, forever
- `attribution` — AI or human decision on every single trade
- `gate_evaluation_id` — links trade back to full gate decision context
- `outcome` — win/loss links the decision to the result

**Stored per session** (`session_logs`):
- `total_scanned` — how many setups Copilot evaluated each day
- `ai_pnl_r` — Copilot's R performance per session
- `human_pnl_r` — override R performance per session

**Stored per mandate change** (`master_plans` history):
- `raw_nl_input` — user's original words verbatim
- All parsed rules — structured evolution of their trading plan over time

**What this builds**:
- Per-user pattern win rates — personalised, not generic market averages
- Override cost history — exactly where each user's instincts hurt them
- Mandate evolution log — how each user's plan changed over their trading lifetime
- Agent weight performance — which of the 4 agents best predicts outcomes
- Session behaviour patterns — time of day, hold duration, R consistency

**Future moat expansions**:
- Fine-tune Gemini Flash on `gate_evaluations` data → proprietary intent classifier
- Cross-user pattern success rates → proprietary Edge Atlas signal layer
- Mandate clustering → peer benchmarks grouped by trading style
- Predictive override warning → "You usually override on momentum setups and lose 72% of the time"
- `copilot_training_pairs` accumulation → 10K labeled interactions threshold for Phase 3 fine-tuning (already logging via existing RLHF pipeline)

### New Frontend Page

**`/copilot` — Copilot ACS Workspace** (3-panel layout)

| Panel | Width | Contents |
|---|---|---|
| Left | 270px | Feedback Banner, Mandate Card (NL-editable chips), Conflict Banner, AI-Gated Watchlist |
| Center | Flex fill | 3 states: Scanning (shortlist cards) / Active Trade (chart + context bar) / Review (trade breakdown + Q&A) |
| Right | 256px | AI vs Human head-to-head, metric cards, Insight Card (Gemini-generated), Trade Log with attribution badges, Deploy to Live button |

**Center Panel States**:

| State | Trigger | Key Elements |
|---|---|---|
| Scanning | No open trade (default) | Copilot Context Bar, 3 candidate cards with gate badges + agent scores, scan countdown |
| Active Trade | `paper_trade.outcome = open` | Ticker header with attribution badge, SVG chart with entry/stop/target annotations, Copilot reasoning overlay |
| Review | Click trade log row | Trade breakdown card (entry/exit/R/duration/gate decision), NL Q&A input with suggested chips |

**NL Command Bar** (⌘K):
- Global — accessible from every page via keyboard shortcut
- Intent classified by Gemini Flash: `new_mandate` / `override` / `question`
- `new_mandate` → Gemini parses JSON → Claude confirms → saved to `master_plans`
- `override` → stored in `session_overrides`, does not modify master plan
- `question` → routed to Session Debrief Q&A (Claude Sonnet)

### Build Log

| Date | Action |
|---|---|
| 2026-03-07 | v2.0: Copilot orchestration layer, domain routing, RLHF pipeline |
| 2026-03-21 | v3.0: Copilot ACS layer — Master Plan, AI Gate, paper engine, Deploy to Live, hybrid model routing, moat data strategy, `/copilot` page, cross-page integrations |
