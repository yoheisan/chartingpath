

# Implementation Plan: Onboarding + Tooltips + Forward Performance Dashboard

Based on the Japanese user feedback requesting (1) onboarding guidance, (2) "?" tooltips on terminology, and (3) backtest vs. live performance comparison.

---

## Feature 1: Guided Onboarding Flow

**What**: A step-by-step welcome tour for first-time users, triggered on first visit after signup. Uses localStorage to track completion.

**Components to create**:
- `src/components/onboarding/OnboardingTour.tsx` — A modal/dialog-based tour with 4-5 steps explaining:
  1. Welcome + what ChartingPath does (pattern validation)
  2. Screener — where live signals appear
  3. Pattern Lab — backtest any pattern
  4. Dashboard — your command center (chart, paper trading, alerts)
  5. Edge Atlas — find the best-performing patterns
- `src/components/onboarding/OnboardingStep.tsx` — Reusable step card with illustration, title, description, progress dots
- `src/hooks/useOnboardingState.ts` — localStorage-backed hook (`chartingpath_onboarding_completed`)

**Integration points**:
- `src/components/Layout.tsx` — Render `<OnboardingTour />` for authenticated users who haven't completed it
- Each step links to the relevant page with a "Try it" button
- Fully translatable via existing i18n system (`useTranslation`)

---

## Feature 2: Terminology "?" Tooltips Across All Pages

**What**: A reusable `<InfoTooltip term="winRate" />` component that renders a small `?` icon with a hover tooltip explaining the term. Centralized glossary of ~20 key trading terms.

**Components to create**:
- `src/components/ui/InfoTooltip.tsx` — Small `HelpCircle` icon wrapped in existing `Tooltip` component. Props: `term: string` (glossary key) or `content: string` (custom text). Uses `max-w-sm whitespace-normal` per design standard.
- `src/data/tradingGlossary.ts` — Centralized dictionary of terms with i18n keys:
  - Win Rate, Expectancy (R-multiple), Sharpe Ratio, Profit Factor, Max Drawdown, Risk/Reward Ratio, Sample Size, Grade, Timeframe, Support/Resistance, Take Profit, Stop Loss, Paper Trading, Signal Age, Bars to Outcome, CAGR, Sortino, Calmar, Annualized Return, Pattern Confidence

**Pages to add tooltips**:
- `src/pages/LivePatternsPage.tsx` — Column headers (Grade, Win Rate, R:R, Signal Age)
- `src/components/command-center/PaperTradingPanel.tsx` — P&L, Balance metrics
- `src/pages/projects/` (Pattern Lab) — Result metrics (Sharpe, Expectancy, Max DD, Profit Factor)
- `src/pages/EdgeAtlasIndexPage.tsx` / `EdgeAtlasPatternPage.tsx` — Annualized %, Trades/Year
- `src/components/projects/ComparisonBanner.tsx` — All metric labels

---

## Feature 3: Forward Performance vs. Backtest Dashboard

**What**: A new panel/page that compares backtest predictions against actual paper trading outcomes for the same pattern.

**Data flow**:
- `paper_trades` already stores `pattern_name` and outcome data (PnL, win/loss)
- `backtest_result_cache` stores backtest results with pattern configs
- New edge function or client-side aggregation joins these to compute:
  - Backtest Win Rate vs. Actual Win Rate
  - Backtest Expectancy vs. Actual Expectancy
  - Trade count comparison

**Components to create**:
- `src/components/command-center/ForwardPerformancePanel.tsx` — New tab in the Dashboard sidebar showing:
  - Table of patterns with both backtest and live metrics side-by-side
  - Delta chips (reuse `ComparisonBanner.tsx` DeltaChip pattern)
  - "Confidence Score" — how closely live results match backtest
- `src/hooks/useForwardPerformance.ts` — Aggregates paper_trades by pattern_name, joins with cached backtest results

**Integration**:
- Add as a new tab in `CommandCenterLayout.tsx` sidebar (alongside Paper Trading, Alerts, Watchlist)
- Only visible for authenticated users with paper trade history

---

## Technical Notes

- All new text uses `useTranslation()` with English defaults; Japanese translations added to `ja.json`
- Onboarding images use simple SVG illustrations or Lucide icon compositions (no external assets)
- InfoTooltip follows existing `max-w-sm whitespace-normal` standard from memory
- Forward Performance panel reuses existing Supabase queries — no new tables needed
- Estimated scope: ~8-10 files created, ~6-8 files modified

