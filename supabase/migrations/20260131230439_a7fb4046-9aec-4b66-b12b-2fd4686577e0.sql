-- Custom Watchlist Monitoring for Premium Users
-- Allows users to add specific tickers to the actively monitored screener pool

CREATE TABLE public.user_watchlist_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'stock',
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate symbols per user
  UNIQUE(user_id, symbol)
);

-- Enable RLS
ALTER TABLE public.user_watchlist_monitors ENABLE ROW LEVEL SECURITY;

-- Users can view their own watchlist
CREATE POLICY "Users can view their own watchlist monitors"
ON public.user_watchlist_monitors
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own watchlist items
CREATE POLICY "Users can insert their own watchlist monitors"
ON public.user_watchlist_monitors
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own watchlist items
CREATE POLICY "Users can update their own watchlist monitors"
ON public.user_watchlist_monitors
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own watchlist items
CREATE POLICY "Users can delete their own watchlist monitors"
ON public.user_watchlist_monitors
FOR DELETE
USING (auth.uid() = user_id);

-- Index for efficient lookups
CREATE INDEX idx_user_watchlist_monitors_user_id ON public.user_watchlist_monitors(user_id);
CREATE INDEX idx_user_watchlist_monitors_symbol ON public.user_watchlist_monitors(symbol);
CREATE INDEX idx_user_watchlist_monitors_active ON public.user_watchlist_monitors(is_active) WHERE is_active = true;

-- Auto-update timestamp trigger
CREATE TRIGGER update_user_watchlist_monitors_updated_at
BEFORE UPDATE ON public.user_watchlist_monitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add watchlist_slots column to usage_credits for tier-based limits
ALTER TABLE public.usage_credits 
ADD COLUMN IF NOT EXISTS max_watchlist_slots INTEGER NOT NULL DEFAULT 0;

-- Update existing tiers with watchlist slot limits
COMMENT ON COLUMN public.usage_credits.max_watchlist_slots IS 'Maximum custom watchlist monitoring slots: FREE=0, LITE=20, PLUS=100, PRO=300, TEAM=unlimited(9999)';