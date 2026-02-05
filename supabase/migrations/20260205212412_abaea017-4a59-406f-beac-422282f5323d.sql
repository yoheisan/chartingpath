CREATE OR REPLACE FUNCTION public.check_refund_eligibility(p_user_id uuid, p_subscription_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- Look for payment-related events (Stripe uses various event types)
  SELECT * INTO billing_record
  FROM public.billing_events be
  WHERE be.user_id = p_user_id 
    AND be.subscription_id = p_subscription_id
    AND be.event_type IN ('payment', 'invoice.paid', 'invoice.payment_succeeded', 'checkout.session.completed', 'subscription_created', 'new_subscription')
    AND be.full_amount_cents > 0
  ORDER BY be.created_at DESC
  LIMIT 1;
  
  -- If no direct payment event, check for any billing event with amount
  IF NOT FOUND THEN
    SELECT * INTO billing_record
    FROM public.billing_events be
    WHERE be.user_id = p_user_id 
      AND be.subscription_id = p_subscription_id
      AND be.full_amount_cents > 0
    ORDER BY be.created_at DESC
    LIMIT 1;
  END IF;
  
  -- If still no billing record, check subscription creation date as fallback
  IF NOT FOUND THEN
    -- Use subscription start date as payment date fallback
    days_since_payment := EXTRACT(DAY FROM now() - subscription_record.created_at);
    
    -- Check billing cycle from subscription metadata or default assumptions
    IF subscription_record.billing_cycle IS NULL OR subscription_record.billing_cycle != 'annual' THEN
      RETURN jsonb_build_object(
        'eligible', false,
        'reason', 'Refunds are only available for annual plans'
      );
    END IF;
    
    IF days_since_payment > 14 THEN
      RETURN jsonb_build_object(
        'eligible', false,
        'reason', 'Refund window expired (14 days maximum)'
      );
    END IF;
    
    -- Estimate amount from plan pricing
    RETURN jsonb_build_object(
      'eligible', true,
      'reason', 'Eligible for refund within 14-day window (based on subscription date)',
      'amount_cents', COALESCE(
        (SELECT yearly_price_cents FROM public.plan_pricing WHERE plan = subscription_record.current_plan),
        0
      ),
      'days_remaining', 14 - days_since_payment
    );
  END IF;
  
  -- Calculate days since payment
  days_since_payment := EXTRACT(DAY FROM now() - billing_record.created_at);
  
  -- Apply refund policy
  -- 1. Only annual plans are eligible for refunds
  IF billing_record.metadata->>'billing_cycle' != 'annual' 
     AND subscription_record.billing_cycle != 'annual' THEN
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
  
  -- If all checks pass, eligible for refund
  RETURN jsonb_build_object(
    'eligible', true,
    'reason', 'Eligible for refund within 14-day window',
    'amount_cents', COALESCE(billing_record.full_amount_cents, 0),
    'days_remaining', 14 - days_since_payment
  );
END;
$function$