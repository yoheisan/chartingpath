CREATE OR REPLACE FUNCTION public.purge_all_historical_patterns()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  count_before bigint;
BEGIN
  SELECT COUNT(*) INTO count_before FROM public.historical_pattern_occurrences;
  
  TRUNCATE public.historical_pattern_occurrences;
  TRUNCATE public.outcome_analytics_cache;
  
  RETURN jsonb_build_object(
    'deleted_patterns', count_before,
    'success', true
  );
END;
$$;