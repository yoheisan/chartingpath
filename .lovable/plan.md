

# CTA Optimization: Align Hero Buttons with User Behavior Data

## Problem

Current data shows a clear mismatch between CTAs and user intent:

- **"Open Screener"** (primary CTA): Only 3 clicks -- too generic, doesn't communicate what the user will get
- **"Create Alert"** (secondary CTA): 31 clicks but **zero conversions** -- hits an auth wall that kills the funnel
- **Zero backtests completed** -- nobody is reaching the "aha moment" (seeing a validated pattern with win rate + expectancy)

## Changes

### 1. Reframe Primary CTA: "Open Screener" --> "See Today's Setups"

Make the button outcome-oriented. Users don't care about a "screener" -- they care about finding actionable setups.

- **Label**: "See Today's Setups" (with TrendingUp icon instead of Activity)
- **Destination**: Same (`/patterns/live`) -- the screener is ungated and works well
- **Analytics event**: Update button identifier to `hero_see_setups`

### 2. Replace Secondary CTA: "Create Alert" --> "Try a Free Backtest"

Replace the auth-gated dead-end with an ungated entry to Pattern Lab, which is already designed for anonymous first-run usage (try-before-you-buy flow).

- **Label**: "Try a Free Backtest" (with FlaskConical icon)
- **Destination**: `/pattern-lab` (no auth required for first run)
- **Analytics event**: Update button identifier to `hero_try_backtest`
- Remove the auth redirect logic from this button entirely

### 3. Update Action Card for Alerts

The "Create Alert" action card in the grid below still serves its purpose for users who scroll that far -- no change needed there. The hero should focus on activation, not retention features.

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Update hero CTA labels, icons, destinations, and analytics events |

## What This Does NOT Change

- Screener destination remains `/patterns/live`
- Action Cards grid unchanged
- No new components or dependencies
- Alert functionality still accessible via Action Cards section

## Expected Impact

- Higher primary CTA clicks (outcome-oriented copy)
- Users reach Pattern Lab and complete a backtest (the "aha moment")
- Removes the auth wall from the hero funnel entirely
- Measurable via existing `landing.cta_click` tracking with new button identifiers

