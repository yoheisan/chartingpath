-- Create a one-time function to batch-delete all historical pattern occurrences
-- This bypasses PostgREST statement timeout by running directly in Postgres
CREATE OR REPLACE FUNCTION public.purge_all_historical_patterns()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  -- Delete all historical pattern occurrences
  DELETE FROM public.historical_pattern_occurrences;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Also clear outcome analytics cache
  DELETE FROM public.outcome_analytics_cache;
  
  RETURN jsonb_build_object(
    'deleted_patterns', deleted_count,
    'success', true
  );
END;
$$;