CREATE OR REPLACE FUNCTION public.get_active_pattern_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.live_pattern_detections
  WHERE status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.get_active_pattern_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_pattern_count() TO authenticated;