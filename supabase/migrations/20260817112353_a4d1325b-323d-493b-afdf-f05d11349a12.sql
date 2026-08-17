-- 1. Columns
ALTER TABLE public.cell_validation
  ADD COLUMN IF NOT EXISTS validation_run_id uuid,
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT false;

-- 2. Backfill: newest row per cell+entry_mode becomes current
WITH latest AS (
  SELECT DISTINCT ON (pattern_id, timeframe, asset_type, direction, entry_mode) id
  FROM public.cell_validation
  ORDER BY pattern_id, timeframe, asset_type, direction, entry_mode,
           test_end DESC, validated_at DESC
)
UPDATE public.cell_validation cv
SET is_current = (cv.id IN (SELECT id FROM latest));

-- 3. Duplicates cannot recur
CREATE UNIQUE INDEX IF NOT EXISTS cell_validation_current_unique
  ON public.cell_validation (pattern_id, timeframe, asset_type, direction, entry_mode)
  WHERE is_current;

CREATE INDEX IF NOT EXISTS cell_validation_run_idx
  ON public.cell_validation (validation_run_id);

-- 4. Latest view: current rows only, entry_mode exposed
CREATE OR REPLACE VIEW public.v_cell_validation_latest
WITH (security_invoker = true) AS
  SELECT pattern_id, timeframe, asset_type, direction,
         status, persisted, n_train, n_test,
         edge_points_train, edge_points_test,
         train_start, train_end, test_start, test_end,
         candidate_registered_at, validated_at,
         entry_mode, validation_run_id
  FROM public.cell_validation
  WHERE is_current;

