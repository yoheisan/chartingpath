
-- Scan requests queue table
CREATE TABLE public.scan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  asset_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER NOT NULL DEFAULT 0,
  patterns_found INTEGER,
  error_message TEXT,
  notified BOOLEAN NOT NULL DEFAULT false,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_scan_requests_status ON public.scan_requests(status);
CREATE INDEX idx_scan_requests_user_id ON public.scan_requests(user_id);
CREATE UNIQUE INDEX idx_scan_requests_user_symbol_pending ON public.scan_requests(user_id, symbol)
  WHERE status IN ('pending', 'processing');

-- RLS
ALTER TABLE public.scan_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own scan requests"
  ON public.scan_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can create scan requests"
  ON public.scan_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role can update (for the processing edge function)
CREATE POLICY "Service role can manage all scan requests"
  ON public.scan_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Rate limiting function
CREATE OR REPLACE FUNCTION public.check_scan_request_limit(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_plan subscription_plan;
  today_count INTEGER;
  max_daily INTEGER;
BEGIN
  SELECT subscription_plan INTO user_plan
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF user_plan IS NULL THEN user_plan := 'starter'; END IF;

  CASE user_plan
    WHEN 'starter' THEN max_daily := 5;
    WHEN 'pro' THEN max_daily := 20;
    WHEN 'elite' THEN max_daily := 999999;
  END CASE;

  SELECT COUNT(*) INTO today_count
  FROM public.scan_requests
  WHERE user_id = p_user_id
    AND requested_at >= CURRENT_DATE;

  RETURN jsonb_build_object(
    'allowed', today_count < max_daily,
    'used', today_count,
    'limit', max_daily,
    'plan', user_plan
  );
END;
$$;
