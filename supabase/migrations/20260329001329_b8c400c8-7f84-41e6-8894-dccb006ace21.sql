-- Fix 1: Truncate net._http_response (pg_net HTTP logs)
TRUNCATE TABLE net._http_response;

-- Fix 2: Create cleanup function for pattern_pipeline_results
-- Keep only last 7 days of pipeline results
CREATE OR REPLACE FUNCTION public.cleanup_pattern_pipeline_results(p_keep_days integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer := 0;
  batch_deleted integer;
BEGIN
  LOOP
    DELETE FROM public.pattern_pipeline_results
    WHERE id IN (
      SELECT id FROM public.pattern_pipeline_results
      WHERE created_at < now() - (p_keep_days || ' days')::interval
      LIMIT 5000
    );
    GET DIAGNOSTICS batch_deleted = ROW_COUNT;
    deleted_count := deleted_count + batch_deleted;
    EXIT WHEN batch_deleted < 5000;
    PERFORM pg_sleep(0.1);
  END LOOP;
  RETURN deleted_count;
END;
$$;

-- Fix 3: Create cleanup function for net._http_response 
-- Keep only last 24 hours of HTTP logs
CREATE OR REPLACE FUNCTION public.cleanup_http_response_logs(p_keep_hours integer DEFAULT 24)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM net._http_response
  WHERE created < now() - (p_keep_hours || ' hours')::interval;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Fix 4: Create cleanup function for dead/stale historical_prices rows
CREATE OR REPLACE FUNCTION public.cleanup_stale_historical_prices(p_keep_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer := 0;
  batch_deleted integer;
BEGIN
  -- Delete duplicate prices keeping only the latest per (symbol, timeframe, date)
  LOOP
    DELETE FROM public.historical_prices
    WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY symbol, timeframe, date
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        ) as rn
        FROM public.historical_prices
      ) dupes
      WHERE rn > 1
      LIMIT 5000
    );
    GET DIAGNOSTICS batch_deleted = ROW_COUNT;
    deleted_count := deleted_count + batch_deleted;
    EXIT WHEN batch_deleted < 5000;
    PERFORM pg_sleep(0.1);
  END LOOP;
  RETURN deleted_count;
END;
$$;

-- Fix 5: Master cleanup function that runs all cleanups
CREATE OR REPLACE FUNCTION public.run_database_maintenance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pipeline_deleted integer;
  http_deleted integer;
  prices_deleted integer;
BEGIN
  -- Clean pipeline results older than 7 days
  SELECT public.cleanup_pattern_pipeline_results(7) INTO pipeline_deleted;
  
  -- Clean HTTP response logs older than 24 hours
  SELECT public.cleanup_http_response_logs(24) INTO http_deleted;
  
  -- Clean duplicate historical prices
  SELECT public.cleanup_stale_historical_prices(90) INTO prices_deleted;
  
  RETURN jsonb_build_object(
    'pipeline_results_deleted', pipeline_deleted,
    'http_logs_deleted', http_deleted,
    'stale_prices_deleted', prices_deleted,
    'ran_at', now()
  );
END;
$$;