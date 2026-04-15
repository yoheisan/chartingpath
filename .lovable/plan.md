

## Plan: Build Items 3, 4, and 5 from Growth Recommendations

Based on the traffic analysis, these are the three improvements to implement:

---

### Item 3: Bot Traffic Filtering in Analytics

**Problem**: 89% of tracked traffic is bots (0-second sessions from China). All admin metrics are polluted.

**Current state**: `is_bot_suspect` column exists in `analytics_events` but is never populated at write time — only filtered in admin reports manually.

**What to build**:
- Add client-side bot detection at event capture time in `src/lib/analytics.ts`:
  - Check `navigator.webdriver`, known bot user-agent patterns, 0-dimension viewport
  - Set `is_bot_suspect: true` on the event before inserting
- Add an "engaged visitor" metric: a visitor who either scrolled > 25%, spent > 5 seconds, or clicked any element. Track a `session.engaged` event once per session.
- Update `src/components/admin/DailyReportPanel.tsx` to show **Engaged Visitors** as the primary metric (alongside raw sessions), and default the bot filter to ON.

**Files**: `src/lib/analytics.ts`, `src/components/admin/DailyReportPanel.tsx`

---

### Item 4: Reduce Signup Friction — Increase Anonymous Screener Access

**Problem**: Anonymous users see only 5 patterns before a hard blur wall. With a 98% bounce rate, most visitors never reach the value.

**What to build**:
- Increase `GUEST_VISIBLE` from **5 → 10** in `LivePatternsPage.tsx` — let anonymous visitors see more real data before the gate
- Add a **"Try Pattern Lab Free"** inline CTA card after the 10th row (instead of just a blur overlay), linking to `/projects/pattern-lab/new` which already works for anonymous users
- On the landing page hero, change the primary CTA to navigate directly to `/patterns/live` (already does this) but add a secondary text link: "No account needed — browse live patterns now"

**Files**: `src/pages/LivePatternsPage.tsx`, `src/components/screener/GuestScreenerOverlay.tsx`, `src/pages/Index.tsx`

---

### Item 5: Landing Page Engagement Hooks — Scroll-Depth Value Reveal

**Problem**: Average pages/visit is 1.11, meaning visitors leave the landing page without scrolling. The hero doesn't deliver instant proof of value.

**What to build**:
- Add a **live pattern count ticker** in the hero subtitle that animates up from 0 to the actual count (already have `useOutcomeCount`)
- Add **scroll-triggered micro-stats** that fade in as the user scrolls: "Top pattern today: Rising Wedge on AAPL — 68% win rate" pulled from `useHomepageStats`
- Track `session.scroll_depth` at 25%, 50%, 75%, 100% milestones in `src/lib/analytics.ts` to measure improvement
- Track `session.engaged` event (from item 3) to establish a clean baseline

**Files**: `src/lib/analytics.ts`, `src/pages/Index.tsx`, `src/components/landing/HeroStatsBar.tsx`

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/lib/analytics.ts` | Bot detection, engaged visitor tracking, scroll depth events |
| `src/components/admin/DailyReportPanel.tsx` | Engaged visitors metric, default bot filter ON |
| `src/pages/LivePatternsPage.tsx` | `GUEST_VISIBLE` 5 → 10 |
| `src/components/screener/GuestScreenerOverlay.tsx` | Add Pattern Lab CTA card |
| `src/pages/Index.tsx` | "No account needed" text link, animated count |
| `src/components/landing/HeroStatsBar.tsx` | Scroll-triggered animation |

No database migrations needed — all changes use the existing `analytics_events` table and `is_bot_suspect` column.

