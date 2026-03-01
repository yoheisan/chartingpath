
-- Table for the auto-follow queue
CREATE TABLE public.x_follow_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id TEXT NOT NULL,
  target_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'followed', 'failed', 'skipped')),
  error_message TEXT,
  attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT x_follow_queue_target_unique UNIQUE (target_user_id)
);

-- RLS: admin-only
ALTER TABLE public.x_follow_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on x_follow_queue"
  ON public.x_follow_queue
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Service role access for edge functions
CREATE POLICY "Service role access on x_follow_queue"
  ON public.x_follow_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
