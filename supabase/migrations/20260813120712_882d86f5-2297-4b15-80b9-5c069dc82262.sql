
-- 1. Measured outcome statistics per quality grade (public, read-only)
CREATE OR REPLACE FUNCTION public.get_grade_outcome_stats(p_since date DEFAULT '2024-01-01')
RETURNS TABLE (
  grade text,
  occurrences bigint,
  resolved bigint,
  win_rate numeric,
  avg_rr numeric,
  expectancy_r numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.quality_score::text AS grade,
         count(*) AS occurrences,
         count(*) FILTER (WHERE h.outcome IN ('hit_tp','hit_sl')) AS resolved,
         round(avg(CASE WHEN h.outcome = 'hit_tp' THEN 1.0 WHEN h.outcome = 'hit_sl' THEN 0 END)::numeric, 4) AS win_rate,
         round(avg(h.risk_reward_ratio) FILTER (WHERE h.outcome IN ('hit_tp','hit_sl'))::numeric, 4) AS avg_rr,
         round((
           avg(CASE WHEN h.outcome = 'hit_tp' THEN 1.0 WHEN h.outcome = 'hit_sl' THEN 0 END)::numeric
             * coalesce(avg(h.risk_reward_ratio) FILTER (WHERE h.outcome IN ('hit_tp','hit_sl'))::numeric, 0)
           - (1 - avg(CASE WHEN h.outcome = 'hit_tp' THEN 1.0 WHEN h.outcome = 'hit_sl' THEN 0 END)::numeric)
         ), 4) AS expectancy_r
  FROM public.historical_pattern_occurrences h
  WHERE h.quality_score IS NOT NULL
    AND h.detected_at >= p_since
  GROUP BY h.quality_score
  ORDER BY count(*) DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_grade_outcome_stats(date) TO anon, authenticated, service_role;

-- 2. Grade counts for a specific Pattern Lab selection, so an empty result can explain itself
CREATE OR REPLACE FUNCTION public.get_grade_counts_for_selection(
  p_symbols text[],
  p_patterns text[],
  p_timeframe text
)
RETURNS TABLE (grade text, occurrences bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.quality_score::text AS grade, count(*) AS occurrences
  FROM public.historical_pattern_occurrences h
  WHERE h.quality_score IS NOT NULL
    AND (p_symbols IS NULL OR h.symbol = ANY (p_symbols))
    AND (p_patterns IS NULL OR h.pattern_id = ANY (p_patterns))
    AND (p_timeframe IS NULL OR h.timeframe = p_timeframe)
  GROUP BY h.quality_score
  ORDER BY count(*) DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_grade_counts_for_selection(text[], text[], text) TO anon, authenticated, service_role;

-- 3. Register the new health check
INSERT INTO public.data_health_checks (check_name, category, severity, description, expected_result, is_enabled)
VALUES (
  'grade_ordering_valid',
  'consistency',
  'warning',
  'Expectancy by quality_score, over resolved occurrences since 2024 with n>=100, must be monotonically non-increasing from the highest grade to the lowest.',
  'A >= B >= C >= D by expectancy_r; currently FAILS (measured B > D > C > A)',
  true
)
ON CONFLICT (check_name) DO UPDATE
  SET severity = EXCLUDED.severity,
      description = EXCLUDED.description,
      expected_result = EXCLUDED.expected_result,
      is_enabled = true;

-- 4. Splice the implementation into run_data_health_checks without rewriting it
DO $mig$
DECLARE
  def text;
  branch text := $b$
      WHEN 'grade_ordering_valid' THEN
        DECLARE
          v_bad text[]; v_prev numeric; v_rows jsonb; v_exp numeric;
        BEGIN
          v_bad := ARRAY[]::text[]; v_prev := NULL; v_rows := '{}'::jsonb;
          FOR r IN
            SELECT h.quality_score::text AS g,
                   count(*) AS n,
                   avg(CASE WHEN h.outcome = 'hit_tp' THEN 1.0 ELSE 0 END) AS wr,
                   avg(h.risk_reward_ratio) AS rr
            FROM public.historical_pattern_occurrences h
            WHERE h.outcome IN ('hit_tp','hit_sl')
              AND h.quality_score IS NOT NULL
              AND h.detected_at >= '2024-01-01'
            GROUP BY h.quality_score
            HAVING count(*) >= 100
            ORDER BY h.quality_score
          LOOP
            v_exp := (r.wr * coalesce(r.rr, 0)) - (1 - r.wr);
            v_rows := v_rows || jsonb_build_object(r.g, jsonb_build_object('n', r.n, 'expectancy_r', round(v_exp, 4)));
            IF v_prev IS NOT NULL AND v_exp > v_prev + 0.0001 THEN
              v_bad := v_bad || (r.g || ' (' || round(v_exp, 3) || ') beats a higher grade (' || round(v_prev, 3) || ')');
            END IF;
            v_prev := v_exp;
          END LOOP;
          v_passed := coalesce(array_length(v_bad, 1), 0) = 0;
          v_obs := CASE WHEN v_passed THEN 'expectancy non-increasing from highest grade down'
                        ELSE 'grade ordering inverted: ' || array_to_string(v_bad, '; ') END;
          v_detail := jsonb_build_object('by_grade', v_rows, 'violations', v_bad);
        END;
$b$;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'run_data_health_checks';

  IF def IS NULL THEN
    RAISE EXCEPTION 'run_data_health_checks not found';
  END IF;

  IF position('grade_ordering_valid' in def) = 0 THEN
    def := replace(def, E'      ELSE\n        v_passed := false;', branch || E'\n      ELSE\n        v_passed := false;');
    IF position('grade_ordering_valid' in def) = 0 THEN
      RAISE EXCEPTION 'could not splice grade_ordering_valid branch';
    END IF;
    EXECUTE def;
  END IF;
END
$mig$;
