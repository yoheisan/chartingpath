
-- Round 1A: Add feedback tracking columns to paper_trades
ALTER TABLE public.paper_trades 
  ADD COLUMN IF NOT EXISTS pattern_id TEXT,
  ADD COLUMN IF NOT EXISTS timeframe TEXT,
  ADD COLUMN IF NOT EXISTS asset_type TEXT;

-- Add milestone tracking flags to user_email_preferences
ALTER TABLE public.user_email_preferences
  ADD COLUMN IF NOT EXISTS first_paper_trade_seen BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_5_seen BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_20_seen BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS milestone_50_seen BOOLEAN DEFAULT false;
