

# Outcome Feedback Loop + Your Edge Dashboard — Full Implementation Plan

This is a multi-step build across ~8-10 implementation rounds. Here's the sequenced plan.

---

## Phase 1: Backend Feedback Loop (2 rounds)

### Round 1A — Database Schema + `feedbackToAgentScores` in monitor-paper-trades

**Migration**: Add columns to support feedback tracking:
- `paper_trades`: add `pattern_id TEXT`, `timeframe TEXT`, `asset_type TEXT` columns (needed to link outcomes back to agent_scores)
- `user_email_preferences`: add `first_paper_trade_seen BOOLEAN DEFAULT false`, `milestone_5_seen`, `milestone_20_seen`, `milestone_50_seen` columns

**Edge Function Update** (`monitor-paper-trades/index.ts`):
- Add `feedbackToAgentScores()` function that:
  1. Extracts `pattern_id` and `timeframe` from the trade's notes field (already stores `[pattern:xxx]`) or new columns
  2. Queries `instrument_pattern_stats_mv` for current stats
  3. Recalculates win rate and expectancy incorporating the new outcome
  4. Updates `agent_scores` row for that detection with new `analyst_raw`, `win_rate`, `sample_size`
- Call it after every trade close (TP, SL, timeout)

### Round 1B — Override Feedback Weighting

- In `monitor-paper-trades`, add override classification logic:
  - "Pattern invalidated" / "Market conditions changed" / "Changed my mind" → soft negative (0.3 weight)
  - "Taking partial profit" / "Risk management" / "News event risk" → neutral (no signal quality impact)
- Wire into `feedbackToAgentScores` with weighted outcome

---

## Phase 2: "What We Learned" Outcome Card (2 rounds)

### Round 2A — Outcome Card Component

**New component**: `src/components/paper-trading/OutcomeLearnedCard.tsx`
- Shows pattern name, instrument, timeframe, result (R-multiple), close reason
- Displays updated platform win rate for that pattern+instrument+timeframe
- Shows user's personal win rate for that pattern
- Green/red/amber styling based on outcome type
- Two action buttons: "View Your Edge →" and "See All [Pattern] →"

### Round 2B — Wire Into PaperTradingPanel + Toast

- Listen via Supabase realtime for trade closures
- Show toast notification on close with outcome summary
- Persist outcome cards in History tab as special "outcome recorded" events
- Override confirmation toast: "Override recorded — noted as soft negative signal"

---

## Phase 3: Live Learning Indicator (1 round)

### Round 3 — AgentBacktestPanel Indicator

**New component**: `src/components/agent-backtest/LiveLearningIndicator.tsx`
- Shows "Model last updated: X minutes ago"
- Total outcomes count (from `paper_trades` where `status = 'closed'`)
- Outcomes added today
- User's contributing trades count
- Real-time updates via `postgres_changes` subscription on `paper_trades`

---

## Phase 4: Your Edge Dashboard (3 rounds)

### Round 4A — Page + Hero + Empty State

**New page**: `src/pages/YourEdgePage.tsx` at `/tools/your-edge`
- Personal Performance Hero with 4 stat cards (win rate, avg R, total P&L, trade count)
- Auto-generated insight sentence (best pattern, best timeframe, best asset class)
- Empty state for <5 trades with CTA to Screener
- Add to router and navigation

### Round 4B — Pattern Performance Table + Timeframe/Asset Cards

- Table comparing user's personal win rate vs platform average per pattern
- Edge column with color coding and icons (trophy, check, warning, avoid)
- Two side-by-side cards: Timeframe Performance and Asset Class Performance
- Progress bars with orange fill, personal insights

### Round 4C — Trade History Timeline + Journal Notes

- Chronological trade cards with entry/exit, R-multiple, P&L
- Mini progress bar showing result vs platform average R
- "Add note" field that updates `paper_trades.notes`
- Pagination (10 per page)

---

## Phase 5: Sidebar Widget + Milestones + Onboarding (1 round)

### Round 5 — Polish & Engagement

- **PaperTradingPanel sidebar widget**: Compact "Your Edge Summary" in Performance tab
- **Milestone notifications**: Toast at 5, 20, 50 closed trades with deep links
- **First paper trade onboarding modal**: One-time "You're now contributing to ChartingPath" message
- Store milestone flags in `user_email_preferences`

---

## Implementation Order Summary

| Round | What | Files |
|-------|------|-------|
| 1A | DB migration + feedbackToAgentScores | migration SQL, monitor-paper-trades/index.ts |
| 1B | Override weighting | monitor-paper-trades/index.ts |
| 2A | OutcomeLearnedCard component | New component |
| 2B | Wire card + toasts | PaperTradingPanel, usePaperTrading |
| 3 | Live Learning indicator | New component, AgentBacktestPanel |
| 4A | Your Edge page + hero + empty state | New page, router, nav |
| 4B | Pattern table + timeframe/asset cards | YourEdgePage components |
| 4C | Trade timeline + journal | YourEdgePage components |
| 5 | Sidebar widget + milestones + onboarding | Multiple components |

I'll start with Round 1A (migration + feedback loop backend) upon approval.

