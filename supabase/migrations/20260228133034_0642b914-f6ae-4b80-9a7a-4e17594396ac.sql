
-- Add community visibility flag to backtest_runs
ALTER TABLE backtest_runs ADD COLUMN IF NOT EXISTS is_community_shared boolean DEFAULT false;

-- Community bookmarks table
CREATE TABLE IF NOT EXISTS community_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('backtest', 'detection')),
  content_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- Community likes table
CREATE TABLE IF NOT EXISTS community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('backtest', 'detection')),
  content_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

-- RLS
ALTER TABLE community_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes" ON community_likes FOR SELECT USING (true);
CREATE POLICY "Auth users insert own likes" ON community_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users delete own likes" ON community_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read bookmarks" ON community_bookmarks FOR SELECT USING (true);
CREATE POLICY "Auth users insert own bookmarks" ON community_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth users delete own bookmarks" ON community_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Index for feed queries
CREATE INDEX IF NOT EXISTS idx_backtest_runs_community ON backtest_runs (is_community_shared, created_at DESC) WHERE is_community_shared = true;
CREATE INDEX IF NOT EXISTS idx_community_likes_content ON community_likes (content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_community_bookmarks_content ON community_bookmarks (content_type, content_id);
