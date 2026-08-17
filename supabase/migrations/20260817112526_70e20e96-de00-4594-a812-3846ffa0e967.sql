CREATE OR REPLACE FUNCTION public.run_extra_health_check(p_name text)
 RETURNS TABLE(passed boolean, observed_value text, detail jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total int; v_above int; v_expected numeric; v_corr numeric; v_decay int;
  v_dupes int; v_rows jsonb;
BEGIN
  IF p_name = 'population_edge_vs_chance' THEN
    WITH cells AS (
      SELECT count(*) AS n,
             avg(CASE WHEN h.outcome='hit_tp' THEN 1.0 ELSE 0 END) AS wr,
             avg(h.risk_reward_ratio) AS rr
      FROM public.historical_pattern_occurrences h
      WHERE h.outcome IN ('hit_tp','hit_sl') AND h.bars_to_outcome IS NOT NULL
        AND h.detected_at >= date '2024-01-01'
      GROUP BY h.pattern_id, h.timeframe, h.asset_type,
               CASE lower(h.direction) WHEN 'long' THEN 'bullish'
                    WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END
      HAVING count(*) >= 100
    )
    SELECT count(*)::int, count(*) FILTER (WHERE rr > 0 AND wr > 1.0/(1.0+rr))::int
      INTO v_total, v_above FROM cells;
    v_expected := round(v_total / 2.0, 1);
    passed := v_above > v_expected;
    observed_value := v_above || ' of ' || v_total || ' cells beat their random-walk baseline (chance predicts ~' || v_expected || ')';
    detail := jsonb_build_object('cells_tested', v_total, 'above_baseline', v_above, 'expected_by_chance', v_expected);
    RETURN NEXT; RETURN;

  ELSIF p_name = 'train_test_correlation' THEN
    SELECT round(corr(edge_points_train, edge_points_test)::numeric, 3), count(*)::int
      INTO v_corr, v_total
    FROM public.cell_validation
    WHERE is_current
      AND n_train >= 100 AND n_test >= 100
      AND edge_points_train IS NOT NULL AND edge_points_test IS NOT NULL;
    passed := v_corr IS NOT NULL AND v_corr >= 0.4;
    observed_value := coalesce(v_corr::text, 'n/a') || ' train/test correlation of edge_points over ' || coalesce(v_total,0) || ' cells';
    detail := jsonb_build_object('correlation', v_corr, 'cells', v_total, 'threshold', 0.4);
    RETURN NEXT; RETURN;

  ELSIF p_name = 'cell_decay' THEN
    SELECT count(*)::int INTO v_decay
    FROM public.v_cell_validation_latest v
    WHERE v.status = 'failed'
      AND EXISTS (SELECT 1 FROM public.cell_validation p
                   WHERE p.pattern_id = v.pattern_id AND p.timeframe = v.timeframe
                     AND p.asset_type = v.asset_type AND p.direction = v.direction
                     AND p.status = 'validated' AND p.test_end < v.test_end);
    passed := v_decay = 0;
    observed_value := v_decay || ' previously validated cells now fail validation';
    detail := jsonb_build_object('decayed_cells', v_decay);
    RETURN NEXT; RETURN;

  ELSIF p_name = 'validation_pool_single_current' THEN
    -- Stale validation runs left is_current set, so the pool double-counted.
    WITH d AS (
      SELECT pattern_id, timeframe, asset_type, direction, entry_mode, count(*) AS n
      FROM public.cell_validation
      WHERE is_current
      GROUP BY 1,2,3,4,5
      HAVING count(*) > 1
    )
    SELECT count(*)::int, coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.n DESC), '[]'::jsonb)
      INTO v_dupes, v_rows FROM d;
    passed := v_dupes = 0;
    observed_value := v_dupes || ' cell/entry_mode combinations have more than one current validation row';
    detail := jsonb_build_object('duplicate_combinations', v_dupes, 'examples', v_rows);
    RETURN NEXT; RETURN;
  END IF;

  passed := false;
  observed_value := 'no implementation for check';
  detail := NULL;
  RETURN NEXT;
END;
$function$;