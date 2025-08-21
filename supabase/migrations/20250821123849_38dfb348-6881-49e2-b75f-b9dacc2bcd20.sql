-- Fix security issues identified by the linter

-- Enable RLS on plan_pricing table (was missing)
ALTER TABLE public.plan_pricing ENABLE ROW LEVEL SECURITY;

-- Create policy for plan_pricing (read-only for authenticated users)
CREATE POLICY "Anyone can view plan pricing" ON public.plan_pricing
  FOR SELECT USING (true);

-- Fix function search paths by adding SET search_path
CREATE OR REPLACE FUNCTION public.calculate_prorata_amount(
  current_plan subscription_plan,
  new_plan subscription_plan,
  days_remaining INTEGER,
  billing_cycle_days INTEGER DEFAULT 30
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_daily_rate DECIMAL;
  new_daily_rate DECIMAL;
  current_monthly_price INTEGER;
  new_monthly_price INTEGER;
  prorata_amount INTEGER;
BEGIN
  -- Get current plan price
  SELECT monthly_price_cents INTO current_monthly_price
  FROM public.plan_pricing
  WHERE plan = current_plan;
  
  -- Get new plan price
  SELECT monthly_price_cents INTO new_monthly_price
  FROM public.plan_pricing
  WHERE plan = new_plan;
  
  -- Calculate daily rates
  current_daily_rate := current_monthly_price::DECIMAL / billing_cycle_days;
  new_daily_rate := new_monthly_price::DECIMAL / billing_cycle_days;
  
  -- Calculate prorata amount (positive = charge, negative = credit)
  prorata_amount := ((new_daily_rate - current_daily_rate) * days_remaining)::INTEGER;
  
  RETURN prorata_amount;
END;
$$;

-- Fix update_profile_subscription function with proper search path
CREATE OR REPLACE FUNCTION public.update_profile_subscription(
  p_user_id UUID,
  p_plan subscription_plan,
  p_status TEXT DEFAULT 'active'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update or insert profile
  INSERT INTO public.profiles (user_id, subscription_plan, subscription_status, updated_at)
  VALUES (p_user_id, p_plan, p_status, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    subscription_plan = p_plan,
    subscription_status = p_status,
    updated_at = now();
END;
$$;

-- Fix sync_subscription_to_profile function with proper search path
CREATE OR REPLACE FUNCTION public.sync_subscription_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the profile when subscription changes
  PERFORM public.update_profile_subscription(
    NEW.user_id,
    NEW.current_plan,
    NEW.status
  );
  
  RETURN NEW;
END;
$$;