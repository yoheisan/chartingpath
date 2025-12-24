-- Product Events table for KPI tracking
-- Tracks 6 key events: signup_completed, preset_loaded, backtest_started, backtest_completed, alert_created, share_created

CREATE TABLE public.product_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_props JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for querying events by name and date
CREATE INDEX idx_product_events_name_created ON public.product_events(event_name, created_at DESC);

-- Index for user-specific queries
CREATE INDEX idx_product_events_user ON public.product_events(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (for anonymous tracking)
CREATE POLICY "Anyone can insert product events"
  ON public.product_events
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own events, admins can view all
CREATE POLICY "Users can view own events"
  ON public.product_events
  FOR SELECT
  USING (
    (user_id IS NULL) OR 
    (auth.uid() = user_id) OR 
    is_admin(auth.uid())
  );

-- Backtest share tokens table for public share links
ALTER TABLE public.backtest_runs 
  ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- Index for share token lookups
CREATE INDEX IF NOT EXISTS idx_backtest_runs_share_token ON public.backtest_runs(share_token) WHERE share_token IS NOT NULL;

-- Policy for public share access
CREATE POLICY "Anyone can view shared backtests by token"
  ON public.backtest_runs
  FOR SELECT
  USING (
    (auth.uid() = user_id) OR 
    (is_shared = true AND share_token IS NOT NULL)
  );