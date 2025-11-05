-- Create table for cached market reports
CREATE TABLE IF NOT EXISTS public.cached_market_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone TEXT NOT NULL,
  markets TEXT[] NOT NULL,
  time_span TEXT NOT NULL,
  tone TEXT NOT NULL,
  report TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_cached_reports_lookup ON public.cached_market_reports(timezone, time_span, generated_at DESC);

-- Create index for cleanup
CREATE INDEX idx_cached_reports_expires ON public.cached_market_reports(expires_at);

-- Enable RLS
ALTER TABLE public.cached_market_reports ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read cached reports (they're public market data)
CREATE POLICY "Anyone can read cached reports"
  ON public.cached_market_reports
  FOR SELECT
  USING (true);

-- Create table for user rate limiting
CREATE TABLE IF NOT EXISTS public.user_report_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT,
  timezone TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for rate limit checks
CREATE INDEX idx_user_report_requests_lookup ON public.user_report_requests(user_id, requested_at DESC);
CREATE INDEX idx_user_report_requests_ip ON public.user_report_requests(ip_address, requested_at DESC);

-- Enable RLS
ALTER TABLE public.user_report_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own requests
CREATE POLICY "Users can view own requests"
  ON public.user_report_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function to clean up old cached reports
CREATE OR REPLACE FUNCTION public.cleanup_expired_reports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.cached_market_reports
  WHERE expires_at < now();
END;
$$;

-- Function to check rate limit (max 1 request per 30 minutes per user)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_ip_address TEXT,
  p_timezone TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_request_count INTEGER;
BEGIN
  -- Check requests in last 30 minutes for this user or IP
  SELECT COUNT(*) INTO recent_request_count
  FROM public.user_report_requests
  WHERE (user_id = p_user_id OR ip_address = p_ip_address)
    AND timezone = p_timezone
    AND requested_at > now() - interval '30 minutes';
  
  -- If no recent requests, allow and log
  IF recent_request_count = 0 THEN
    INSERT INTO public.user_report_requests (user_id, ip_address, timezone)
    VALUES (p_user_id, p_ip_address, p_timezone);
    RETURN TRUE;
  END IF;
  
  -- Rate limit exceeded
  RETURN FALSE;
END;
$$;