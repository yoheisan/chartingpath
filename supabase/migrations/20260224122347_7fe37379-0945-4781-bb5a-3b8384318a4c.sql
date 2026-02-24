
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  method TEXT NOT NULL DEFAULT 'password',
  ip_address TEXT,
  city TEXT,
  country TEXT,
  region TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for admin queries
CREATE INDEX idx_login_attempts_created_at ON public.login_attempts (created_at DESC);
CREATE INDEX idx_login_attempts_email ON public.login_attempts (email);

-- RLS: only service role can insert, admins can read
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert login attempts"
  ON public.login_attempts FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read login attempts"
  ON public.login_attempts FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Admins can read login attempts"
  ON public.login_attempts FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
