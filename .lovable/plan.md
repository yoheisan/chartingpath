
The user wants the industry-standard flow: anonymous users can start checkout immediately (Dodo collects email + payment, then we provision the account), instead of being bounced to Google auth first.

## Current behavior (the problem)
In `src/hooks/useCheckout.ts`:
```ts
if (!session) {
  window.location.href = '/auth?mode=signup&plan=' + planKey;
  return;
}
```
Any unauthenticated click on "Get Lite / Pro / Elite" redirects to `/auth`. That's why "Get Lite" lands on the Google login page.

The edge function `create-checkout-session` also requires `Authorization` header and rejects anonymous calls with 401.

## Industry-standard flow we'll implement
1. **Anonymous user clicks "Get Lite"** → call edge function without auth → Dodo checkout opens immediately → user enters email + card on Dodo's hosted checkout → after payment, webhook fires with email + product_id → we provision/link the account by email → user lands on `/dashboard` (or `/auth/claim` if they need to set a password).
2. **Logged-in user clicks a paid plan** → same edge function, with auth → metadata includes `user_id` → webhook updates that user's `subscription_plan` (works for upgrades/downgrades automatically since Dodo manages the subscription).

## Changes required

### 1. `src/hooks/useCheckout.ts` — remove the auth gate
- Stop redirecting to `/auth` when no session.
- Always call `create-checkout-session`. Pass session token only if it exists (use `fetch` directly with the public anon key so the function is callable anonymously, or keep `supabase.functions.invoke` which already sends anon key when no user session).

### 2. `supabase/functions/create-checkout-session/index.ts` — allow anonymous
- Drop the hard 401 when no `Authorization` header.
- If a valid user token is present → use that user's email/id (logged-in upgrade/downgrade path).
- If not → accept an optional `email` from the request body (optional — Dodo collects it on checkout if omitted) and omit `user_id` from metadata. Always include `plan_key` in metadata so the webhook knows which plan to provision.
- Keep `return_url` → `https://chartingpath.com/dashboard`.

### 3. `supabase/config.toml` — make the function public
- Set `verify_jwt = false` for `create-checkout-session` so anonymous calls aren't rejected at the gateway.

### 4. `supabase/functions/dodo-webhook/index.ts` — provision-by-email for anonymous purchases
- When webhook arrives without `user_id` in metadata, look up the user by `customer.email`:
  - If a `user_profiles` row exists for that email → update `subscription_plan` / `subscription_status` / `subscription_id`.
  - If not → create the auth user via `supabase.auth.admin.createUser({ email, email_confirm: true })`, then upsert the `user_profiles` row with the new plan, and trigger a magic-link / password-setup email via `supabase.auth.admin.generateLink({ type: 'recovery', email })` so the buyer can claim the account on first visit.
- Existing logged-in path (with `user_id` in metadata) is unchanged → handles upgrade/downgrade for registered users out of the box.

### 5. `src/pages/ProjectsPricing.tsx`, `src/pages/Pricing.tsx`, `src/components/landing/PricingTeaser.tsx` — UI copy
- No structural change — `useCheckout` already drives every paid CTA. Just confirm button labels read "Start Free Trial" (Pro/Elite, 7-day trial) or "Get Lite" (no trial), and that they no longer flash "Sign in" intermediates.

## Verification
- Logged-out: click "Get Lite" on `/pricing` → should land directly on Dodo's hosted checkout (test mode) with email field visible.
- Logged-in: click "Upgrade to Pro" → should land on Dodo checkout with email pre-filled, no auth detour.
- After test payment → webhook logs should show either "Activated lite for user <id>" (logged-in) or "Provisioned new account for <email>" (anonymous).

## Out of scope
- No SQL migrations needed — `user_profiles` already has `subscription_plan`, `subscription_status`, `subscription_id`.
- We're not changing the trial-day mapping or product IDs.
