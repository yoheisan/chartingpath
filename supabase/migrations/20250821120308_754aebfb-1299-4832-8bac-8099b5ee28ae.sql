-- Add subscription tracking and billing tables
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_plan subscription_plan NOT NULL DEFAULT 'starter',
  previous_plan subscription_plan,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  billing_cycle_anchor TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
  FOR ALL USING (true);

-- Billing events table for audit trail and prorata calculations
CREATE TABLE public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'upgrade', 'downgrade', 'cancel', 'reactivate', 'payment'
  from_plan subscription_plan,
  to_plan subscription_plan,
  prorata_amount_cents INTEGER DEFAULT 0, -- Positive for charges, negative for credits
  full_amount_cents INTEGER DEFAULT 0,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  billing_reason TEXT,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on billing_events table
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for billing_events
CREATE POLICY "Users can view own billing events" ON public.billing_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage billing events" ON public.billing_events
  FOR ALL USING (true);

-- Plan pricing table
CREATE TABLE public.plan_pricing (
  plan subscription_plan PRIMARY KEY,
  monthly_price_cents INTEGER NOT NULL,
  yearly_price_cents INTEGER NOT NULL,
  features JSONB DEFAULT '{}',
  max_alerts INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default plan pricing
INSERT INTO public.plan_pricing (plan, monthly_price_cents, yearly_price_cents, max_alerts, features) VALUES
  ('starter', 0, 0, 1, '{"description": "Free tier with basic features"}'),
  ('pro', 7900, 79200, 3, '{"description": "Professional plan with advanced features"}'),
  ('elite', 19900, 199200, 999999, '{"description": "Elite plan with unlimited features"}');

-- Function to calculate prorata amount
CREATE OR REPLACE FUNCTION public.calculate_prorata_amount(
  current_plan subscription_plan,
  new_plan subscription_plan,
  days_remaining INTEGER,
  billing_cycle_days INTEGER DEFAULT 30
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to update user profile when subscription changes
CREATE OR REPLACE FUNCTION public.update_profile_subscription(
  p_user_id UUID,
  p_plan subscription_plan,
  p_status TEXT DEFAULT 'active'
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update or insert profile
  INSERT INTO public.profiles (user_id, subscription_plan, subscription_status, email, updated_at)
  SELECT p_user_id, p_plan, p_status, auth.email, now()
  FROM auth.users WHERE auth.users.id = p_user_id
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    subscription_plan = p_plan,
    subscription_status = p_status,
    updated_at = now();
END;
$$;

-- Trigger to update profiles table when subscriptions change
CREATE OR REPLACE FUNCTION public.sync_subscription_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

CREATE TRIGGER sync_subscription_to_profile_trigger
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_subscription_to_profile();

-- Update existing profiles to have subscription records
INSERT INTO public.subscriptions (user_id, current_plan, status)
SELECT user_id, subscription_plan, subscription_status
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;