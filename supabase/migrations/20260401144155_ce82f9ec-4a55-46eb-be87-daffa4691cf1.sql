
-- Create copilot_alerts table
CREATE TABLE public.copilot_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pattern_occurrence_id uuid,
  alert_type text NOT NULL DEFAULT 'pattern_match',
  symbol text NOT NULL,
  pattern_type text,
  timeframe text,
  direction text,
  entry_price numeric,
  target_price numeric,
  stop_price numeric,
  rr_ratio numeric,
  alert_message text NOT NULL,
  full_context jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copilot_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only read their own alerts
CREATE POLICY "Users can view their own alerts"
  ON public.copilot_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own alerts (to change status)
CREATE POLICY "Users can update their own alerts"
  ON public.copilot_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert alerts (from edge functions)
CREATE POLICY "Service role can insert alerts"
  ON public.copilot_alerts
  FOR INSERT
  WITH CHECK (public.is_service_role());

-- Index for fast lookups
CREATE INDEX idx_copilot_alerts_user_status ON public.copilot_alerts (user_id, status);
CREATE INDEX idx_copilot_alerts_created ON public.copilot_alerts (created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.copilot_alerts;
