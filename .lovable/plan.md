

# Multi-Page Funnel Analysis and Improvement Plan

## Data Summary

| Page | Views | Avg Time on Page | Key Issue |
|------|-------|-----------------|-----------|
| Landing `/` | 516 | 116s | New CTAs just deployed, early data looks promising |
| Auth `/auth` | 75 (29 sessions) | No leave data | 5 sessions start form, 4 abandon -- 0 signups |
| Screener `/patterns/live` | 101 | 18s | Short dwell time -- users may be overwhelmed |
| Pattern Lab `/projects/pattern-lab/new` | 71 | 32s | Decent engagement but 0 completed backtests |
| Shared links `/s/*` | 8 views across 4 links | -- | Small but active channel, 7 pattern views tracked |
| Pricing `/projects/pricing` | 43 | 26s | Healthy engagement |
| Blog/Learn (head-and-shoulders) | 1,332 combined | ~0s (bounces) | Massive SEO traffic, near-zero engagement |

---

## Priority 1: Auth Page (75 views, 0 signups)

**Problem**: 5 out of 29 sessions start the form (`form_start`), but nobody completes it. 4 sessions explicitly abandon. All 24 `auth_page.viewed` events show `context: direct` -- meaning nobody arrives from a contextual CTA (shared link, paywall, etc.).

**Improvements**:
1. **Reduce form friction** -- Default to the "Create Account" view (not "Sign In") for new visitors. Currently defaults to Sign In, which assumes returning users.
2. **Lead with Google OAuth** -- Move the Google button above the email form. Social login has dramatically lower friction than email+password+confirm.
3. **Add contextual messaging from landing CTAs** -- Pass `context` param from hero buttons (e.g., `?context=screener` or `?context=backtest`) so the auth page can show "Sign up to access live setups" instead of generic copy.
4. **Track auth page leave duration** -- Currently no `page.leave` data for `/auth`, making it impossible to measure time-on-page. Ensure the analytics hook fires on unmount.

### Files to modify
- `src/pages/Auth.tsx` -- Reorder form layout (Google first), default to signup mode for new visitors, use `context` param for dynamic messaging
- `src/pages/Index.tsx` -- Pass `context` param in CTA navigation

---

## Priority 2: Screener (101 views, 18s avg dwell)

**Problem**: 18 seconds average time is very short for a data-rich screener. Users likely see a wall of filters/data and leave before finding value.

**Improvements**:
1. **Add a first-visit guided state** -- Show a brief "what you're looking at" tooltip or banner for users who haven't visited before (localStorage flag). Highlight the top 3 setups and explain grade/quality.
2. **Surface "best setup of the day"** -- Pin the highest-graded fresh signal at the top with a highlight card before the table, giving immediate value.
3. **Track screener interactions** -- Add events for filter changes, row clicks, and chart opens to understand where users engage vs. drop off.

### Files to modify
- `src/pages/LivePatternsPage.tsx` -- Add "Top Setup" highlight card, first-visit guidance, interaction tracking

---

## Priority 3: Pattern Lab (71 views, 0 backtests completed)

**Problem**: Users spend 32 seconds (decent) but never complete a backtest. The activation moment is unreachable.

**Improvements**:
1. **Pre-fill with a compelling example** -- When arriving from the landing page CTA without params, auto-populate with a high-performing pattern (e.g., "Double Bottom on AAPL, 1D") so users can click "Run" immediately instead of configuring from scratch.
2. **Add a "Quick Start" one-click backtest** -- A prominent button that runs a curated backtest instantly, showing results in seconds. This removes the configuration barrier entirely.
3. **Track funnel steps** -- Add events for each step: page load, configuration started, run clicked, results displayed, to identify where exactly users drop off.

### Files to modify
- Pattern Lab page (find exact path -- likely in `/projects/pattern-lab/` route component)

---

## Priority 4: Blog/Learn Pages (1,332 views, ~0s dwell)

**Problem**: `/blog/head-and-shoulders` and `/learn/head-and-shoulders` get massive traffic (likely SEO) but 0-second dwell times suggest immediate bounces or redirect issues. This is your biggest untapped acquisition channel.

**Improvements**:
1. **Investigate the 0-second dwell** -- These pages may have rendering issues, redirects, or the page.leave event fires immediately. This needs debugging first.
2. **Add in-content CTAs** -- If the content renders properly, add contextual CTAs within the article: "See live Head & Shoulders signals now" linking to the screener pre-filtered, and "Backtest this pattern" linking to Pattern Lab pre-filled.

### Files to modify
- Blog/Learn page components (investigate rendering issue first)

---

## Priority 5: Shared Links (8 views, 7 pattern views)

**Problem**: Small volume but these are high-intent users arriving from social proof. The current shared backtest page has a sticky "Create Free Account" CTA but no clear path to try the product first.

**Improvements**:
1. **Add "Try this backtest yourself" CTA** -- Link directly to Pattern Lab pre-filled with the shared pattern's params (already partially implemented in SharedPattern but not SharedBacktest).
2. **Track conversion from shared links** -- The `shared_to_auth_click` event exists but shows 0 fires. Ensure the tracking works.

### Files to modify
- `src/pages/SharedBacktest.tsx` -- Add "Try this yourself" CTA alongside auth CTA
- `src/pages/SharedPattern.tsx` -- Verify tracking fires

---

## Implementation Sequence

1. **Auth page** (highest impact -- fixing the 0-signup bottleneck)
2. **Pattern Lab** (pre-fill + quick start to enable the "aha moment")
3. **Screener** (first-visit guidance + top setup highlight)
4. **Blog/Learn** (investigate 0s dwell, then add CTAs)
5. **Shared links** (add try-it-yourself CTA)

