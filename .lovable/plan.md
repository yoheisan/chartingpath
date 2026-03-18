

# Signup & PMF Gap Analysis

## Current State Summary

After reviewing the landing page, auth flow, onboarding, guest gating, and conversion components, here is what exists and what is missing.

### What Already Works
- Landing page with live pattern previews, metric strip, CTA hierarchy
- Guest screener overlay gating (shows N of M signals, prompts signup)
- Google Sign-In + email auth with abandonment tracking
- 5-step onboarding tour post-signup
- Welcome email + getting-started drip (24h delay)
- Bottom-bar signup nudge for guests
- Mid-page signup CTA block
- Auth funnel analytics in admin daily report (views, starts, submissions, abandons)
- Scroll depth tracking on landing page

---

## Critical Gaps — Ranked by Impact

### 1. No Social Proof / Testimonials
There are zero testimonials, user counts, or community proof anywhere on the landing page or auth page. For a niche tool, this is the single biggest trust gap. Visitors see metrics about the product but nothing from real users.

**Recommendation**: Add a compact "What traders say" section on the landing page (between LivePatternPreview and HowItWorks) and a sidebar proof strip on the Auth page. Even 3 short quotes with avatar/alias would materially improve conversion.

### 2. Auth Page Has No Value Reinforcement
The signup page (`Auth.tsx`) is a bare form. There is no reminder of what the user gets by signing up — no feature bullets, no "what you'll unlock" panel. Users who arrive via direct link or SEO lose all landing page context.

**Recommendation**: Add a left-panel or header strip on the auth page showing 3-4 value props (e.g., "Unlock all live signals", "50 free credits", "Pattern alerts") — similar to what Notion, Linear, etc. do.

### 3. No Exit-Intent or Time-Delayed Signup Prompt
The bottom nudge bar is easily dismissed and never returns (persisted in localStorage). There is no exit-intent modal or scroll-triggered prompt for users who engage deeply but don't convert.

**Recommendation**: Add a scroll-depth triggered modal (fires once when user has scrolled past 60% of landing page and spent >30s) offering signup. Use sessionStorage so it only fires once per visit.

### 4. No Email Capture for Non-Signup Users
There is no lightweight email capture (e.g., "Get weekly pattern reports" or "Get notified of Grade A setups"). Users who aren't ready to create an account have zero way to stay connected.

**Recommendation**: Add an email-only capture form on the landing page (before pricing section) that feeds into a Supabase `email_leads` table. This creates a remarketing channel without requiring full signup.

### 5. GuestScreenerOverlay Is Not Translated
The overlay text ("You're seeing X of Y live signals", "Create a free account to unlock...") is hardcoded in English. For a platform supporting 17 languages, this breaks the conversion funnel for non-English users.

**Recommendation**: Move all strings in `GuestScreenerOverlay.tsx` to i18n translation keys.

### 6. No Post-Signup Activation Loop
The onboarding tour shows features but doesn't guide the user to complete a specific high-value action (e.g., "Run your first backtest" or "Set your first alert"). There is no activation checklist or progress tracker.

**Recommendation**: Replace the modal tour with a persistent "Getting Started" checklist widget (3 items: view a live signal, run a backtest, set an alert) that appears on the dashboard until completed. Track completion in a `user_activation` table.

### 7. Pricing Friction on Landing Page
The pricing teaser shows 3 plans but the free plan has no CTA button. Users see "Free" but have no immediate action to take. The "See Full Pricing" link adds an extra click.

**Recommendation**: Add a "Start Free" button directly on the free plan card in the PricingTeaser, linking to `/auth?mode=signup`.

---

## Quick Wins (< 1 hour each)

| Item | File(s) | Impact |
|------|---------|--------|
| Translate GuestScreenerOverlay | `GuestScreenerOverlay.tsx`, `en.json` | Unblocks non-English signups |
| Add "Start Free" CTA to pricing free tier | `PricingTeaser.tsx` | Reduces friction |
| Add value props to Auth page | `Auth.tsx` | Increases form completion |
| Add Google Sign-In to GuestScreenerOverlay | `GuestScreenerOverlay.tsx` | 1-click signup at point of intent |

## Medium Efforts (2-4 hours each)

| Item | Files | Impact |
|------|-------|--------|
| Social proof section on landing | New component + `Index.tsx` | Trust building |
| Email lead capture form | New component + DB migration | Remarketing channel |
| Scroll-triggered signup modal | New component + `Index.tsx` | Captures engaged non-converters |
| Activation checklist widget | New component + DB table | Improves retention post-signup |

---

## Recommended Implementation Order

1. Translate GuestScreenerOverlay (immediate — currently losing non-English conversions)
2. Add value reinforcement to Auth page
3. Add "Start Free" button to pricing teaser
4. Add Google Sign-In to GuestScreenerOverlay
5. Build social proof / testimonials section
6. Build email lead capture
7. Build scroll-triggered signup modal
8. Build activation checklist

Would you like me to implement any or all of these?

