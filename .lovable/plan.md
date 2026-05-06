## Goal

Stop bot/scanner traffic from polluting analytics and protect the auth forms with Cloudflare Turnstile.

## Part A — Analytics gating (clean up the numbers)

The `analytics_events` table already has an `is_bot_suspect` flag set by `src/lib/analytics.ts`. We just need to actually use it.

1. Update every analytics dashboard query (admin analytics page + any KPI views) to filter `is_bot_suspect = false` by default, with a toggle to "Include suspected bots" for debugging.
2. Strengthen the bot heuristic in `src/lib/analytics.ts`:
   - Block events entirely (not just flag) for known scanner paths with no referrer (e.g. `/wp-login`, `/xmlrpc`, `/phpmyadmin`).
   - Add a `navigator.webdriver` + headless Chrome signature check.
3. Add a small server-side guard: a Postgres trigger on `analytics_events` that drops inserts where `event_name = 'page.view'` and the path matches the scanner regex — belt-and-braces in case the client check is bypassed.

## Part B — Cloudflare Turnstile on auth

1. Store the keys:
   - `TURNSTILE_SITE_KEY` (used in frontend, public)
   - `TURNSTILE_SECRET_KEY` (used in edge function, secret)
2. Add the Turnstile widget to:
   - Sign-up form
   - Sign-in form
   - Password reset form
   The widget runs in "managed" mode (invisible for real users, challenge for suspicious ones).
3. Create a new edge function `verify-turnstile` that:
   - Accepts `{ token }` in the body
   - POSTs to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with the secret
   - Returns `{ success: true/false }`
4. Wire the auth forms to call `verify-turnstile` before calling `supabase.auth.signUp` / `signInWithPassword`. If verification fails, block submission with a clear error.
5. Google OAuth button is unaffected (Google handles its own bot protection).

## Technical details

- **Files touched (Part A)**: `src/lib/analytics.ts`, admin analytics page(s), one new migration for the trigger.
- **Files touched (Part B)**: auth form components (sign-in, sign-up, reset), new `supabase/functions/verify-turnstile/index.ts`, `supabase/config.toml` entry with `verify_jwt = false`.
- **Turnstile widget**: loaded via `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer>` injected once on auth pages only (not globally, to keep landing page light).
- **Failure mode**: if Turnstile script fails to load, fall back to allowing submission but log a warning — we don't want to lock out real users due to a CDN hiccup.
- **No DNS changes needed** on Cloudflare; Turnstile is standalone.

## What I need from you

Confirm and I'll request the two secrets (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`), then ship both parts.
