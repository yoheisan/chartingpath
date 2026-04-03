
CREATE OR REPLACE FUNCTION public.get_top_win_rate_this_month(
  p_since text,
  p_min_samples integer DEFAULT 20
)
RETURNS TABLE(pattern_name text, timeframe text, win_rate numeric, sample_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    h.pattern_name,
    h.timeframe,
    ROUND(
      (COUNT(*) FILTER (WHERE h.outcome = 'hit_tp')::numeric / NULLIF(COUNT(*), 0)) * 100,
      1
    ) AS win_rate,
    COUNT(*) AS sample_count
  FROM public.historical_pattern_occurrences h
  WHERE h.detected_at >= p_since::timestamptz
    AND h.outcome IN ('hit_tp', 'hit_sl')
  GROUP BY h.pattern_name, h.timeframe
  HAVING COUNT(*) >= p_min_samples
  ORDER BY win_rate DESC, sample_count DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_most_detected_pattern(p_since text)
RETURNS TABLE(pattern_name text, cnt bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.pattern_name, COUNT(*) AS cnt
  FROM public.historical_pattern_occurrences h
  WHERE h.detected_at >= p_since::timestamptz
  GROUP BY h.pattern_name
  ORDER BY cnt DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_distinct_instrument_count()
RETURNS TABLE(cnt bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT symbol) AS cnt
  FROM public.historical_pattern_occurrences;
$$;
