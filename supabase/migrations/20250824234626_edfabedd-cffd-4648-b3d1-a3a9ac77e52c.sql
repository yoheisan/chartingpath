-- Insert your user ID here after creating an account
-- First, find your user ID by checking auth.users table
-- Then run: INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'admin');

-- For now, let's create a helper function to make the first user an admin
CREATE OR REPLACE FUNCTION public.make_first_user_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get the first user ID from auth.users
  INSERT INTO public.user_roles (user_id, role)
  SELECT 
    au.id,
    'admin'::app_role
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  WHERE ur.user_id IS NULL
  LIMIT 1;
END;
$$;