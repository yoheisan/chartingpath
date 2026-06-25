# Fix: "AI Analysis Failed" on /admin/journey-analytics

## Root cause

The admin "Run AI Analysis" button calls the `analyze-journey-insights` edge function. Its logs show every invocation returning:

```
Gemini API error: 404
"This model models/gemini-2.0-flash is no longer available."
```

Google retired `gemini-2.0-flash`. The function still hardcodes that model ID, so 100% of calls 404 and the UI shows the generic "AI Analysis Failed" toast.

## Fix

1. In `supabase/functions/analyze-journey-insights/index.ts`, replace the `gemini-2.0-flash` model id with `gemini-2.5-flash` (the fast tier already standardized in Hybrid Model Routing v4). No other logic change needed.
2. Redeploy is automatic.
3. Verify by clicking "Run AI Analysis" on `/admin/journey-analytics` and confirming a success toast + populated analysis panel; tail the edge function logs to confirm no 404.

## Optional follow-up (not required for this fix)

- Surface the actual error message from the edge function in the toast instead of the generic "Check edge function logs" so future model deprecations are visible without opening Supabase.
- Grep for other edge functions still pinned to `gemini-2.0-flash` / `gemini-1.5-*` and bump them in one pass.
