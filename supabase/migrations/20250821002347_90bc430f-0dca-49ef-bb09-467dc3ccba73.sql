-- Fix function search path issues by adding security definer set search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.check_alert_limit();

-- Recreate function to update updated_at timestamp with security definer
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate function to check alert limits with security definer
CREATE OR REPLACE FUNCTION public.check_alert_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_plan subscription_plan;
  current_alert_count INTEGER;
  max_alerts INTEGER;
BEGIN
  -- Get user's subscription plan
  SELECT subscription_plan INTO user_plan
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- If no profile exists, default to starter
  IF user_plan IS NULL THEN
    user_plan := 'starter';
  END IF;
  
  -- Set alert limits based on plan
  CASE user_plan
    WHEN 'starter' THEN max_alerts := 0; -- No alerts for starter
    WHEN 'pro' THEN max_alerts := 3;
    WHEN 'elite' THEN max_alerts := 999999; -- Unlimited
  END CASE;
  
  -- Count current active alerts
  SELECT COUNT(*) INTO current_alert_count
  FROM public.alerts
  WHERE user_id = NEW.user_id AND status = 'active';
  
  -- Check if limit would be exceeded
  IF current_alert_count >= max_alerts THEN
    RAISE EXCEPTION 'Alert limit exceeded for your subscription plan. Upgrade to create more alerts.';
  END IF;
  
  RETURN NEW;
END;
$$;