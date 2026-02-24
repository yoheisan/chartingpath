

# Bring the Dashboard Forward: Public Preview Mode

## Problem
The most impressive feature — a TradingView-style command center with live charts, pattern overlays, watchlists, and market overview — is completely invisible until registration. Users have no idea what they're signing up for.

## Strategy
Apply the same auth-gate pattern used on Screener and Pattern Lab: **show the full dashboard UI to everyone**, but gate write actions (save watchlist, set alerts, enable playback) behind the `AuthGateDialog`.

## Implementation Steps

### 1. Remove hard auth redirect from MemberDashboard
- Replace `useRequireAuth()` with `useAuth()` in `MemberDashboard.tsx`
- Pass `userId` as optional (already typed as `userId?: string` in `CommandCenterLayout`)
- Show the full layout for anonymous users with no redirect

### 2. Gate write actions inside CommandCenterLayout
- Add `useAuthGate` hooks to:
  - **Save to watchlist** -- prompt sign-in
  - **Create alert** from dashboard -- prompt sign-in
  - **Trade playback** -- prompt sign-in
  - **Dashboard settings persistence** -- silently skip for anon users
- Read-only features remain fully open: chart viewing, pattern overlay display, market overview, pattern study

### 3. Add a subtle auth nudge banner
- When `!user`, show a slim top banner inside the dashboard: *"Sign in to save your watchlist and create alerts"* with a CTA button
- Dismissible, non-blocking

### 4. Update routing and navigation
- Remove `/members/dashboard` from any auth-required route guards
- Keep the route path unchanged (no URL break)
- Add "Dashboard" as a visible nav item for all users (currently only shows for authenticated users in the navigation/account menu)
- Update `FULLSCREEN_ROUTES` handling in `Layout.tsx` -- no changes needed, it already works by path

### 5. Landing page connection
- Add a "Preview Dashboard" CTA or action card on the landing page linking to `/members/dashboard`
- This gives new visitors a direct path to see the most powerful feature

## What Stays Gated
| Feature | Anonymous | Authenticated |
|---------|-----------|---------------|
| View chart + patterns | Yes | Yes |
| Market overview panel | Yes | Yes |
| Pattern study / details | Yes | Yes |
| Save watchlist | AuthGate | Yes |
| Create alert | AuthGate | Yes |
| Trade playback | AuthGate | Yes |
| Dashboard settings save | Skip silently | Yes |

## Technical Details

### Files to modify:
- `src/pages/MemberDashboard.tsx` -- remove `useRequireAuth`, use `useAuth` instead
- `src/components/command-center/CommandCenterLayout.tsx` -- wrap write actions with `useAuthGate`, add auth nudge banner when no user
- `src/components/command-center/WatchlistPanel.tsx` -- gate save/edit with `useAuthGate`
- `src/components/command-center/AlertsHistoryPanel.tsx` -- gate alert creation with `useAuthGate`
- `src/components/Navigation.tsx` -- expose Dashboard link to all users
- `src/pages/Index.tsx` -- add Dashboard action card or CTA

### No new dependencies, no new DB queries, no compute impact
This is purely a frontend visibility change. All data queries already work without a user ID (charts, patterns, market overview use public data). Only user-specific persistence (watchlists, alerts, settings) requires auth.

