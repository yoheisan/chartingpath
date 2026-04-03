
CREATE OR REPLACE FUNCTION public.get_pattern_library_stats()
RETURNS TABLE(
  pattern_name text,
  total_detections bigint,
  win_rate numeric,
  best_timeframe text,
  best_instrument text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH resolved AS (
    SELECT
      h.pattern_name,
      h.timeframe,
      h.symbol,
      h.outcome
    FROM public.historical_pattern_occurrences h
    WHERE h.outcome IN ('hit_tp', 'hit_sl')
  ),
  per_pattern AS (
    SELECT
      r.pattern_name,
      COUNT(*) AS total_detections,
      ROUND((COUNT(*) FILTER (WHERE r.outcome = 'hit_tp')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) AS win_rate
    FROM resolved r
    GROUP BY r.pattern_name
  ),
  best_tf AS (
    SELECT DISTINCT ON (r.pattern_name)
      r.pattern_name,
      r.timeframe AS best_timeframe,
      ROUND((COUNT(*) FILTER (WHERE r.outcome = 'hit_tp')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) AS tf_wr
    FROM resolved r
    GROUP BY r.pattern_name, r.timeframe
    HAVING COUNT(*) >= 10
    ORDER BY r.pattern_name, tf_wr DESC
  ),
  best_inst AS (
    SELECT DISTINCT ON (r.pattern_name)
      r.pattern_name,
      r.symbol AS best_instrument,
      ROUND((COUNT(*) FILTER (WHERE r.outcome = 'hit_tp')::numeric / NULLIF(COUNT(*), 0)) * 100, 1) AS inst_wr
    FROM resolved r
    GROUP BY r.pattern_name, r.symbol
    HAVING COUNT(*) >= 10
    ORDER BY r.pattern_name, inst_wr DESC
  )
  SELECT
    pp.pattern_name,
    pp.total_detections,
    pp.win_rate,
    COALESCE(bt.best_timeframe, '—') AS best_timeframe,
    COALESCE(bi.best_instrument, '—') AS best_instrument
  FROM per_pattern pp
  LEFT JOIN best_tf bt ON bt.pattern_name = pp.pattern_name
  LEFT JOIN best_inst bi ON bi.pattern_name = pp.pattern_name
  ORDER BY pp.pattern_name;
$$;
