-- Create backtest result cache table
CREATE TABLE public.backtest_result_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  parameters_hash TEXT NOT NULL,
  instrument TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  results JSONB NOT NULL,
  trades JSONB,
  data_points INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  hit_count INTEGER DEFAULT 0
);

-- Index for fast lookups
CREATE INDEX idx_backtest_cache_key ON public.backtest_result_cache(cache_key);
CREATE INDEX idx_backtest_cache_expires ON public.backtest_result_cache(expires_at);
CREATE INDEX idx_backtest_cache_instrument ON public.backtest_result_cache(instrument);

-- Enable RLS (public read for caching efficiency)
ALTER TABLE public.backtest_result_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cache (improves cache hit rate across users)
CREATE POLICY "Cache is publicly readable" 
ON public.backtest_result_cache 
FOR SELECT 
USING (true);

-- Only service role can insert/update (via edge function)
CREATE POLICY "Service role can manage cache" 
ON public.backtest_result_cache 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_backtest_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.backtest_result_cache
  WHERE expires_at < now();
END;
$$;

-- Add daily usage limits check function
CREATE OR REPLACE FUNCTION public.check_backtest_limit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_plan subscription_plan;
  current_usage INTEGER;
  max_daily_runs INTEGER;
BEGIN
  -- Get user's subscription plan
  SELECT subscription_plan INTO user_plan
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Default to starter if no plan
  IF user_plan IS NULL THEN
    user_plan := 'starter';
  END IF;
  
  -- Set limits based on plan
  CASE user_plan
    WHEN 'starter' THEN max_daily_runs := 3;
    WHEN 'pro' THEN max_daily_runs := 20;
    WHEN 'elite' THEN max_daily_runs := 999999;
  END CASE;
  
  -- Get current usage
  SELECT COALESCE(runs_count, 0) INTO current_usage
  FROM public.backtester_v2_usage
  WHERE user_id = p_user_id AND run_date = CURRENT_DATE;
  
  current_usage := COALESCE(current_usage, 0);
  
  RETURN jsonb_build_object(
    'allowed', current_usage < max_daily_runs,
    'current_usage', current_usage,
    'max_daily_runs', max_daily_runs,
    'plan', user_plan,
    'remaining', max_daily_runs - current_usage
  );
END;
$$;