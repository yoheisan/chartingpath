

## Stronger CTAs on Pattern Statistics Pages

### Problem
The current CTA buttons on both `PatternStatisticsPage` and `InstrumentPatternStatsPage` are small, outline-styled buttons buried below the data table. Visitors land on these pages organically (SEO), see the stats, and leave without converting. There's no urgency, no value proposition, and no signup prompt for anonymous users.

### Changes

**1. Add a bold inline CTA banner right after KPI cards (both pages)**

A full-width, visually distinct card placed immediately after the KPI section — the highest-attention area. For **anonymous users**, it drives signup. For **authenticated users**, it drives product usage (backtest/alerts).

```text
┌─────────────────────────────────────────────────────────┐
│  🔒 You're looking at data most traders never see.      │
│  320,000+ backtested outcomes. Free account required.   │
│                                                         │
│  [Sign Up Free — No Credit Card]    [Google Sign In]    │
└─────────────────────────────────────────────────────────┘
```

For authenticated users, the same slot shows:
```text
┌─────────────────────────────────────────────────────────┐
│  ⚡ Backtest this exact setup on your own ticker.       │
│  Run it in Pattern Lab — 50 free credits included.      │
│                                                         │
│  [Backtest {Pattern} Now]     [Set Alert for {Ticker}]  │
└─────────────────────────────────────────────────────────┘
```

**2. Replace the existing weak CTA button row (lines 253-270 in InstrumentPatternStatsPage, similar in PatternStatisticsPage)**

Remove the current `flex flex-wrap gap-3` row of outline buttons. The new banner above replaces it with stronger visual weight.

**3. Add a sticky bottom bar for anonymous users on these pages**

A slim bar at the bottom (similar to `GuestSignupNudge` but page-specific with pattern context):
```text
"This {Pattern} data is free. Backtesting it is too. → [Create Free Account]"
```

### Files to modify
- `src/pages/InstrumentPatternStatsPage.tsx` — add auth-aware CTA banner after KPIs, remove old button row
- `src/pages/PatternStatisticsPage.tsx` — same treatment
- `src/i18n/locales/en.json` — add new CTA strings
- All 17 non-English locale files — propagate keys as English placeholders

### Technical details
- Import `useAuth` from `@/contexts/AuthContext` in both pages
- Import `GoogleSignInButton` for the anonymous variant
- The banner component will be inline (not a separate file) since it's page-specific and uses page-local variables like `displayPatternName` and `displayInstrument`
- Sticky bottom bar will reuse the existing `GuestSignupNudge` pattern but with contextual copy; or we simply ensure `GuestSignupNudge` is rendered on these pages (check if it's already in the layout)

