CREATE TABLE IF NOT EXISTS public.grade_outcome_stats_cache (
  grade text PRIMARY KEY,
  occurrences bigint NOT NULL DEFAULT 0,
  resolved bigint NOT NULL DEFAULT 0,
  win_rate numeric,
  avg_rr numeric,
  expectancy_r numeric,
  since date NOT NULL DEFAULT '2024-01-01',
  refreshed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.grade_outcome_stats_cache TO anon;
GRANT SELECT ON public.grade_outcome_stats_cache TO authenticated;
GRANT ALL ON public.grade_outcome_stats_cache TO service_role;

ALTER TABLE public.grade_outcome_stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grade stats are public" ON public.grade_outcome_stats_cache;
CREATE POLICY "grade stats are public" ON public.grade_outcome_stats_cache FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.refresh_grade_outcome_stats(p_since date DEFAULT '2024-01-01'::date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.grade_outcome_stats_cache;
  INSERT INTO public.grade_outcome_stats_cache (grade, occurrences, resolved, win_rate, avg_rr, expectancy_r, since, refreshed_at)
  SELECT h.quality_score::text,
         count(*),
         count(*) FILTER (WHERE h.outcome IN ('hit_tp','hit_sl')),
         round(avg(CASE WHEN h.outcome = 'hit_tp' THEN 1.0 WHEN h.outcome = 'hit_sl' THEN 0 END)::numeric, 4),
         round(avg(h.risk_reward_ratio) FILTER (WHERE h.outcome IN ('hit_tp','hit_sl'))::numeric, 4),
         round((
           avg(CASE WHEN h.outcome = 'hit_tp' THEN 1.0 WHEN h.outcome = 'hit_sl' THEN 0 END)::numeric
             * coalesce(avg(h.risk_reward_ratio) FILTER (WHERE h.outcome IN ('hit_tp','hit_sl'))::numeric, 0)
           - (1 - avg(CASE WHEN h.outcome = 'hit_tp' THEN 1.0 WHEN h.outcome = 'hit_sl' THEN 0 END)::numeric)
         ), 4),
         p_since,
         now()
  FROM public.historical_pattern_occurrences h
  WHERE h.quality_score IS NOT NULL
    AND h.detected_at >= p_since
  GROUP BY h.quality_score;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_grade_outcome_stats(p_since date DEFAULT '2024-01-01'::date)
RETURNS TABLE(grade text, occurrences bigint, resolved bigint, win_rate numeric, avg_rr numeric, expectancy_r numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.grade, c.occurrences, c.resolved, c.win_rate, c.avg_rr, c.expectancy_r
  FROM public.grade_outcome_stats_cache c
  ORDER BY c.occurrences DESC
$$;

SELECT public.refresh_grade_outcome_stats();

SELECT cron.unschedule('refresh-grade-outcome-stats')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh-grade-outcome-stats');

SELECT cron.schedule('refresh-grade-outcome-stats', '40 3 * * *', $$SELECT public.refresh_grade_outcome_stats();$$);