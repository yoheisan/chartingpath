

# Auto-Discover 10,000 Finance/Trading X Accounts

## Strategy: "Snowball Discovery"

Start with your 60 known trading influencers as **seed accounts**, then automatically crawl who they follow and who follows them. Finance/trading accounts cluster together -- people who follow 3+ of your seeds are very likely in the same niche.

## How It Works

1. **Seed accounts** -- your existing 60 handles
2. **Crawl "following" lists** -- the X API endpoint `GET /2/users/:id/following` returns up to 1000 accounts per call (15 calls per 15 min)
3. **Score candidates** -- if a discovered account appears in multiple seed "following" lists, it's likely a legit finance account
4. **Auto-enqueue** -- accounts above a threshold get added to `x_follow_queue` automatically

At ~60 seeds x ~1000 following each = up to 60,000 candidate accounts. After deduplication and scoring, 10,000+ quality accounts is very achievable.

## What I'll Build

### 1. New Edge Function: `discover-x-accounts`

- **Action: `crawl_following`** -- Takes a seed user ID, calls the X API to fetch their "following" list (paginated, up to 1000), and stores results in a new `x_discovered_accounts` table
- **Action: `score_and_enqueue`** -- Queries discovered accounts, scores them by how many seeds follow them, and bulk-inserts top candidates into `x_follow_queue`
- Uses the same OAuth 1.0a auth already configured

### 2. New Database Table: `x_discovered_accounts`

```text
id               UUID (PK)
user_id          TEXT (unique) -- X user ID
username         TEXT
name             TEXT
followers_count  INT
following_count  INT
discovered_via   TEXT[] -- array of seed user IDs that follow this account
discovery_count  INT -- how many seeds follow them (score)
status           TEXT -- 'discovered', 'approved', 'rejected', 'enqueued'
created_at       TIMESTAMPTZ
```

### 3. Cron Job for Gradual Crawling

A pg_cron job runs every 5 minutes, picks the next seed account that hasn't been crawled yet, and fetches their following list. This stays within rate limits (15 req/15 min) and completes all 60 seeds in about 5 hours.

### 4. CMS UI: "Discovery" Tab

A new tab in the Social Media CMS with:
- **Seed Management** -- view/add seed accounts to crawl
- **Discovery Progress** -- how many seeds crawled, total accounts found
- **Candidate Review** -- table of discovered accounts sorted by score, with bulk "Approve and Enqueue" button
- **Filters** -- minimum score threshold, minimum follower count

## Rate Limit Math

- X API allows 15 "following" lookups per 15 minutes
- Each returns up to 1,000 accounts
- 60 seeds = ~4-5 hours to fully crawl
- Result: 10,000-30,000 unique candidate accounts after dedup

## Technical Details

### Files to Create
- `supabase/functions/discover-x-accounts/index.ts` -- edge function for crawling and scoring
- `src/components/cms/DiscoveryManager.tsx` -- CMS UI component

### Files to Modify
- `src/pages/SocialMediaCMS.tsx` -- add "Discovery" tab
- Database migration -- create `x_discovered_accounts` table and cron job

### Dependencies
- No new packages needed
- Reuses existing Twitter OAuth 1.0a helpers from `auto-follow-x`
