
-- Add automation columns to alerts table
ALTER TABLE public.alerts 
  ADD COLUMN IF NOT EXISTS auto_paper_trade boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS webhook_secret text,
  ADD COLUMN IF NOT EXISTS risk_percent numeric NOT NULL DEFAULT 1.0;

-- Create signal_webhook_log table
CREATE TABLE IF NOT EXISTS public.signal_webhook_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  detection_id uuid,
  user_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_status integer,
  response_body text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on signal_webhook_log
ALTER TABLE public.signal_webhook_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own webhook logs
CREATE POLICY "Users can read own webhook logs"
  ON public.signal_webhook_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert
CREATE POLICY "Service role can insert webhook logs"
  ON public.signal_webhook_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_service_role());

-- Index for querying by user + time (rate limiting)
CREATE INDEX IF NOT EXISTS idx_signal_webhook_log_user_created 
  ON public.signal_webhook_log(user_id, created_at DESC);

-- Index for querying by alert
CREATE INDEX IF NOT EXISTS idx_signal_webhook_log_alert 
  ON public.signal_webhook_log(alert_id);
