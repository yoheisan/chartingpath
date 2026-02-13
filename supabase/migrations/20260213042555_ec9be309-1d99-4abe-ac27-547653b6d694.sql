CREATE OR REPLACE FUNCTION public.purge_all_historical_patterns()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM public.historical_pattern_occurrences WHERE id IS NOT NULL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM public.outcome_analytics_cache WHERE id IS NOT NULL;
  
  RETURN jsonb_build_object(
    'deleted_patterns', deleted_count,
    'success', true
  );
END;
$$;