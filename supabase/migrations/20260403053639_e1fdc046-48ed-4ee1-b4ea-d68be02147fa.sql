
CREATE OR REPLACE FUNCTION public.get_homepage_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patterns_this_week bigint;
  v_instruments_tracked bigint;
  v_top_pattern text;
  v_top_instrument text;
  v_top_win_rate numeric;
BEGIN
  -- 1. Patterns detected this week
  SELECT COUNT(*) INTO v_patterns_this_week
  FROM public.historical_pattern_occurrences
  WHERE detected_at >= (now() - interval '7 days')::text;

  -- 2. Active instruments tracked
  SELECT COUNT(*) INTO v_instruments_tracked
  FROM public.instruments
  WHERE is_active = true;

  -- 3. Top pattern this week by win rate (min 5 samples)
  SELECT
    sub.pattern_name,
    sub.symbol,
    sub.win_rate
  INTO v_top_pattern, v_top_instrument, v_top_win_rate
  FROM (
    SELECT
      h.pattern_name,
      h.symbol,
      ROUND(
        (COUNT(*) FILTER (WHERE h.outcome = 'hit_tp')::numeric / NULLIF(COUNT(*), 0)) * 100,
        1
      ) AS win_rate,
      COUNT(*) AS total
    FROM public.historical_pattern_occurrences h
    WHERE h.detected_at >= (now() - interval '7 days')::text
      AND h.outcome IN ('hit_tp', 'hit_sl')
    GROUP BY h.pattern_name, h.symbol
    HAVING COUNT(*) >= 5
    ORDER BY win_rate DESC, total DESC
    LIMIT 1
  ) sub;

  RETURN jsonb_build_object(
    'patterns_this_week', COALESCE(v_patterns_this_week, 0),
    'instruments_tracked', COALESCE(v_instruments_tracked, 0),
    'top_pattern', COALESCE(v_top_pattern, 'Bull Flag'),
    'top_instrument', COALESCE(v_top_instrument, 'EURUSD'),
    'top_win_rate', COALESCE(v_top_win_rate, 0)
  );
END;
$$;