-- 5. Validation writer: one run id, atomic swap of the current pointer
CREATE OR REPLACE FUNCTION public.run_cell_validation(
  p_cut_months integer DEFAULT 12,
  p_window_start date DEFAULT '2024-01-01'::date,
  p_min_n integer DEFAULT 100,
  p_geometry_source text DEFAULT NULL::text,
  p_entry_mode text DEFAULT 'next_open'::text)
 RETURNS TABLE(cells_scored integer, validated integer, failed integer, insufficient integer, decayed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cut date := (date_trunc('month', now()) - make_interval(months => p_cut_months))::date;
  v_end date := current_date;
  v_run uuid := gen_random_uuid();
  v_scored int := 0; v_val int := 0; v_fail int := 0; v_ins int := 0; v_decay int := 0;
  r record;
BEGIN
  FOR r IN
    WITH base AS (
      SELECT h.pattern_id, h.timeframe, h.asset_type,
             CASE lower(h.direction) WHEN 'long' THEN 'bullish'
                  WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END AS dir,
             (h.detected_at::date < v_cut) AS is_train,
             ((CASE WHEN p_entry_mode = 'close' THEN h.outcome ELSE h.outcome_exec END) = 'hit_tp') AS win,
             h.risk_reward_ratio AS rr
      FROM (SELECT * FROM public.historical_pattern_occurrences WHERE execution_status = 'valid') h
      WHERE (CASE WHEN p_entry_mode = 'close' THEN h.outcome ELSE h.outcome_exec END) IN ('hit_tp','hit_sl')
        AND (CASE WHEN p_entry_mode = 'close' THEN h.bars_to_outcome ELSE h.bars_to_outcome_exec END) IS NOT NULL
        AND h.detected_at >= p_window_start
        AND (p_geometry_source IS NULL OR h.geometry_source = p_geometry_source)
    )
    SELECT pattern_id, timeframe, asset_type, dir,
      count(*) FILTER (WHERE is_train) AS n_train,
      count(*) FILTER (WHERE NOT is_train) AS n_test,
      avg(CASE WHEN win THEN 1.0 ELSE 0 END) FILTER (WHERE is_train) AS wr_train,
      avg(CASE WHEN win THEN 1.0 ELSE 0 END) FILTER (WHERE NOT is_train) AS wr_test,
      avg(rr) FILTER (WHERE is_train) AS rr_train,
      avg(rr) FILTER (WHERE NOT is_train) AS rr_test
    FROM base
    GROUP BY pattern_id, timeframe, asset_type, dir
  LOOP
    DECLARE
      ep_train numeric := CASE WHEN coalesce(r.rr_train,0) > 0
        THEN (r.wr_train - 1.0/(1.0 + r.rr_train)) * 100 END;
      ep_test numeric := CASE WHEN coalesce(r.rr_test,0) > 0
        THEN (r.wr_test - 1.0/(1.0 + r.rr_test)) * 100 END;
      v_status text; v_persisted boolean; v_was_validated boolean;
    BEGIN
      IF coalesce(r.n_train,0) = 0 AND coalesce(r.n_test,0) = 0 THEN
        CONTINUE;
      END IF;

      IF r.n_train >= p_min_n AND r.n_test >= p_min_n
         AND ep_train IS NOT NULL AND ep_test IS NOT NULL THEN
        v_persisted := ep_train > 0 AND ep_test > 0;
        v_status := CASE WHEN v_persisted THEN 'validated' ELSE 'failed' END;
      ELSE
        v_persisted := false;
        v_status := 'insufficient_sample';
      END IF;

      -- Prior state is read from the current pointer only.
      SELECT coalesce(bool_or(cv.status = 'validated'), false) INTO v_was_validated
      FROM public.cell_validation cv
      WHERE cv.pattern_id = r.pattern_id AND cv.timeframe = r.timeframe
        AND cv.asset_type = r.asset_type AND cv.direction = r.dir
        AND cv.entry_mode = p_entry_mode AND cv.is_current;

      INSERT INTO public.cell_validation (
        pattern_id, timeframe, asset_type, direction, entry_mode,
        train_start, train_end, test_start, test_end,
        n_train, n_test, edge_points_train, edge_points_test,
        persisted, status, candidate_registered_at, validated_at,
        validation_run_id, is_current)
      VALUES (
        r.pattern_id, r.timeframe, r.asset_type, r.dir, p_entry_mode,
        p_window_start, v_cut - 1, v_cut, v_end,
        r.n_train, r.n_test, round(ep_train, 3), round(ep_test, 3),
        v_persisted, v_status,
        coalesce((SELECT min(prev.candidate_registered_at) FROM public.cell_validation prev
          WHERE prev.pattern_id = r.pattern_id AND prev.timeframe = r.timeframe
            AND prev.asset_type = r.asset_type AND prev.direction = r.dir
            AND prev.entry_mode = p_entry_mode), now()),
        now(), v_run, false)
      ON CONFLICT (pattern_id, timeframe, asset_type, direction, entry_mode, test_start, test_end)
      DO UPDATE SET
        n_train = EXCLUDED.n_train, n_test = EXCLUDED.n_test,
        edge_points_train = EXCLUDED.edge_points_train,
        edge_points_test = EXCLUDED.edge_points_test,
        persisted = EXCLUDED.persisted, status = EXCLUDED.status,
        validated_at = now(),
        validation_run_id = EXCLUDED.validation_run_id,
        is_current = false;

      v_scored := v_scored + 1;
      IF v_status = 'validated' THEN v_val := v_val + 1;
      ELSIF v_status = 'failed' THEN v_fail := v_fail + 1;
      ELSE v_ins := v_ins + 1; END IF;

      IF p_entry_mode <> 'close' AND v_was_validated AND v_status = 'failed' THEN
        v_decay := v_decay + 1;
        UPDATE public.cell_status cs
          SET status = 'suspended', suspended_at = coalesce(cs.suspended_at, now()),
              suspended_reason = 'validation decay: edge_points_test '
                || coalesce(round(ep_test,2)::text,'n/a') || ' after previously validating',
              last_evaluated_at = now(), updated_at = now()
        WHERE cs.pattern_id = r.pattern_id AND cs.timeframe = r.timeframe
          AND cs.asset_type = r.asset_type AND cs.direction = r.dir;
        IF NOT FOUND THEN
          INSERT INTO public.cell_status (pattern_id, timeframe, asset_type, direction,
                                          status, suspended_at, suspended_reason, last_evaluated_at)
          VALUES (r.pattern_id, r.timeframe, r.asset_type, r.dir, 'suspended', now(),
                  'validation decay: edge_points_test '
                  || coalesce(round(ep_test,2)::text,'n/a') || ' after previously validating', now());
        END IF;
      END IF;
    END;
  END LOOP;

  -- Atomic pointer swap: retire the previous run, promote this one.
  UPDATE public.cell_validation
     SET is_current = false
   WHERE entry_mode = p_entry_mode AND is_current
     AND validation_run_id IS DISTINCT FROM v_run;

  UPDATE public.cell_validation
     SET is_current = true
   WHERE entry_mode = p_entry_mode AND validation_run_id = v_run;

  cells_scored := v_scored; validated := v_val; failed := v_fail;
  insufficient := v_ins; decayed := v_decay;
  RETURN NEXT;
END;
$function$;

-- 6. Every consumer function reads current rows only
DO $do$
DECLARE f record; src text; newsrc text;
BEGIN
  FOR f IN
    SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND p.proname IN ('get_pattern_edge','get_pattern_outcome_cells',
                        'get_forward_validated_split','get_forward_vs_predicted')
  LOOP
    src := pg_get_functiondef(f.oid);
    newsrc := replace(src, 'public.cell_validation cv2',
                      '(SELECT * FROM public.cell_validation WHERE is_current) cv2');
    newsrc := replace(newsrc, 'public.cell_validation cv,',
                      '(SELECT * FROM public.cell_validation WHERE is_current) cv,');
    newsrc := replace(newsrc, 'public.cell_validation cv' || chr(10),
                      '(SELECT * FROM public.cell_validation WHERE is_current) cv' || chr(10));
    IF newsrc <> src THEN EXECUTE newsrc; END IF;
  END LOOP;
END $do$;

-- 7. Health check: only one current row per cell per entry mode
INSERT INTO public.data_health_checks (check_name, category, severity, description, expected_result, is_enabled)
VALUES ('validation_pool_single_current', 'consistency', 'critical',
        'Each pattern/timeframe/asset/direction/entry_mode combination must have exactly one is_current row in cell_validation. More than one means stale validation runs are being counted twice.',
        '0 duplicated current rows', true)
ON CONFLICT (check_name) DO UPDATE
  SET severity = EXCLUDED.severity,
      description = EXCLUDED.description,
      expected_result = EXCLUDED.expected_result,
      is_enabled = true;