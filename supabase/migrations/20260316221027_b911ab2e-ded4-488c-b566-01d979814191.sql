CREATE OR REPLACE FUNCTION public.get_getting_started_batch()
RETURNS TABLE(user_id uuid, email text, full_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    uep.user_id,
    au.email::text,
    (au.raw_user_meta_data->>'full_name')::text AS full_name
  FROM public.user_email_preferences uep
  JOIN auth.users au ON au.id = uep.user_id
  WHERE uep.welcome_sent = true
    AND uep.getting_started_sent = false
    AND uep.unsubscribed = false
    AND au.created_at <= now() - interval '24 hours'
    AND au.created_at >= now() - interval '48 hours';
$$;