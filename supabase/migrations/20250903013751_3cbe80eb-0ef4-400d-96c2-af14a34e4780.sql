-- Update specific user to elite subscription
INSERT INTO public.profiles (user_id, email, subscription_plan, subscription_status, created_at, updated_at)
VALUES (
  '584ebfae-fac6-4a07-8e06-935e3e282b67'::uuid,
  'yohei.nishiyama@gmail.com',
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