ALTER VIEW public.v_live_detections_with_edge SET (security_invoker = on);

DO $mig$
DECLARE d text; branch text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO d
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'run_data_health_checks';

  IF d IS NULL THEN RAISE EXCEPTION 'run_data_health_checks not found'; END IF;
  IF position('geometry_source_distribution' in d) > 0 THEN RETURN; END IF;

  branch := $b$
      WHEN 'geometry_source_distribution' THEN
        SELECT count(*) INTO v_int FROM (
          SELECT h.pattern_id
          FROM public.historical_pattern_occurrences h
          WHERE h.outcome IN ('hit_tp','hit_sl')
            AND h.detected_at >= date '2024-01-01'
          GROUP BY h.pattern_id
          HAVING count(*) FILTER (WHERE h.geometry_source = 'atr_fallback')::numeric
                 / NULLIF(count(*), 0) > 0.5
        ) s;
        v_passed := v_int = 0;
        v_obs := v_int || ' patterns derive >50% of occurrences from the generic ATR fallback';
        SELECT jsonb_agg(jsonb_build_object('pattern_id', x.pattern_id, 'total', x.total,
                                            'atr_fallback', x.fb, 'unknown', x.unk,
                                            'fallback_share', round(x.fb::numeric / NULLIF(x.total,0), 3)))
          INTO v_detail
        FROM (
          SELECT h.pattern_id, count(*) AS total,
                 count(*) FILTER (WHERE h.geometry_source = 'atr_fallback') AS fb,
                 count(*) FILTER (WHERE h.geometry_source = 'unknown') AS unk
          FROM public.historical_pattern_occurrences h
          WHERE h.outcome IN ('hit_tp','hit_sl')
            AND h.detected_at >= date '2024-01-01'
          GROUP BY h.pattern_id
          ORDER BY count(*) FILTER (WHERE h.geometry_source = 'atr_fallback')::numeric
                   / NULLIF(count(*),0) DESC NULLS LAST
          LIMIT 20
        ) x;

$b$;

  d := replace(d, '      WHEN ''outcome_r_in_range'' THEN', branch || '      WHEN ''outcome_r_in_range'' THEN');
  EXECUTE d;
END $mig$;