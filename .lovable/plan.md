

## Connect Master Plan to Dashboard Watchlist & Alerts

### Current State
- **Master Plan** defines asset classes, exchanges, patterns, direction, sector filters, trading window — but only the Copilot uses it
- **Dashboard Watchlist** (`WatchlistPanel.tsx`) is fully manual — users add any ticker with no plan filtering
- **Dashboard Alerts** (`AlertsHistoryPanel.tsx`) have no `master_plan_id` — no link to which strategy triggered them
- **Active Patterns** tab shows all `live_pattern_detections` regardless of plan universe

### What Changes

**1. Database — link alerts to plans**

Add `master_plan_id` column to the `alerts` table (FK to `master_plans`). This lets each alert be scoped to a specific trading strategy.

```sql
ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS master_plan_id uuid REFERENCES public.master_plans(id);
```

**2. Dashboard Watchlist — plan-aware filtering**

- Add a small plan selector dropdown at the top of the WatchlistPanel (optional — "All" or a specific plan name)
- When a plan is selected, the Active Patterns tab filters `live_pattern_detections` by:
  - Asset class matches `plan.asset_classes`
  - Exchange matches `plan.stock_exchanges`
  - Pattern name matches `plan.preferred_patterns` (if set)
  - Direction matches `plan.trend_direction` (if not "both")
- Show a subtle badge on each pattern: "Aligned" / "Outside plan" based on universe match
- The manual watchlist stays user-controlled but shows a warning icon on tickers outside the selected plan's universe

**3. Alerts — plan tagging**

- When creating an alert (from Pattern Lab deploy or manual), attach the currently active `master_plan_id`
- In `AlertsHistoryPanel`, show a small plan name badge next to each alert
- Add a filter to view alerts by plan

**4. Shared hook — `useMasterPlanFilter`**

Create a reusable hook that:
- Takes a plan and an instrument/pattern
- Returns whether it's within the plan's universe (asset class, exchange, pattern, direction)
- Used by both WatchlistPanel and AlertsHistoryPanel to show alignment status

**5. UI indicators**

- Patterns/tickers inside plan universe: normal display
- Patterns/tickers outside plan universe: muted with a small "Outside plan" label
- No hard blocking — users can still view everything, but plan-aligned items are visually prioritized

### Files to create/modify

- **New migration**: add `master_plan_id` to `alerts` table
- **Create**: `src/hooks/useMasterPlanFilter.ts` — shared plan-matching logic
- **Modify**: `src/components/command-center/WatchlistPanel.tsx` — add plan selector, filter active patterns, show alignment badges
- **Modify**: `src/components/command-center/AlertsHistoryPanel.tsx` — show plan badge, add plan filter
- **Modify**: `src/components/command-center/CommandCenterLayout.tsx` — pass selected plan context down to panels
- **Modify**: alert creation flow — attach `master_plan_id` when deploying alerts

### What stays the same
- Users can still manually add any ticker to their watchlist
- Alerts without a plan still work (backwards compatible)
- The Copilot AI Gate logic is unchanged — this is purely Dashboard-side awareness

