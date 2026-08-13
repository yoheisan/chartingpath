CREATE OR REPLACE FUNCTION public.run_data_health_checks(p_only text DEFAULT NULL)
RETURNS TABLE (
  check_name text,
  severity text,
  passed boolean,
  observed_value text,
  detail jsonb,
  duration_ms integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  c record;
  t0 timestamptz;
  v_passed boolean;
  v_obs text;
  v_detail jsonb;
  v_ms integer;
  v_int bigint;
  v_num numeric;
  r record;
  v_arr text[];
BEGIN
  FOR c IN
    SELECT dhc.check_name AS name, dhc.severity AS sev
    FROM public.data_health_checks dhc
    WHERE dhc.is_enabled
      AND (p_only IS NULL OR dhc.check_name = p_only)
    ORDER BY CASE dhc.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, dhc.check_name
  LOOP
    t0 := clock_timestamp();
    v_passed := NULL; v_obs := NULL; v_detail := NULL;

    BEGIN
      CASE c.name

      WHEN 'outcome_r_in_range' THEN
        SELECT count(*) INTO v_int FROM public.paper_trades
        WHERE status = 'closed' AND outcome_r IS NOT NULL
          AND (outcome_r < -1.05 OR outcome_r > 10);
        v_passed := v_int = 0;
        v_obs := v_int || ' impossible R values';
        SELECT jsonb_agg(jsonb_build_object('id', id, 'symbol', symbol, 'outcome_r', outcome_r))
          INTO v_detail
        FROM (SELECT id, symbol, outcome_r FROM public.paper_trades
              WHERE status='closed' AND outcome_r IS NOT NULL
                AND (outcome_r < -1.05 OR outcome_r > 10) LIMIT 20) s;

      WHEN 'exit_price_matches_trigger' THEN
        SELECT count(*) INTO v_int FROM public.paper_trades
        WHERE status='closed' AND exit_price IS NOT NULL
          AND (
            (lower(close_reason) LIKE 'stop loss hit%' AND stop_loss IS NOT NULL
              AND abs(exit_price - stop_loss) > abs(stop_loss) * 0.01)
            OR
            (lower(close_reason) LIKE 'take profit hit%' AND take_profit IS NOT NULL
              AND abs(exit_price - take_profit) > abs(take_profit) * 0.01)
          );
        v_passed := v_int = 0;
        v_obs := v_int || ' level-triggered closes off their trigger by >1%';
        SELECT jsonb_agg(jsonb_build_object('id', id, 'symbol', symbol, 'reason', close_reason,
                                            'exit', exit_price, 'stop', stop_loss, 'target', take_profit))
          INTO v_detail
        FROM (
          SELECT id, symbol, close_reason, exit_price, stop_loss, take_profit
          FROM public.paper_trades
          WHERE status='closed' AND exit_price IS NOT NULL
            AND ((lower(close_reason) LIKE 'stop loss hit%' AND stop_loss IS NOT NULL
                   AND abs(exit_price - stop_loss) > abs(stop_loss) * 0.01)
              OR (lower(close_reason) LIKE 'take profit hit%' AND take_profit IS NOT NULL
                   AND abs(exit_price - take_profit) > abs(take_profit) * 0.01))
          LIMIT 20) s;

      WHEN 'exit_price_sane' THEN
        SELECT count(*) INTO v_int FROM public.paper_trades
        WHERE status='closed' AND exit_price IS NOT NULL AND entry_price > 0
          AND abs(exit_price - entry_price) / entry_price > 0.5;
        v_passed := v_int = 0;
        v_obs := v_int || ' closes more than 50% away from entry';

      WHEN 'detections_fresh_per_asset_class' THEN
        SELECT array_agg(x.asset_type ORDER BY x.asset_type), jsonb_object_agg(x.asset_type, x.last_seen)
          INTO v_arr, v_detail
        FROM (
          SELECT i.asset_type,
                 (SELECT max(d.updated_at) FROM public.live_pattern_detections d
                   WHERE d.asset_type = i.asset_type) AS last_seen
          FROM public.instruments i
          WHERE i.is_active
          GROUP BY i.asset_type
        ) x
        WHERE x.last_seen IS NULL OR x.last_seen < now() - interval '48 hours';
        v_passed := coalesce(array_length(v_arr,1),0) = 0;
        v_obs := CASE WHEN v_passed THEN 'all asset classes fresh'
                      ELSE 'stale: ' || array_to_string(v_arr, ', ') END;

      -- Uses bar `date` (indexed) rather than updated_at: a full scan of a
      -- 2.4 GB table would make the monitor itself unreliable.
      WHEN 'prices_fresh_per_asset_class' THEN
        SELECT array_agg(x.asset_type ORDER BY x.asset_type), jsonb_object_agg(x.asset_type, x.fresh)
          INTO v_arr, v_detail
        FROM (
          SELECT i.asset_type,
                 count(*) FILTER (WHERE f.symbol IS NOT NULL) AS fresh
          FROM public.instruments i
          LEFT JOIN (
            SELECT DISTINCT symbol FROM public.historical_prices
            WHERE date > now() - interval '48 hours'
          ) f ON f.symbol = i.symbol
          WHERE i.is_active
          GROUP BY i.asset_type
        ) x
        WHERE x.fresh = 0;
        v_passed := coalesce(array_length(v_arr,1),0) = 0;
        v_obs := CASE WHEN v_passed THEN 'all asset classes priced within 48h'
                      ELSE 'no fresh prices: ' || array_to_string(v_arr, ', ') END;

      WHEN 'no_duplicate_paper_trades' THEN
        SELECT count(*) INTO v_int FROM (
          SELECT user_id, detection_id FROM public.paper_trades
          WHERE detection_id IS NOT NULL
          GROUP BY user_id, detection_id HAVING count(*) > 1
        ) d;
        v_passed := v_int = 0;
        v_obs := v_int || ' duplicate (user, detection) groups';

      WHEN 'alerts_dispatch_alive' THEN
        DECLARE
          v_alerts bigint; v_dets bigint; v_last timestamptz;
        BEGIN
          SELECT count(*) INTO v_alerts FROM public.alerts WHERE status = 'active';
          SELECT count(*) INTO v_dets FROM public.live_pattern_detections
            WHERE updated_at > now() - interval '7 days';
          SELECT max(triggered_at) INTO v_last FROM public.alerts_log;
          IF v_alerts = 0 OR v_dets = 0 THEN
            v_passed := true;
            v_obs := 'not applicable (' || v_alerts || ' active alerts, ' || v_dets || ' recent detections)';
          ELSE
            v_passed := v_last IS NOT NULL AND v_last > now() - interval '7 days';
            v_obs := 'last dispatch: ' || coalesce(v_last::text, 'never')
                     || ' (' || v_alerts || ' active alerts, ' || v_dets || ' detections/7d)';
          END IF;
          v_detail := jsonb_build_object('active_alerts', v_alerts, 'detections_7d', v_dets, 'last_dispatch', v_last);
        END;

      WHEN 'vocabulary_consistency' THEN
        DECLARE
          bad_assets text[]; bad_dirs text[]; bad_hist_dirs text[];
        BEGIN
          SELECT array_agg(DISTINCT h.asset_type) INTO bad_assets
          FROM public.historical_pattern_occurrences h
          WHERE h.asset_type IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM public.data_health_vocabulary v
              WHERE v.domain = 'asset_type' AND v.canonical_value = lower(h.asset_type));

          SELECT array_agg(DISTINCT d.direction) INTO bad_dirs
          FROM public.live_pattern_detections d
          WHERE d.direction IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM public.data_health_vocabulary v
              WHERE v.domain = 'direction'
                AND (v.canonical_value = lower(d.direction) OR lower(d.direction) = ANY (v.aliases)));

          SELECT array_agg(DISTINCT h.direction) INTO bad_hist_dirs
          FROM public.historical_pattern_occurrences h
          WHERE h.direction IS NOT NULL
            AND NOT EXISTS (
              SELECT 1 FROM public.data_health_vocabulary v
              WHERE v.domain = 'direction' AND v.canonical_value = lower(h.direction));

          v_passed := coalesce(array_length(bad_assets,1),0) = 0
                  AND coalesce(array_length(bad_dirs,1),0) = 0
                  AND coalesce(array_length(bad_hist_dirs,1),0) = 0;
          v_obs := 'unknown asset_type: ' || coalesce(array_to_string(bad_assets,','),'none')
                || ' | untranslatable live direction: ' || coalesce(array_to_string(bad_dirs,','),'none')
                || ' | non-canonical historical direction: ' || coalesce(array_to_string(bad_hist_dirs,','),'none');
          v_detail := jsonb_build_object('bad_asset_types', bad_assets,
                                         'bad_live_directions', bad_dirs,
                                         'bad_historical_directions', bad_hist_dirs);
        END;

      WHEN 'fx_stop_distance_sane' THEN
        SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY pips) INTO v_num
        FROM (
          SELECT abs(entry_price - stop_loss_price)
                 * CASE WHEN symbol ILIKE '%JPY%' THEN 100 ELSE 10000 END AS pips
          FROM public.historical_pattern_occurrences
          WHERE lower(asset_type) = 'fx'
            AND entry_price IS NOT NULL AND stop_loss_price IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 20000
        ) s;
        v_passed := v_num IS NULL OR v_num < 500;
        v_obs := 'median FX stop = ' || coalesce(round(v_num, 1)::text, 'n/a') || ' pips';

      -- Coverage over a 7-day window so weekends do not create false alarms.
      WHEN 'scanner_coverage' THEN
        SELECT array_agg(x.asset_type || ' ' || x.fresh || '/' || x.total ORDER BY x.asset_type),
               jsonb_object_agg(x.asset_type, jsonb_build_object('covered', x.fresh, 'total', x.total))
          INTO v_arr, v_detail
        FROM (
          SELECT i.asset_type,
                 count(*) AS total,
                 count(*) FILTER (WHERE f.symbol IS NOT NULL) AS fresh
          FROM public.instruments i
          LEFT JOIN (
            SELECT DISTINCT symbol FROM public.historical_prices
            WHERE date > now() - interval '7 days'
          ) f ON f.symbol = i.symbol
          WHERE i.is_active
          GROUP BY i.asset_type
        ) x
        WHERE x.total > 0 AND x.fresh::numeric / x.total < 0.9;
        v_passed := coalesce(array_length(v_arr,1),0) = 0;
        v_obs := CASE WHEN v_passed THEN 'coverage >= 90% everywhere'
                      ELSE 'under-covered: ' || array_to_string(v_arr, ', ') END;

      WHEN 'supported_patterns_current' THEN
        SELECT array_agg(DISTINCT h.pattern_id) INTO v_arr
        FROM public.historical_pattern_occurrences h
        WHERE h.pattern_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM public.supported_patterns sp
            WHERE sp.pattern_id = h.pattern_id AND sp.is_supported);
        v_passed := coalesce(array_length(v_arr,1),0) = 0;
        v_obs := CASE WHEN v_passed THEN 'all detected patterns marked supported'
                      ELSE 'unmarked: ' || array_to_string(v_arr, ', ') END;
        v_detail := jsonb_build_object('unmarked', v_arr);

      WHEN 'no_orphan_enum_options' THEN
        SELECT array_agg(e.enumlabel::text ORDER BY e.enumlabel) INTO v_arr
        FROM pg_enum e
        JOIN pg_type ty ON ty.oid = e.enumtypid
        WHERE ty.typname = 'chart_pattern'
          AND NOT EXISTS (SELECT 1 FROM public.live_pattern_detections d WHERE d.pattern_id = e.enumlabel::text)
          AND NOT EXISTS (SELECT 1 FROM public.historical_pattern_occurrences h WHERE h.pattern_id = e.enumlabel::text);
        v_passed := coalesce(array_length(v_arr,1),0) = 0;
        v_obs := coalesce(array_length(v_arr,1),0) || ' enum values with zero detections';
        v_detail := jsonb_build_object('orphans', v_arr);

      WHEN 'columns_never_populated' THEN
        v_arr := ARRAY[]::text[];
        FOR r IN
          SELECT c2.table_name, c2.column_name
          FROM information_schema.columns c2
          WHERE c2.table_schema = 'public'
            AND c2.table_name IN ('instruments','historical_pattern_occurrences',
                                  'live_pattern_detections','paper_trades','alerts')
            AND c2.is_nullable = 'YES'
        LOOP
          EXECUTE format(
            'SELECT count(*) FROM (SELECT 1 FROM public.%I WHERE %I IS NOT NULL LIMIT 1) s',
            r.table_name, r.column_name) INTO v_int;
          IF v_int = 0 THEN
            EXECUTE format('SELECT count(*) FROM (SELECT 1 FROM public.%I LIMIT 1) s', r.table_name) INTO v_int;
            IF v_int > 0 THEN
              v_arr := v_arr || (r.table_name || '.' || r.column_name);
            END IF;
          END IF;
        END LOOP;
        v_passed := coalesce(array_length(v_arr,1),0) = 0;
        v_obs := coalesce(array_length(v_arr,1),0) || ' columns are 100% NULL';
        v_detail := jsonb_build_object('empty_columns', v_arr);

      WHEN 'cron_jobs_producing_output' THEN
        v_arr := ARRAY[]::text[];
        FOR r IN
          SELECT ex.job_name, ex.target_table, ex.timestamp_column, ex.window_hours
          FROM public.data_health_cron_expectations ex
          JOIN cron.job j ON j.jobname = ex.job_name AND j.active
          WHERE ex.is_enabled
        LOOP
          EXECUTE format(
            'SELECT count(*) FROM (SELECT 1 FROM public.%I WHERE %I > now() - interval ''%s hours'' LIMIT 1) s',
            r.target_table, r.timestamp_column, r.window_hours) INTO v_int;
          IF v_int = 0 THEN
            v_arr := v_arr || (r.job_name || ' -> ' || r.target_table || ' (0 rows/' || r.window_hours || 'h)');
          END IF;
        END LOOP;
        v_passed := coalesce(array_length(v_arr,1),0) = 0;
        v_obs := CASE WHEN v_passed THEN 'all declared jobs produced rows'
                      ELSE 'silent: ' || array_to_string(v_arr, '; ') END;
        v_detail := jsonb_build_object('silent_jobs', v_arr);

      ELSE
        v_passed := false;
        v_obs := 'no implementation for check';
      END CASE;

    EXCEPTION WHEN OTHERS THEN
      v_passed := false;
      v_obs := 'check error: ' || SQLERRM;
      v_detail := jsonb_build_object('sqlstate', SQLSTATE);
    END;

    v_ms := (EXTRACT(EPOCH FROM (clock_timestamp() - t0)) * 1000)::integer;

    INSERT INTO public.data_health_results (check_name, passed, observed_value, detail, severity, duration_ms)
    VALUES (c.name, v_passed, v_obs, v_detail, c.sev, v_ms);

    check_name := c.name;
    severity := c.sev;
    passed := v_passed;
    observed_value := v_obs;
    detail := v_detail;
    duration_ms := v_ms;
    RETURN NEXT;
  END LOOP;
END;
$fn$;