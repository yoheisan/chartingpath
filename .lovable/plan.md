

## Auto-Follow X Users -- Steady Drip System

### Overview
Build an edge function + cron job that follows X users from a queue at a safe, steady pace to avoid hitting Twitter/X API rate limits.

### X API Rate Limits
- **Follow endpoint** (`POST /2/users/:id/following`): 5 requests per 15 minutes (free tier), up to 15/15min on Basic tier
- Safe approach: **1 follow every 5 minutes** (12/hour, ~288/day) stays well within limits

### Architecture

```text
[Admin provides user IDs]
        |
        v
  x_follow_queue (DB table)
        |
  [cron: every 5 min]
        |
        v
  auto-follow-x (edge function)
   - picks 1 pending user
   - calls POST /2/users/:id/following
   - marks as followed or failed
```

### Step 1: Database table for the follow queue

Create `x_follow_queue` with columns:
- `id` (UUID, PK)
- `target_user_id` (TEXT) -- the X user ID to follow
- `target_username` (TEXT, nullable) -- optional for reference
- `status` (TEXT: pending / followed / failed / skipped)
- `error_message` (TEXT, nullable)
- `attempted_at` (TIMESTAMPTZ, nullable)
- `created_at` (TIMESTAMPTZ)

RLS: admin-only access via `is_admin()`.

### Step 2: Edge function `auto-follow-x`

Two actions:
1. **`follow_next`** (called by cron): picks the oldest `pending` row, calls the X API follow endpoint using existing OAuth credentials, updates status
2. **`add_users`** (called manually): accepts a JSON array of `{ user_id, username? }` objects and bulk-inserts them into the queue

The X API call:
```
POST https://api.x.com/2/users/:authenticated_user_id/following
Body: { "target_user_id": "..." }
```

Uses the same OAuth 1.0a signature generation already in `post-to-social-media`.

### Step 3: Cron job

Schedule via `pg_cron` + `pg_net`: run `auto-follow-x` every 5 minutes. At that rate, a list of 500 users would complete in ~42 hours (~1.7 days).

### Step 4: Admin UI (optional)

A simple section in the existing admin area to:
- Paste a list of user IDs (one per line)
- See queue progress (pending / followed / failed counts)

### Technical Details

- **Getting the authenticated user ID**: The function will call `GET /2/users/me` once (cached) to get the source user ID for the follow call
- **Error handling**: If rate-limited (429), mark row as pending (retry next cycle). If user not found or already followed, mark as skipped.
- **Duplicate prevention**: UNIQUE constraint on `target_user_id` to avoid re-following
- **Config in `supabase/config.toml`**: `[functions.auto-follow-x] verify_jwt = false`

