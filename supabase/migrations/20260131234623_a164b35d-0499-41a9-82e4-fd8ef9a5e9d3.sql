-- Create user watchlist table for custom symbol monitoring
CREATE TABLE public.user_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  asset_type VARCHAR(20),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

-- Users can only see their own watchlist
CREATE POLICY "Users can view their own watchlist"
ON public.user_watchlist
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own watchlist
CREATE POLICY "Users can add to their own watchlist"
ON public.user_watchlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own watchlist items
CREATE POLICY "Users can update their own watchlist"
ON public.user_watchlist
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete from their own watchlist
CREATE POLICY "Users can delete from their own watchlist"
ON public.user_watchlist
FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast user lookups
CREATE INDEX idx_user_watchlist_user_id ON public.user_watchlist(user_id);

-- Index for symbol lookups (for cross-referencing with patterns)
CREATE INDEX idx_user_watchlist_symbol ON public.user_watchlist(symbol);