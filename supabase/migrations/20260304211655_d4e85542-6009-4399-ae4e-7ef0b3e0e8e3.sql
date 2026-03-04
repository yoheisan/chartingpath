CREATE OR REPLACE FUNCTION public.expire_stale_patterns()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- First, delete old expired/invalidated rows that would conflict
  -- when we try to set active patterns to 'expired'
  DELETE FROM public.live_pattern_detections old_expired
  WHERE old_expired.status IN ('expired', 'invalidated')
    AND EXISTS (
      SELECT 1 FROM public.live_pattern_detections active_dup
      WHERE active_dup.instrument = old_expired.instrument
        AND active_dup.pattern_id = old_expired.pattern_id
        AND active_dup.timeframe = old_expired.timeframe
        AND active_dup.status = 'active'
        AND active_dup.last_confirmed_at < now() - interval '3 days'
    );

  -- Now safely expire stale active patterns
  UPDATE public.live_pattern_detections
  SET status = 'expired'
  WHERE status = 'active'
    AND last_confirmed_at < now() - interval '3 days';
END;
$function$;