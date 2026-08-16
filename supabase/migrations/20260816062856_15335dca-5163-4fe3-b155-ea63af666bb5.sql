-- 1. Remove the empty pre-registration rows (one per real cell)
DELETE FROM public.cell_validation
WHERE coalesce(n_train,0) = 0 AND coalesce(n_test,0) = 0
  AND status = 'insufficient_sample';

-- 2. One record per cell per test period
CREATE UNIQUE INDEX IF NOT EXISTS cell_validation_cell_test_end_uniq
  ON public.cell_validation (pattern_id, timeframe, asset_type, direction, test_end);

-- 3. Stop the job emitting empty rows
CREATE OR REPLACE FUNCTION public.run_cell_validation(p_cut_months integer DEFAULT 12, p_window_start date DEFAULT '2024-01-01'::date, p_min_n integer DEFAULT 100, p_geometry_source text DEFAULT NULL::text)
 RETURNS TABLE(cells_scored integer, validated integer, failed integer, insufficient integer, decayed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cut date := (date_trunc('month', now()) - make_interval(months => p_cut_months))::date;
  v_end date := current_date;
  v_scored int := 0; v_val int := 0; v_fail int := 0; v_ins int := 0; v_decay int := 0;
  r record;
BEGIN
  FOR r IN
    WITH base AS (
      SELECT h.pattern_id, h.timeframe, h.asset_type,
             CASE lower(h.direction) WHEN 'long' THEN 'bullish'
                  WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END AS dir,
             (h.detected_at::date < v_cut) AS is_train,
             (h.outcome = 'hit_tp') AS win,
             h.risk_reward_ratio AS rr
      FROM public.historical_pattern_occurrences h
      WHERE h.outcome IN ('hit_tp','hit_sl')
        AND h.bars_to_outcome IS NOT NULL
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
      v_status text;
      v_persisted boolean;
      v_was_validated boolean;
    BEGIN
      -- Never write a row with no observations at all. Empty rows made every
      -- cell look duplicated and polluted the status counts.
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

      SELECT coalesce(bool_or(cv.status = 'validated'), false) INTO v_was_validated
      FROM public.cell_validation cv
      WHERE cv.pattern_id = r.pattern_id AND cv.timeframe = r.timeframe
        AND cv.asset_type = r.asset_type AND cv.direction = r.dir;

      INSERT INTO public.cell_validation (
        pattern_id, timeframe, asset_type, direction,
        train_start, train_end, test_start, test_end,
        n_train, n_test, edge_points_train, edge_points_test,
        persisted, status, candidate_registered_at, validated_at)
      VALUES (
        r.pattern_id, r.timeframe, r.asset_type, r.dir,
        p_window_start, v_cut - 1, v_cut, v_end,
        r.n_train, r.n_test, round(ep_train, 3), round(ep_test, 3),
        v_persisted, v_status,
        -- Pre-registration: keep the earliest moment this cell was ever scored.
        coalesce((SELECT min(prev.candidate_registered_at) FROM public.cell_validation prev
          WHERE prev.pattern_id = r.pattern_id AND prev.timeframe = r.timeframe
            AND prev.asset_type = r.asset_type AND prev.direction = r.dir), now()),
        now())
      ON CONFLICT (pattern_id, timeframe, asset_type, direction, test_start, test_end)
      DO UPDATE SET
        n_train = EXCLUDED.n_train, n_test = EXCLUDED.n_test,
        edge_points_train = EXCLUDED.edge_points_train,
        edge_points_test = EXCLUDED.edge_points_test,
        persisted = EXCLUDED.persisted, status = EXCLUDED.status,
        validated_at = now();

      v_scored := v_scored + 1;
      IF v_status = 'validated' THEN v_val := v_val + 1;
      ELSIF v_status = 'failed' THEN v_fail := v_fail + 1;
      ELSE v_ins := v_ins + 1; END IF;

      IF v_was_validated AND v_status = 'failed' THEN
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

  cells_scored := v_scored; validated := v_val; failed := v_fail;
  insufficient := v_ins; decayed := v_decay;
  RETURN NEXT;
END;
$function$;

-- 4. Master plan: three-screen model
ALTER TABLE public.master_plans
  ADD COLUMN IF NOT EXISTS max_correlated_exposure_pct numeric DEFAULT 4.0,
  ADD COLUMN IF NOT EXISTS pool_directions text[] DEFAULT '{}';

ALTER TABLE public.master_plans
  ALTER COLUMN max_position_pct SET DEFAULT 1,
  ALTER COLUMN max_open_positions SET DEFAULT 3,
  ALTER COLUMN max_instruments SET DEFAULT 50;

-- 5. Forward record vs predicted edge, per cell
CREATE OR REPLACE FUNCTION public.get_forward_vs_predicted(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  pattern_id text, timeframe text, asset_type text, direction text,
  validation_status text, predicted_edge_points numeric,
  n_forward integer, n_wins integer,
  realised_win_rate numeric, avg_rr numeric,
  realised_edge_points numeric, avg_r numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH t AS (
    SELECT pt.pattern_id,
           pt.timeframe,
           pt.asset_type,
           CASE WHEN pt.trade_type IN ('long','buy') THEN 'bullish' ELSE 'bearish' END AS dir,
           pt.outcome_r,
           CASE WHEN pt.outcome_r > 0 THEN 1 ELSE 0 END AS win,
           CASE WHEN pt.entry_price IS NOT NULL AND pt.stop_loss IS NOT NULL
                     AND pt.take_profit IS NOT NULL
                     AND abs(pt.entry_price - pt.stop_loss) > 0
                THEN abs(pt.take_profit - pt.entry_price) / abs(pt.entry_price - pt.stop_loss) END AS rr
    FROM public.paper_trades pt
    WHERE pt.user_id = p_user_id
      AND pt.status = 'closed'
      AND coalesce(pt.data_quality_suspect, false) = false
      AND pt.outcome_r IS NOT NULL
      AND pt.pattern_id IS NOT NULL
  ), agg AS (
    SELECT t.pattern_id, t.timeframe, t.asset_type, t.dir,
           count(*)::int AS n_forward,
           sum(t.win)::int AS n_wins,
           avg(t.win)::numeric AS wr,
           avg(t.rr)::numeric AS avg_rr,
           avg(t.outcome_r)::numeric AS avg_r
    FROM t GROUP BY 1,2,3,4
  )
  SELECT a.pattern_id, a.timeframe, a.asset_type, a.dir,
         coalesce(cv.status, 'unvalidated') AS validation_status,
         cv.edge_points_test,
         a.n_forward, a.n_wins,
         round(a.wr * 100, 2),
         round(a.avg_rr, 3),
         CASE WHEN coalesce(a.avg_rr,0) > 0
              THEN round((a.wr - 1.0/(1.0 + a.avg_rr)) * 100, 2) END,
         round(a.avg_r, 3)
  FROM agg a
  LEFT JOIN LATERAL (
    SELECT cv2.status, cv2.edge_points_test
    FROM public.cell_validation cv2
    WHERE cv2.pattern_id = a.pattern_id AND cv2.timeframe = a.timeframe
      AND cv2.asset_type = a.asset_type AND cv2.direction = a.dir
    ORDER BY cv2.test_end DESC LIMIT 1
  ) cv ON true
  ORDER BY a.n_forward DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_forward_vs_predicted(uuid) TO authenticated, service_role;

-- 6. Validated vs unvalidated aggregate — the honesty check
CREATE OR REPLACE FUNCTION public.get_forward_validated_split(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(bucket text, n_trades integer, n_wins integer, avg_r numeric, total_r numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH t AS (
    SELECT CASE WHEN EXISTS (
             SELECT 1 FROM public.cell_validation cv
             WHERE cv.status = 'validated'
               AND cv.pattern_id = pt.pattern_id AND cv.timeframe = pt.timeframe
               AND cv.asset_type = pt.asset_type
               AND cv.direction = CASE WHEN pt.trade_type IN ('long','buy') THEN 'bullish' ELSE 'bearish' END
           ) THEN 'validated' ELSE 'unvalidated' END AS bucket,
           pt.outcome_r
    FROM public.paper_trades pt
    WHERE pt.user_id = p_user_id
      AND pt.status = 'closed'
      AND coalesce(pt.data_quality_suspect, false) = false
      AND pt.outcome_r IS NOT NULL
  )
  SELECT bucket, count(*)::int, count(*) FILTER (WHERE outcome_r > 0)::int,
         round(avg(outcome_r), 3), round(sum(outcome_r), 2)
  FROM t GROUP BY bucket;
$$;

GRANT EXECUTE ON FUNCTION public.get_forward_validated_split(uuid) TO authenticated, service_role;