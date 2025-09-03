-- Update user to elite subscription
INSERT INTO public.profiles (user_id, email, subscription_plan, subscription_status, created_at, updated_at)
VALUES (
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'elite',
  'active',
  now(),
  now()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  subscription_plan = 'elite',
  subscription_status = 'active',
  updated_at = now();