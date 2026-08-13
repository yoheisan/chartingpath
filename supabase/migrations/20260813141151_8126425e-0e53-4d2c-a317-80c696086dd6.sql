CREATE OR REPLACE FUNCTION public.backfill_geometry_source(p_limit integer DEFAULT 3000)
RETURNS TABLE(labelled_atr integer, labelled_pivot integer, remaining bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE a integer := 0; p integer := 0; rem bigint;
BEGIN
  WITH cte AS (
    SELECT id FROM public.historical_pattern_occurrences
    WHERE geometry_source = 'unknown'
      AND risk_reward_ratio IS NOT NULL
      AND abs(risk_reward_ratio - 2.0) < 0.001
      AND atr_value IS NOT NULL AND atr_value > 0
      AND abs(abs(entry_price - stop_loss_price) - 2 * atr_value) <= 0.05 * 2 * atr_value
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
          AND abs(abs(entry_price - stop_loss_price) - 2 * atr_value) <= 0.05 * 2 * atr_value));

  RETURN QUERY SELECT a, p, rem;
END $$;

REVOKE ALL ON FUNCTION public.backfill_geometry_source(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_geometry_source(integer) TO service_role;

SELECT cron.schedule('backfill-geometry-source', '* * * * *',
  $$SELECT public.backfill_geometry_source(3000);$$);