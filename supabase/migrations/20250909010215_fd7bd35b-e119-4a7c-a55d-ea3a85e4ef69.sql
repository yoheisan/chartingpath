-- First, let's ensure we have the current plan pricing data
INSERT INTO public.plan_pricing (plan, monthly_price_cents, yearly_price_cents, max_alerts, features) VALUES
  ('free'::subscription_plan, 0, 0, 0, '{"alerts": 1, "patterns": 5, "backtesting": "demo_only", "community": false}'::jsonb),
  ('starter'::subscription_plan, 1900, 20500, 10, '{"alerts": 10, "patterns": "full_library", "backtesting": "basic", "strategies": 5}'::jsonb),
  ('pro'::subscription_plan, 3900, 42100, 50, '{"alerts": 50, "patterns": "full_library", "backtesting": "unlimited", "strategies": "unlimited", "exports": true}'::jsonb),
  ('pro_plus'::subscription_plan, 7900, 85300, 999999, '{"alerts": "unlimited", "patterns": "full_library", "backtesting": "unlimited", "strategies": "unlimited", "exports": true, "community": true, "portfolio": true}'::jsonb),
  ('elite'::subscription_plan, 14900, 160900, 999999, '{"alerts": "unlimited", "patterns": "full_library", "backtesting": "unlimited", "strategies": "unlimited", "exports": "all_platforms", "community": true, "portfolio": true, "priority": true}'::jsonb)
ON CONFLICT (plan) DO UPDATE SET
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  yearly_price_cents = EXCLUDED.yearly_price_cents,
  max_alerts = EXCLUDED.max_alerts,
  features = EXCLUDED.features;

-- Create refunds table to track refund requests and eligibility
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id),
  billing_event_id uuid REFERENCES public.billing_events(id),
  amount_cents integer NOT NULL,
  reason text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  stripe_refund_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'processed', 'failed')),
  admin_notes text,
  processed_by uuid,
  is_eligible boolean NOT NULL DEFAULT false,
  eligibility_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for refunds table
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Users can view their own refunds
CREATE POLICY "Users can view own refunds" ON public.refunds
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create refund requests for their own subscriptions
CREATE POLICY "Users can request refunds" ON public.refunds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can manage all refunds
CREATE POLICY "Admins can manage refunds" ON public.refunds
  FOR ALL USING (is_admin(auth.uid()));

-- Create function to check refund eligibility based on your policy
CREATE OR REPLACE FUNCTION public.check_refund_eligibility(
  p_user_id uuid,
  p_subscription_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_record RECORD;
  billing_record RECORD;
  days_since_payment integer;
  eligibility_result jsonb;
BEGIN
  -- Get subscription details
  SELECT * INTO subscription_record
  FROM public.subscriptions s
  WHERE s.id = p_subscription_id AND s.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Subscription not found'
    );
  END IF;
  
  -- Get the most recent billing event for this subscription
  SELECT * INTO billing_record
  FROM public.billing_events be
  WHERE be.user_id = p_user_id 
    AND be.subscription_id = p_subscription_id
    AND be.event_type = 'payment'
  ORDER BY be.created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'No payment record found'
    );
  END IF;
  
  -- Calculate days since payment
  days_since_payment := EXTRACT(DAY FROM now() - billing_record.created_at);
  
  -- Apply your specific refund policy
  -- 1. Only annual plans are eligible for refunds
  IF billing_record.metadata->>'billing_cycle' != 'annual' THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Refunds are only available for annual plans'
    );
  END IF;
  
  -- 2. Must be within 14 days
  IF days_since_payment > 14 THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Refund window expired (14 days maximum)'
    );
  END IF;
  
  -- 3. Cannot be an upgrade transaction
  IF billing_record.event_type = 'upgrade' THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'No refunds for upgrades to more expensive plans'
    );
  END IF;
  
  -- 4. Check if user has filed chargebacks (you'd need to track this)
  -- This would require additional logic based on your payment processor data
  
  -- If all checks pass, eligible for refund
  RETURN jsonb_build_object(
    'eligible', true,
    'reason', 'Eligible for refund within 14-day window',
    'amount_cents', billing_record.full_amount_cents,
    'days_remaining', 14 - days_since_payment
  );
END;
$$;

-- Create function to handle plan changes according to your policy
CREATE OR REPLACE FUNCTION public.process_plan_change(
  p_user_id uuid,
  p_new_plan subscription_plan,
  p_billing_cycle text DEFAULT 'monthly'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_subscription RECORD;
  current_plan_pricing RECORD;
  new_plan_pricing RECORD;
  days_remaining integer;
  prorated_amount integer;
  change_type text;
  result jsonb;
BEGIN
  -- Get current subscription
  SELECT * INTO current_subscription
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active subscription found'
    );
  END IF;
  
  -- Get current plan pricing
  SELECT * INTO current_plan_pricing
  FROM public.plan_pricing
  WHERE plan = current_subscription.current_plan;
  
  -- Get new plan pricing
  SELECT * INTO new_plan_pricing
  FROM public.plan_pricing
  WHERE plan = p_new_plan;
  
  -- Calculate days remaining in current period
  days_remaining := EXTRACT(DAY FROM current_subscription.current_period_end - now());
  
  -- Determine if this is an upgrade or downgrade
  IF p_billing_cycle = 'annual' THEN
    IF new_plan_pricing.yearly_price_cents > current_plan_pricing.yearly_price_cents THEN
      change_type := 'upgrade';
    ELSE
      change_type := 'downgrade';
    END IF;
  ELSE
    IF new_plan_pricing.monthly_price_cents > current_plan_pricing.monthly_price_cents THEN
      change_type := 'upgrade';
    ELSE
      change_type := 'downgrade';
    END IF;
  END IF;
  
  -- Apply your specific change policy
  IF change_type = 'upgrade' THEN
    -- Immediate upgrade with prorated amount
    prorated_amount := public.calculate_prorata_amount(
      current_subscription.current_plan,
      p_new_plan,
      days_remaining,
      30 -- billing cycle days
    );
    
    -- Update subscription immediately
    UPDATE public.subscriptions
    SET 
      previous_plan = current_plan,
      current_plan = p_new_plan,
      updated_at = now()
    WHERE id = current_subscription.id;
    
    result := jsonb_build_object(
      'success', true,
      'change_type', 'upgrade',
      'immediate', true,
      'prorated_amount_cents', prorated_amount,
      'message', 'Plan upgraded immediately with prorated billing'
    );
    
  ELSE
    -- Downgrade: current plan stays until period end
    UPDATE public.subscriptions
    SET 
      -- Store the pending downgrade
      updated_at = now()
    WHERE id = current_subscription.id;
    
    -- You'd typically store the pending change in a separate table
    -- or use a field like 'scheduled_plan_change'
    
    result := jsonb_build_object(
      'success', true,
      'change_type', 'downgrade',
      'immediate', false,
      'effective_date', current_subscription.current_period_end,
      'message', 'Downgrade scheduled for next billing period'
    );
  END IF;
  
  -- Record the billing event
  INSERT INTO public.billing_events (
    user_id,
    subscription_id,
    event_type,
    from_plan,
    to_plan,
    prorata_amount_cents,
    metadata
  ) VALUES (
    p_user_id,
    current_subscription.id,
    change_type,
    current_subscription.current_plan,
    p_new_plan,
    COALESCE(prorated_amount, 0),
    jsonb_build_object(
      'billing_cycle', p_billing_cycle,
      'days_remaining', days_remaining,
      'immediate', change_type = 'upgrade'
    )
  );
  
  RETURN result;
END;
$$;

-- Add trigger to update the updated_at column
CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();