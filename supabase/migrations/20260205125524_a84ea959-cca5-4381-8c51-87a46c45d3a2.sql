-- Add outcome tracking columns to alerts_log
ALTER TABLE public.alerts_log
ADD COLUMN IF NOT EXISTS outcome_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS outcome_price numeric,
ADD COLUMN IF NOT EXISTS outcome_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS outcome_pnl_percent numeric,
ADD COLUMN IF NOT EXISTS outcome_r_multiple numeric,
ADD COLUMN IF NOT EXISTS is_auto_captured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS capture_method text,
ADD COLUMN IF NOT EXISTS entry_price numeric,
ADD COLUMN IF NOT EXISTS stop_loss_price numeric,
ADD COLUMN IF NOT EXISTS take_profit_price numeric,
ADD COLUMN IF NOT EXISTS checked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS check_count integer DEFAULT 0;

-- Add constraint for outcome_status
ALTER TABLE public.alerts_log
ADD CONSTRAINT alerts_log_outcome_status_check 
CHECK (outcome_status IN ('pending', 'hit_tp', 'hit_sl', 'timeout', 'invalidated', 'expired'));

-- Create index for pending outcomes (for the scheduled job)
CREATE INDEX IF NOT EXISTS idx_alerts_log_pending_outcomes 
ON public.alerts_log (outcome_status, triggered_at) 
WHERE outcome_status = 'pending';

-- Create aggregate stats table for admin dashboard
CREATE TABLE IF NOT EXISTS public.outcome_analytics_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name text NOT NULL,
  timeframe text NOT NULL,
  instrument text,
  total_signals integer DEFAULT 0,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  timeouts integer DEFAULT 0,
  win_rate numeric DEFAULT 0,
  avg_r_multiple numeric DEFAULT 0,
  avg_pnl_percent numeric DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  UNIQUE(pattern_name, timeframe, instrument)
);

-- Enable RLS
ALTER TABLE public.outcome_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Admin-only read policy
CREATE POLICY "Admins can view outcome analytics"
ON public.outcome_analytics_cache
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Service role can update
CREATE POLICY "Service role can manage outcome analytics"
ON public.outcome_analytics_cache
FOR ALL
USING (true)
WITH CHECK (true);