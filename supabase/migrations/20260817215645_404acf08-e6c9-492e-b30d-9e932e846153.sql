CREATE OR REPLACE FUNCTION public.run_extra_health_check(p_name text)
 RETURNS TABLE(passed boolean, observed_value text, detail jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total int; v_above int; v_expected numeric; v_corr numeric; v_decay int;
  v_dupes int; v_rows jsonb;
  v_last timestamptz; v_recent bigint; v_quarantined bigint;
  v_runs int; v_bad int; v_rate numeric;
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

  ELSIF p_name = 'live_detections_unique_rows' THEN
    SELECT count(*)::int INTO v_dupes FROM (
      SELECT id FROM public.v_live_detections_with_edge GROUP BY id HAVING count(*) > 1
    ) dd;
    passed := v_dupes = 0;
    observed_value := v_dupes || ' live detections returned more than one row';
    detail := jsonb_build_object('duplicate_detections', v_dupes);
    RETURN NEXT; RETURN;

  ELSIF p_name = 'validation_pool_single_current' THEN
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

  ELSIF p_name = 'ingestion_alive' THEN
    -- The seeder writes every ~12 minutes. Six hours of silence is dead,
    -- not slow. detections_fresh_per_asset_class at 48h is far too slow.
    SELECT max(h.created_at) INTO v_last
    FROM public.historical_pattern_occurrences h
    WHERE h.created_at >= now() - interval '7 days';
    SELECT count(*), count(*) FILTER (WHERE h.execution_status = 'invalid_risk_distance')
      INTO v_recent, v_quarantined
    FROM public.historical_pattern_occurrences h
    WHERE h.created_at >= now() - interval '6 hours';
    passed := coalesce(v_recent, 0) > 0;
    observed_value := coalesce(v_recent, 0) || ' rows ingested in the last 6 hours (last write: '
      || coalesce(to_char(v_last, 'YYYY-MM-DD HH24:MI UTC'), 'none in 7 days') || ')';
    detail := jsonb_build_object('rows_6h', v_recent, 'quarantined_6h', v_quarantined,
                                 'last_insert_at', v_last, 'window_hours', 6);
    RETURN NEXT; RETURN;

  ELSIF p_name = 'seeder_error_rate' THEN
    -- HTTP 546 is an edge-runtime resource kill: the process dies with no
    -- response and no in-function error handler, so the only evidence is a
    -- start row that never got finished. Anything still 'running' after 15
    -- minutes counts as a failure.
    SELECT count(*)::int,
           count(*) FILTER (
             WHERE status = 'error'
                OR (status = 'running' AND started_at < now() - interval '15 minutes')
           )::int
      INTO v_runs, v_bad
    FROM public.seed_invocation_log
    WHERE function_name = 'seed-historical-patterns-mtf'
      AND started_at >= now() - interval '3 hours';

    v_rate := CASE WHEN v_runs > 0 THEN round(100.0 * v_bad / v_runs, 1) ELSE 0 END;
    -- No invocations at all is ingestion_alive's job, not this check's.
    passed := v_runs = 0 OR v_rate <= 20;
    observed_value := v_bad || ' of ' || v_runs || ' seeder invocations failed in the last 3 hours ('
                      || v_rate || '%)';
    detail := jsonb_build_object('invocations_3h', v_runs, 'failed_3h', v_bad,
                                 'error_rate_pct', v_rate, 'threshold_pct', 20);
    RETURN NEXT; RETURN;
  END IF;

  passed := false;
  observed_value := 'no implementation for check';
  detail := NULL;
  RETURN NEXT;
END;
$function$;