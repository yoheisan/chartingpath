-- Replace TRUNCATE-based purge with DELETE-based for compatibility
CREATE OR REPLACE FUNCTION public.purge_all_historical_patterns()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  count_before bigint;
BEGIN
  SELECT COUNT(*) INTO count_before FROM public.historical_pattern_occurrences;
  
  DELETE FROM public.historical_pattern_occurrences;
  DELETE FROM public.outcome_analytics_cache;
  
  RETURN jsonb_build_object(
    'deleted_patterns', count_before,
    'success', true
  );
END;
$function$;