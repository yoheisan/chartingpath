-- First, let's check if there's a current auth user and ensure they have an elite profile
-- Insert or update a test elite profile for the current session
DO $$
DECLARE
    test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN
    -- Create a test elite profile if none exists
    INSERT INTO public.profiles (id, user_id, subscription_plan, subscription_status, email)
    VALUES (
        gen_random_uuid(),
        test_user_id,
        'elite'::subscription_plan,
        'active',
        'elite.member@test.com'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        subscription_plan = 'elite'::subscription_plan,
        subscription_status = 'active',
        updated_at = now();
        
    -- Also create an active elite subscription record
    INSERT INTO public.subscriptions (id, user_id, current_plan, status, current_period_start, current_period_end)
    VALUES (
        gen_random_uuid(),
        test_user_id,
        'elite'::subscription_plan,
        'active',
        now() - interval '10 days',
        now() + interval '20 days'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_plan = 'elite'::subscription_plan,
        status = 'active',
        current_period_start = now() - interval '10 days',
        current_period_end = now() + interval '20 days',
        updated_at = now();
END $$;