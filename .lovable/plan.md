

## Multiple Master Plans — Design Plan

### Why It Makes Sense

Yes, this is a strong feature for both user value and monetization:

1. **User value**: Traders often run different strategies (e.g., "Momentum Breakouts" for US stocks, "Mean Reversion" for FX, "Swing Longs" for crypto). A single plan forces them to constantly reconfigure.
2. **Gating**: Multiple plans map naturally to tier limits — FREE gets 1, paid tiers get more.

### Proposed Tier Limits

| Tier | Max Active Plans |
|------|-----------------|
| FREE | 1 |
| LITE | 2 |
| PLUS | 5 |
| PRO  | 10 |
| TEAM | Unlimited |

### What Changes

**1. Database — `master_plans` table update**
- Add a `name` column (text, default "My Trading Plan") so users can label each plan
- Add a `plan_order` column (integer) for sorting
- Remove the "deactivate all others" logic — multiple plans can be `is_active = true`

**2. Plans config — add `maxActivePlans` cap**
- Add `maxActivePlans` to each tier in `plans.ts` (both frontend and edge function copies)

**3. UI — Plan Selector in Copilot**
- Replace the single MandateCard with a plan selector dropdown/tabs showing all active plans
- "New Plan" button (gated by tier limit) opens the builder
- Each plan card shows its name, rule count, and a badge (Active/Inactive)
- Clicking a plan loads its rules into the Copilot context

**4. Trading Plan Builder updates**
- Add a "Plan Name" text input at the top of the builder
- Remove the "deactivate all existing plans" logic on save
- Add a "Duplicate Plan" action for quick iteration
- Show tier-gated message when limit is reached: "Upgrade to create more plans"

**5. Copilot & Paper Trading integration**
- When evaluating a signal, the AI Gate checks the **currently selected** plan (not all plans)
- Add a plan selector to the Copilot header so users can switch context
- Paper trades are tagged with `master_plan_id` so performance can be tracked per-plan

**6. Edge function updates**
- `trading-copilot`: Read the selected plan ID from the request instead of always fetching the single active one
- `projects-run`: No change needed (backtests are independent of master plans)

### Technical Details

Migration SQL:
```sql
ALTER TABLE public.master_plans
  ADD COLUMN IF NOT EXISTS name text DEFAULT 'My Trading Plan',
  ADD COLUMN IF NOT EXISTS plan_order integer DEFAULT 0;
```

Plans config addition (both files):
```typescript
// In TierConfig interface
maxActivePlans: number;

// In tiers
FREE:  { maxActivePlans: 1,  ... },
LITE:  { maxActivePlans: 2,  ... },
PLUS:  { maxActivePlans: 5,  ... },
PRO:   { maxActivePlans: 10, ... },
TEAM:  { maxActivePlans: 99, ... },
```

Files to modify:
- `supabase/migrations/` — new migration for `name` and `plan_order` columns
- `src/config/plans.ts` + `supabase/functions/_shared/plans.ts` — add `maxActivePlans`
- `src/hooks/useMasterPlan.ts` — fetch all active plans, track selected plan
- `src/components/copilot/MandateCard.tsx` — plan selector UI
- `src/components/copilot/TradingPlanBuilder.tsx` — plan naming, remove deactivation logic, tier gate
- `src/components/copilot/TradingCopilot.tsx` — pass selected plan context

