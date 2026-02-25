

# GA4 Integration via OAuth2 Refresh Token

## Problem
Google Cloud organization policy blocks service account key creation. We need an alternative authentication method for the GA4 edge function.

## Solution
Replace the service account JWT flow with an OAuth2 refresh token flow. This uses your personal Google account authorization instead of a service account key.

## How It Works

```text
One-time setup (you do manually):
  Google OAuth Consent Screen
    -> Authorize with your Google account
    -> Get authorization code
    -> Exchange for refresh_token
    -> Store refresh_token as Supabase secret

Every API call (edge function does automatically):
  refresh_token -> Google token endpoint -> access_token -> GA4 Data API
```

## Setup Steps (you do once)

1. Go to Google Cloud Console (can use any account that has access to the GA4 property)
2. Create OAuth2 credentials (type: Web Application) with redirect URI set to `https://developers.google.com/oauthplayground`
3. Go to Google OAuth Playground (https://developers.google.com/oauthplayground)
4. Configure it to use your own OAuth credentials (Settings gear icon)
5. Authorize the scope: `https://www.googleapis.com/auth/analytics.readonly`
6. Exchange the authorization code for tokens
7. Copy the `refresh_token` value
8. Add three Supabase secrets:
   - `GA4_OAUTH_CLIENT_ID` -- from step 2
   - `GA4_OAUTH_CLIENT_SECRET` -- from step 2  
   - `GA4_OAUTH_REFRESH_TOKEN` -- from step 6

## Code Changes

### 1. Update Edge Function: `supabase/functions/ga4-report/index.ts`

Replace the service account JWT authentication block with a simpler OAuth2 refresh token flow:

- Remove: JWT creation, private key import, crypto signing (lines ~85-135)
- Remove: `GA4_SERVICE_ACCOUNT_JSON` secret requirement
- Add: Read `GA4_OAUTH_CLIENT_ID`, `GA4_OAUTH_CLIENT_SECRET`, `GA4_OAUTH_REFRESH_TOKEN` from env
- Add: POST to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token` to get an access_token
- Keep: All existing GA4 Data API queries unchanged (pages, sources, devices)
- Update: Setup-required error message to reference the new secrets

### 2. Update Frontend: `src/components/admin/GA4Panel.tsx`

- Update the setup instructions in the `setupRequired` block to reference the new OAuth2 secrets instead of `GA4_SERVICE_ACCOUNT_JSON`
- Add step-by-step instructions for the OAuth Playground flow
- Update the Supabase secrets link

## Technical Details

The token exchange request is straightforward:

```text
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

client_id=...&client_secret=...&refresh_token=...&grant_type=refresh_token
```

Response contains `access_token` which is used identically to the current flow for GA4 API calls. No other code changes needed -- the rest of the edge function (API queries, response formatting) stays the same.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/ga4-report/index.ts` | Replace service account auth with OAuth2 refresh token |
| `src/components/admin/GA4Panel.tsx` | Update setup instructions for OAuth2 flow |

