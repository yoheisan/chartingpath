# Upgrade Cadence & Conversion Funnel — Feature Audit

> Last updated: 2026-02-23

## Overview

A comprehensive upgrade cadence system that guides users through the conversion funnel:
**Unregistered → Free → Lite → Plus → Pro → Team**

The system uses contextual banners, modals, and interstitials triggered by credit exhaustion, feature gates, and plan limits to encourage tier progression.

---

## New Components (`src/components/upgrade/`)

| Component | Purpose |
|---|---|
| `UpgradePrompt` | Unified modal with plan comparison — used across all gated features. Shows current vs next tier side-by-side with monthly credits and active alerts comparison. |
| `CreditUsageBar` | Shows remaining credits with progress bar. **Compact mode** for headers/sidebars, **full mode** with upgrade CTA when credits are low or exhausted. |
| `DashboardUpgradeNudge` | Dismissible banner for free-tier users. Re-appears after a **7-day cooldown** (stored in `localStorage`). Placed on the Projects page. |
| `PostActionUpsell` | Interstitial shown after a gated action (last credit used, alert limit hit, last backtest, last free generation). Celebrates the completed action while nudging upgrade. |

### Barrel Export

```ts
// src/components/upgrade/index.ts
export { UpgradePrompt, type UpgradeContext } from './UpgradePrompt';
export { CreditUsageBar } from './CreditUsageBar';
export { DashboardUpgradeNudge } from './DashboardUpgradeNudge';
export { PostActionUpsell, type UpsellTrigger } from './PostActionUpsell';
```

---

## Supporting Hook

### `useCredits` (`src/hooks/useCredits.tsx`)

Fetches credit balance from the `usage_credits` table and maps raw plan tier strings to the internal `PlanTier` enum.

**Returns:**
| Field | Type | Description |
|---|---|---|
| `balance` | `number` | Current credit balance |
| `monthlyAllocation` | `number` | Total credits per month for the plan |
| `planTier` | `PlanTier` | Mapped tier (`FREE`, `LITE`, `PLUS`, `PRO`, `TEAM`) |
| `planName` | `string` | Display name of the plan |
| `usagePercent` | `number` | `balance / monthlyAllocation * 100` (capped at 100) |
| `isLow` | `boolean` | `true` when < 20% credits remaining |
| `isExhausted` | `boolean` | `true` when balance ≤ 0 |
| `loading` | `boolean` | Loading state |
| `refetch` | `() => Promise<void>` | Manual refetch function |

**Plan mapping:**
```
free       → FREE
starter    → LITE
pro        → PRO
pro_plus   → PRO
elite      → TEAM
```

---

## Analytics Tracking

Every banner and modal fires analytics events for tier-based conversion tracking.

### Events Added

| Event | Fired When |
|---|---|
| `upgrade_banner_shown` | Dashboard nudge banner becomes visible |
| `upgrade_banner_clicked` | User clicks CTA on the dashboard nudge |
| `upgrade_banner_dismissed` | User dismisses the dashboard nudge |
| `paywall_shown` | Any upgrade modal/prompt opens (UpgradePrompt, PostActionUpsell, CreditUsageBar trigger) |
| `upgrade_clicked` | User clicks "View All Plans" or "Upgrade Now" in any modal |

### Event Properties

All `paywall_shown` events include:
```json
{
  "context": "credits_exhausted | credits_low | feature_gated | alert_limit | backtest_limit | timeframe_gated | dashboard_nudge | post_action_*",
  "current_plan": "FREE | LITE | PLUS | PRO | TEAM",
  "limit_type": "credits | <trigger_name>"
}
```

This enables tracking **impression counts by tier** in the admin analytics dashboard.

---

## Upgrade Contexts

The `UpgradePrompt` supports these contexts, each with tailored copy:

| Context | Title | When Used |
|---|---|---|
| `credits_exhausted` | "You've used all your credits" | Credit balance hits 0 |
| `credits_low` | "Credits running low" | < 20% credits remaining |
| `feature_gated` | "Unlock this feature" | Accessing a tier-locked feature |
| `alert_limit` | "Alert limit reached" | Max active alerts for plan |
| `backtest_limit` | "Backtest limit reached" | Daily backtest cap hit |
| `timeframe_gated` | "Unlock more timeframes" | Intraday timeframes on free plan |
| `dashboard_nudge` | "Get more from ChartingPath" | Persistent dashboard banner |

## Upsell Triggers

The `PostActionUpsell` supports these triggers:

| Trigger | Title | When Used |
|---|---|---|
| `last_credit_used` | "That was your last credit!" | Final credit consumed |
| `last_backtest` | "Great backtest! Want more?" | Last free backtest completed |
| `alert_limit_hit` | "Alert limit reached" | Alert created at plan cap |
| `last_free_generation` | "Script generated! Need more?" | Last free Pine script export |

---

## Integration Points

### Projects Page (`src/pages/Projects.tsx`)
- `CreditUsageBar` (compact mode) in the header area
- `DashboardUpgradeNudge` below the project grid

### Usage in Any Gated Page

```tsx
import { UpgradePrompt, PostActionUpsell } from "@/components/upgrade";

// When credits are exhausted:
<UpgradePrompt
  open={show}
  onOpenChange={setShow}
  currentTier="FREE"
  context="credits_exhausted"
/>

// After last backtest:
<PostActionUpsell
  open={show}
  onOpenChange={setShow}
  trigger="last_backtest"
  currentTier="FREE"
  completedAction="Backtest completed!"
/>

// Credit bar in a sidebar:
<CreditUsageBar compact />
```

---

## Configuration

Plan tiers, credit allocations, and display metadata are defined in `src/config/plans.ts` via `PLANS_CONFIG` and `TIER_DISPLAY`.

## Dependencies

- `@/contexts/AuthContext` — User session
- `@/integrations/supabase/client` — Credit balance queries
- `@/services/analytics` — Event tracking
- `react-router-dom` — Navigation to `/pricing`
