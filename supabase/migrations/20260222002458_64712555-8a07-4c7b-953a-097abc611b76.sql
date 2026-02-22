-- Fix initialize_user_credits trigger to use 50 credits (matching PLANS_CONFIG FREE tier)
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.usage_credits (user_id, plan_tier, credits_balance)
  VALUES (NEW.id, 'free', 50)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Fix check_project_run_allowed fallback to use 50 credits
CREATE OR REPLACE FUNCTION public.check_project_run_allowed(p_user_id uuid, p_credits_needed integer, p_instruments_count integer, p_lookback_years integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_credits RECORD;
  daily_runs INTEGER;
BEGIN
  SELECT * INTO user_credits
  FROM public.usage_credits
  WHERE user_id = p_user_id;
  
  IF user_credits IS NULL THEN
    INSERT INTO public.usage_credits (user_id, plan_tier, credits_balance)
    VALUES (p_user_id, 'free', 50)
    RETURNING * INTO user_credits;
  END IF;
  
  SELECT COUNT(*) INTO daily_runs
  FROM public.project_runs pr
  JOIN public.projects p ON p.id = pr.project_id
  WHERE p.user_id = p_user_id
  AND pr.created_at >= CURRENT_DATE;
  
  IF user_credits.credits_balance < p_credits_needed THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'insufficient_credits',
      'credits_balance', user_credits.credits_balance,
      'credits_needed', p_credits_needed
    );
  END IF;
  
  IF daily_runs >= user_credits.daily_run_cap THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_cap_reached',
      'daily_runs', daily_runs,
      'daily_cap', user_credits.daily_run_cap
    );
  END IF;
  
  IF p_instruments_count > user_credits.max_instruments_per_run THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'too_many_instruments',
      'requested', p_instruments_count,
      'max_allowed', user_credits.max_instruments_per_run
    );
  END IF;
  
  IF p_lookback_years > user_credits.max_lookback_years THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'lookback_too_long',
      'requested', p_lookback_years,
      'max_allowed', user_credits.max_lookback_years
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'credits_balance', user_credits.credits_balance,
    'credits_after', user_credits.credits_balance - p_credits_needed,
    'daily_runs', daily_runs,
    'plan_tier', user_credits.plan_tier
  );
END;
$function$;

-- Also update the default on the usage_credits table column itself
ALTER TABLE public.usage_credits ALTER COLUMN credits_balance SET DEFAULT 50;