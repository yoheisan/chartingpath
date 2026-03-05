

## Analysis: Hero Search Destination

**Current behavior**: The homepage ticker search navigates to `/instruments/:symbol` — an SEO-oriented instrument profile page with static stats, pattern history, and "Request Scan" buttons. This is an **informational dead-end** that sits outside the core conversion funnel.

**The conversion funnel** (from memory): Discover → Score → Validate
- **Dashboard** (`/members/dashboard`): Full command center with live charts, pattern overlays, watchlists — the primary engagement surface.
- **Screener** (`/patterns/live`): Signal discovery.
- **Pattern Lab** (`/pattern-lab`): Deep-dive backtesting.

The `/instruments/:symbol` page is useful for SEO crawlers but is a **cold page** for a human who just typed a ticker with intent to act. It shows historical stats but no live chart, no pattern overlay, no actionable next step.

**Recommendation**: Route the hero search to the **Dashboard** with the selected symbol pre-loaded on the chart. This is the highest-engagement destination because:
1. It immediately shows a live chart — the user sees what they searched for.
2. Pattern overlays and Morning Briefing provide instant context.
3. From there, the user is one click from Screener, Pattern Lab, or Agent Scoring.
4. The Dashboard already supports an `initialSymbol` route state parameter.

The `/instruments/:symbol` page remains valuable for organic/SEO traffic and external links.

## Plan

**Single change in `src/pages/Index.tsx`**:

Replace the `onSelect` handler in the hero `UniversalSymbolSearch` from:
```ts
onSelect={(symbol) => navigate(`/instruments/${symbol}`)}
```
to:
```ts
onSelect={(symbol) => {
  trackEvent('landing.search_select', { symbol });
  navigate('/members/dashboard', { state: { initialSymbol: symbol } });
}}
```

This sends the user straight into the Dashboard with the chart pre-loaded on their chosen ticker — the top of the engagement funnel — rather than a static profile page.

No other files need to change; the Dashboard already reads `initialSymbol` from route state and applies it.

