
# Phase 1: Proof-of-Edge Social Layer

## Overview
Build a public community feed where users share verified backtest results and live pattern detections as "Edge Cards" -- each card shows auto-attached, platform-verified stats (win rate, expectancy, R:R, sample size) that cannot be faked. This creates a unique differentiator vs traditional trading forums full of unverified claims.

## What Gets Built

### 1. Community Feed Page (`/community`)
A public-facing feed (no auth required to browse) showing Edge Cards sorted by recency, with filters for asset type, pattern, and direction. Think of it as a curated, data-verified Twitter feed for trading setups.

- **Edge Cards** come in two flavors:
  - **Backtest Cards** -- sourced from `backtest_runs` where `is_shared = true`. Shows instrument, pattern, timeframe, win rate, profit factor, Sharpe, total trades, and a mini equity curve sparkline.
  - **Live Detection Cards** -- sourced from `live_pattern_detections` where `share_token IS NOT NULL`. Shows instrument, pattern, direction, entry/SL/TP, quality score, R:R, and a mini candlestick thumbnail.

- Each card has a "Verified by ChartingPath" badge indicating the stats are platform-computed, not self-reported.
- Cards link to the full shared view (`/share/:token` or `/s/:token`).
- Anonymous visitors can browse freely; auth is only needed to like/bookmark.

### 2. Engagement Layer (Auth Required)
- **Like** (heart icon) -- uses the existing `strategy_likes` table pattern
- **Bookmark** (save for later) -- new lightweight table
- Like counts displayed on each card

### 3. Leaderboard Sidebar
A "Top Edges This Week" sidebar/section ranking shared setups by:
- Highest expectancy (R)
- Best win rate (min 30 trades)
- Most liked

### 4. "Share to Community" Integration
Add a toggle/button to the existing share flows:
- In `StrategyWorkspaceInterface.tsx` (backtest sharing) -- add "Also post to Community Feed" checkbox
- In `useSharePattern.ts` (pattern sharing) -- same toggle
- When enabled, a flag is set (`is_community_shared = true`) so the feed query picks it up

## Database Changes

### New columns (migration):
```sql
-- Add community visibility flag to backtest_runs
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS is_community_shared boolean DEFAULT false;

-- Add community visibility flag to live_pattern_detections  
ALTER TABLE live_pattern_detections ADD COLUMN IF NOT EXISTS is_community_shared boolean DEFAULT false;

-- Community bookmarks table
CREATE TABLE IF NOT EXISTS community_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('backtest', 'detection')),
  content_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Community likes table (generic, replaces strategy_likes for this context)
CREATE TABLE IF NOT EXISTS community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('backtest', 'detection')),
  content_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- RLS: anyone can read, only authenticated users can insert/delete their own
ALTER TABLE community_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes" ON community_likes FOR SELECT USING (true);
CREATE POLICY "Auth users manage own likes" ON community_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read bookmarks" ON community_bookmarks FOR SELECT USING (true);
CREATE POLICY "Auth users manage own bookmarks" ON community_bookmarks FOR ALL USING (auth.uid() = user_id);
```

## New Files

| File | Purpose |
|------|---------|
| `src/pages/CommunityFeed.tsx` | Main feed page with filters, card grid, leaderboard sidebar |
| `src/components/community/EdgeCard.tsx` | Reusable card component for both backtest and detection edges |
| `src/components/community/LeaderboardSidebar.tsx` | Top edges ranking widget |
| `src/components/community/CommunityFilters.tsx` | Asset type, pattern, direction filter bar |
| `src/hooks/useCommunityFeed.ts` | Data fetching hook -- queries `backtest_runs` and `live_pattern_detections` where `is_community_shared = true` |
| `src/hooks/useCommunityEngagement.ts` | Like/bookmark mutations |

## Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/community` route |
| `src/components/StrategyWorkspaceInterface.tsx` | Add "Share to Community" toggle in share flow |
| `src/hooks/useSharePattern.ts` | Add `is_community_shared` flag update |

## Technical Notes
- The feed query unions `backtest_runs` and `live_pattern_detections` on the client side (two parallel queries, merged and sorted by date).
- Like counts are fetched via a count query grouped by `content_id` -- no denormalized counter needed initially.
- The feed is publicly accessible (no auth wall), which directly addresses the "auth wall blocks discovery" issue from the behavior report.
- Mini charts reuse existing `ThumbnailChart` component for detection cards, and a simple Recharts sparkline for backtest equity curves.
