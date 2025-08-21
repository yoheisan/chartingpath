-- Make yohei.nishiyama@gmail.com a super admin
-- First, we need to find the user_id for this email from the profiles table
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user_id from profiles table
    SELECT user_id INTO target_user_id 
    FROM public.profiles 
    WHERE email = 'yohei.nishiyama@gmail.com' 
    LIMIT 1;
    
    -- Only proceed if user exists
    IF target_user_id IS NOT NULL THEN
        -- Insert super_admin role (use ON CONFLICT to avoid duplicates)
        INSERT INTO public.user_roles (user_id, role, created_at)
        VALUES (target_user_id, 'super_admin', now())
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Super admin role granted to user: %', target_user_id;
    ELSE
        RAISE NOTICE 'User with email yohei.nishiyama@gmail.com not found. Please create an account first.';
    END IF;
END $$;