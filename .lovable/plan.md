

# Sprint 1: Funnel Unblock — Implementation Plan

TypeScript-only changes. No SQL migrations.

## Change 1 — Auth.tsx: Redirect cold `/auth/` traffic to screener

**File**: `src/pages/Auth.tsx`

Add a new `useEffect` immediately after the existing "already authenticated" redirect block (after line ~120, before the `recoveryHint` effect). This handles **unauthenticated** cold arrivals (the existing block only handles authenticated users).

```tsx
// Redirect cold /auth/ traffic (no context, external referrer) to screener
useEffect(() => {
  if (isAuthLoading || authUser) return; // wait for auth, skip if logged in
  if (hasRedirectedRef.current) return;

  const hasRedirect = searchParams.get('redirect');
  const isReset =
    searchParams.get('reset') ||
    searchParams.get('type') === 'recovery' ||
    isResetPassword ||
    isForgotPassword;
  const ref = document.referrer || '';
  const isFromApp =
    ref.includes('chartingpath.com') ||
    ref.includes('lovableproject.com') ||
    ref.includes('lovable.app') ||
    ref.includes('lovable.dev');

  if (!hasRedirect && !isReset && !isFromApp) {
    hasRedirectedRef.current = true;
    trackEvent('auth.cold_redirect', { destination: '/patterns/live' });
    navigate('/patterns/live?from=auth', { replace: true });
  }
}, [isAuthLoading, authUser, searchParams, isResetPassword, isForgotPassword, navigate]);
```

## Change 2 — Sticky "Sign up to save" banner on screener for `?from=auth`

**File**: `src/pages/LivePatternsPage.tsx` (or whichever component renders `/patterns/live`)

Detect `?from=auth` in URL and render a dismissible top banner pointing to signup. New small component `src/components/screener/SignupNudgeBanner.tsx`:

- Reads `useSearchParams()` for `from=auth`
- Hidden if user is authenticated or banner dismissed (sessionStorage `cp_signup_nudge_dismissed`)
- Copy: "Browse free — sign up to save scans, set alerts, and track your edge."
- CTA buttons: "Sign up free" → `/auth?redirect=/patterns/live`, "View pricing" → `/pricing`
- Fires `trackEvent('signup_nudge.shown')` and `signup_nudge.cta_click`

Mount near the top of the live patterns page.

## Change 3 — Promote Pricing to top-level desktop nav

**File**: `src/components/Navigation.tsx`

Currently Pricing is buried in **More → Company** (line 327–332) and on mobile at line 146.

- Add a top-level desktop nav link **after** "Pattern Lab" (line 225) and **before** the "More" dropdown:
  ```tsx
  <Link to="/pricing" className={navLinkClass('/pricing')}>
    <DollarSign className="h-4 w-4 text-emerald-500" />
    {t('navigation.pricing', 'Pricing')}
  </Link>
  ```
- Remove the duplicate Pricing entry from the "More → Company" dropdown (lines 327–332).
- Mobile menu (line 146) — change route from `/projects/pricing` to `/pricing` for consistency.

## Change 4 — Default billing toggle to Annual

**Files**:
- `src/pages/Pricing.tsx` line 30: `useState<'monthly' | 'annual'>('monthly')` → `'annual'`
- `src/components/landing/PricingTeaser.tsx` line 15: same change

Add a small "Save with annual" microcopy chip next to the toggle when annual is active (already shows savings badge per plan, so this is optional — leave as-is unless desired).

## Change 5 — Wire `paywall_shown` on the homepage guest blur gate

**File**: `src/components/landing/PatternScreenerTeaser.tsx`

The blur gate (line 404) is shown to every guest visitor but never fires the `paywall_shown` event — this is the single highest-volume gate in the funnel.

- Import `track` from `@/services/analytics`.
- Add a `useEffect` that fires `track('paywall_shown', { context: 'landing_screener_blur_gate', current_plan: 'GUEST', limit_type: 'guest_pattern_limit' })` once per session (guard with a `useRef` flag) when the blur gate becomes visible for the active tab.
- The "Sign up to unlock" button inside the blur overlay should also fire `track('pricing_clicked', { source: 'landing_blur_gate' })` on click.

## Translations

New keys to add to `src/i18n/locales/en.json` (and optionally other 17 locales — can run in a follow-up i18n pass):
- `signupNudge.headline` — "Browse free — sign up to save scans"
- `signupNudge.signupCta` — "Sign up free"
- `signupNudge.pricingCta` — "View pricing"
- `signupNudge.dismiss` — "Dismiss"

## Files Touched

| File | Change |
|---|---|
| `src/pages/Auth.tsx` | Add cold-traffic redirect effect |
| `src/components/screener/SignupNudgeBanner.tsx` | **New** — sticky banner |
| `src/pages/LivePatternsPage.tsx` | Mount banner |
| `src/components/Navigation.tsx` | Promote Pricing to top-level, dedupe |
| `src/pages/Pricing.tsx` | Default billing = annual |
| `src/components/landing/PricingTeaser.tsx` | Default billing = annual |
| `src/components/landing/PatternScreenerTeaser.tsx` | Fire `paywall_shown` + `pricing_clicked` |
| `src/i18n/locales/en.json` | Add `signupNudge.*` keys |

## Out of Scope (Future Sprints)

- Homepage restructure (Sprint 2)
- Magic-link signup (Sprint 3)
- Admin funnel dashboard (Sprint 3)
- "Most Popular" badge & locked-feature peeks beyond the existing blur gate

## Decisions Confirmed

- Auth redirect destination: `/patterns/live?from=auth`
- Pricing route: `/pricing` (canonical, not `/projects/pricing`)
- Annual as default for both pricing surfaces

