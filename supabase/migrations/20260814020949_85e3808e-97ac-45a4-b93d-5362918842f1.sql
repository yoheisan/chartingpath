DROP FUNCTION IF EXISTS public.backfill_geometry_source(integer);

CREATE FUNCTION public.backfill_geometry_source(p_limit integer DEFAULT 5000)
RETURNS TABLE(atr_labeled integer, pivot_labeled integer, remaining bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE a integer := 0; p integer := 0; rem bigint;
BEGIN
  WITH cte AS (
    SELECT id FROM public.historical_pattern_occurrences
    WHERE geometry_source = 'unknown'
      AND risk_reward_ratio IS NOT NULL
      AND abs(risk_reward_ratio - 2.0) < 0.001
      AND atr_value IS NOT NULL AND atr_value > 0
      AND abs(abs(entry_price - stop_loss_price) - 2 * atr_value) <= 0.005 * 2 * atr_value
    LIMIT p_limit
  )
  UPDATE public.historical_pattern_occurrences h
    SET geometry_source = 'atr_fallback'
    FROM cte WHERE h.id = cte.id;
  GET DIAGNOSTICS a = ROW_COUNT;

  WITH cte AS (
    SELECT id FROM public.historical_pattern_occurrences
    WHERE geometry_source = 'unknown'
      AND risk_reward_ratio IS NOT NULL
      AND abs(risk_reward_ratio - 2.0) >= 0.001
    LIMIT p_limit
  )
  UPDATE public.historical_pattern_occurrences h
    SET geometry_source = 'pivot'
    FROM cte WHERE h.id = cte.id;
  GET DIAGNOSTICS p = ROW_COUNT;

  SELECT count(*) INTO rem FROM public.historical_pattern_occurrences
  WHERE geometry_source = 'unknown'
    AND risk_reward_ratio IS NOT NULL
    AND (abs(risk_reward_ratio - 2.0) >= 0.001
      OR (atr_value IS NOT NULL AND atr_value > 0
          AND abs(abs(entry_price - stop_loss_price) - 2 * atr_value) <= 0.005 * 2 * atr_value));

  RETURN QUERY SELECT a, p, rem;
END $$;

CREATE OR REPLACE FUNCTION public.demote_loose_atr_fallback(p_limit integer DEFAULT 20000)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  WITH cte AS (
    SELECT id FROM public.historical_pattern_occurrences
    WHERE geometry_source = 'atr_fallback'
      AND (atr_value IS NULL OR atr_value <= 0
           OR abs(abs(entry_price - stop_loss_price) - 2 * atr_value) > 0.005 * 2 * atr_value)
    LIMIT p_limit
  )
  UPDATE public.historical_pattern_occurrences h
    SET geometry_source = 'unknown'
    FROM cte WHERE h.id = cte.id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

SELECT cron.unschedule('backfill-geometry-source')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'backfill-geometry-source');

SELECT cron.schedule('demote-loose-atr-fallback', '* * * * *',
  $$SELECT public.demote_loose_atr_fallback(20000);$$);