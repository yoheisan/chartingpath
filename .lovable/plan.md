

# Redeploy `post-patterns-to-social` Edge Function

## Problem
The `post-patterns-to-social` cron job is firing every 30 minutes, but no pattern alerts have been posted today. The function appears to be failing silently -- no entries in `post_history` and no meaningful logs from the function itself.

## Solution
Redeploy the edge function to clear any stale state or boot failure. The code itself is sound -- no changes needed, just a fresh deployment.

## Steps

1. **Redeploy** the `post-patterns-to-social` edge function as-is (no code changes)
2. **Verify** by checking the edge function logs after the next cron invocation (within 30 minutes) to confirm it boots and processes patterns
3. **Confirm** a new entry appears in `post_history` with `post_type = 'pattern_alert'`

## Expected Outcome
The next cron trigger will invoke a freshly deployed function, which will:
- Pick the best unposted Grade A/B pattern
- Tweet it via the X API (now on pay-per-use, so no 429 errors)
- Record the post in `post_history`

