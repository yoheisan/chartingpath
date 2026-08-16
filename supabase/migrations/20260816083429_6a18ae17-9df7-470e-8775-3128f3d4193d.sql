
-- Entry-mode aware outcome reporting.
-- 'close'     = entry at the confirming bar's close (NOT achievable in practice)
-- 'next_open' = entry at the next bar's open (realistic execution)

DROP FUNCTION IF EXISTS public.get_pattern_outcome_cells(text,text,integer,integer,text);

CREATE FUNCTION public.get_pattern_outcome_cells(
  p_asset_type text DEFAULT NULL,
  p_timeframe text DEFAULT NULL,
  p_min_trades integer DEFAULT 30,
  p_limit integer DEFAULT 200,
  p_geometry_source text DEFAULT NULL,
  p_entry_mode text DEFAULT 'next_open')
RETURNS TABLE(pattern_id text, pattern_name text, timeframe text, asset_type text, direction text,
  total_trades bigint, win_rate_pct numeric, expectancy_r numeric, avg_rr numeric, avg_bars numeric,
  edge_points numeric, baseline_win_rate_pct numeric, is_validated boolean, validation_status text,
  qualifies boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH src AS (
    SELECT h.pattern_id, h.pattern_name, h.timeframe, h.asset_type, h.direction,
           h.risk_reward_ratio,
           CASE WHEN p_entry_mode = 'close' THEN h.outcome ELSE h.outcome_exec END AS outcome,
           CASE WHEN p_entry_mode = 'close' THEN h.bars_to_outcome ELSE h.bars_to_outcome_exec END AS bars
    FROM public.historical_pattern_occurrences h
    WHERE (p_asset_type IS NULL OR h.asset_type = p_asset_type)
      AND (p_timeframe  IS NULL OR h.timeframe  = p_timeframe)
      AND (p_geometry_source IS NULL OR h.geometry_source = p_geometry_source)
  ),
  grouped AS (
    SELECT s.pattern_id, s.pattern_name, s.timeframe, s.asset_type, s.direction,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE s.outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE s.outcome = 'hit_sl') AS losses,
      AVG(s.risk_reward_ratio) FILTER (WHERE s.risk_reward_ratio IS NOT NULL) AS avg_rr_val,
      AVG(s.bars) AS avg_bars_val
    FROM src s
    WHERE s.outcome IN ('hit_tp','hit_sl') AND s.bars IS NOT NULL
    GROUP BY s.pattern_id, s.pattern_name, s.timeframe, s.asset_type, s.direction
    HAVING COUNT(*) >= p_min_trades
  ),
  calc AS (
    SELECT g.*,
      g.wins::numeric / g.total AS wr_frac,
      CASE WHEN COALESCE(g.avg_rr_val, 0) > 0 THEN 1.0 / (1.0 + g.avg_rr_val) END AS baseline,
      CASE lower(g.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish'
           ELSE lower(g.direction) END AS dir
    FROM grouped g
  )
  SELECT
    c.pattern_id, c.pattern_name, c.timeframe, c.asset_type, c.direction,
    c.total AS total_trades,
    ROUND(c.wr_frac * 100, 1) AS win_rate_pct,
    ROUND(c.wr_frac * COALESCE(c.avg_rr_val, 0) - (c.losses::numeric / c.total), 3) AS expectancy_r,
    ROUND(COALESCE(c.avg_rr_val, 0)::numeric, 2) AS avg_rr,
    ROUND(c.avg_bars_val::numeric, 1) AS avg_bars,
    ROUND(((c.wr_frac - c.baseline) * 100)::numeric, 2) AS edge_points,
    ROUND((c.baseline * 100)::numeric, 1) AS baseline_win_rate_pct,
    COALESCE(v.status = 'validated', false) AS is_validated,
    COALESCE(v.status, 'unvalidated') AS validation_status,
    (c.total >= 100 AND c.baseline IS NOT NULL AND c.wr_frac > c.baseline
       AND COALESCE(v.status = 'validated', false)) AS qualifies
  FROM calc c
  LEFT JOIN LATERAL (
    SELECT cv.status FROM public.cell_validation cv
    WHERE cv.pattern_id = c.pattern_id AND cv.timeframe = c.timeframe
      AND cv.asset_type = c.asset_type AND cv.direction = c.dir
      AND cv.entry_mode = p_entry_mode AND cv.test_end <= CURRENT_DATE
    ORDER BY cv.test_end DESC, cv.validated_at DESC LIMIT 1
  ) v ON true
  ORDER BY c.total DESC
  LIMIT p_limit;
$function$;

GRANT EXECUTE ON FUNCTION public.get_pattern_outcome_cells(text,text,integer,integer,text,text)
  TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.get_pattern_edge(text,text,text,text,date,uuid,numeric,numeric,text);

CREATE FUNCTION public.get_pattern_edge(
  p_pattern_id text, p_timeframe text, p_asset_type text, p_direction text,
  p_since date DEFAULT '2024-01-01'::date,
  p_broker_profile_id uuid DEFAULT NULL,
  p_spread_override numeric DEFAULT NULL,
  p_commission_override numeric DEFAULT NULL,
  p_geometry_source text DEFAULT 'pivot',
  p_entry_mode text DEFAULT 'next_open')
RETURNS TABLE(total_trades bigint, win_rate_pct numeric, expectancy_r numeric, est_cost_r numeric,
  expectancy_r_net numeric, avg_rr numeric, avg_bars numeric, edge_points numeric,
  baseline_win_rate_pct numeric, is_validated boolean, validation_status text, qualifies boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH norm AS (
    SELECT CASE lower(p_direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish'
             ELSE lower(p_direction) END AS dir
  ),
  rows AS (
    SELECT CASE WHEN p_entry_mode = 'close' THEN h.outcome ELSE h.outcome_exec END AS outcome,
           h.risk_reward_ratio,
           CASE WHEN p_entry_mode = 'close' THEN h.bars_to_outcome ELSE h.bars_to_outcome_exec END AS bars_to_outcome,
           public.get_detection_cost_r(
             CASE WHEN p_entry_mode = 'close' THEN h.entry_price
                  ELSE COALESCE(h.execution_entry_price, h.entry_price) END,
             h.stop_loss_price, h.symbol, h.asset_type, p_broker_profile_id,
             p_spread_override, p_commission_override) AS cost_r
    FROM public.historical_pattern_occurrences h, norm n
    WHERE h.detected_at >= p_since
      AND h.pattern_id = p_pattern_id
      AND h.timeframe  = p_timeframe
      AND h.asset_type = p_asset_type
      AND (p_geometry_source IS NULL OR h.geometry_source = p_geometry_source)
      AND CASE lower(h.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish'
            ELSE lower(h.direction) END = n.dir
      AND (CASE WHEN p_entry_mode = 'close' THEN h.outcome ELSE h.outcome_exec END) IN ('hit_tp','hit_sl')
      AND (CASE WHEN p_entry_mode = 'close' THEN h.bars_to_outcome ELSE h.bars_to_outcome_exec END) IS NOT NULL
  ),
  grouped AS (
    SELECT COUNT(*) AS total,
      COUNT(*) FILTER (WHERE outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE outcome = 'hit_sl') AS losses,
      AVG(risk_reward_ratio) FILTER (WHERE risk_reward_ratio IS NOT NULL) AS avg_rr_val,
      AVG(bars_to_outcome) AS avg_bars_val,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY cost_r)::numeric AS median_cost
    FROM rows
  ),
  calc AS (
    SELECT g.total, g.avg_rr_val, g.avg_bars_val,
      CASE WHEN g.total > 0 THEN g.wins::numeric / g.total ELSE 0 END AS wr_frac,
      CASE WHEN g.total > 0
        THEN ROUND((g.wins::numeric / g.total) * COALESCE(g.avg_rr_val, 0) - (g.losses::numeric / g.total), 3)
        ELSE 0 END AS gross,
      ROUND(COALESCE(g.median_cost, public.get_est_cost_r(p_asset_type, p_timeframe)), 4) AS cost,
      CASE WHEN COALESCE(g.avg_rr_val, 0) > 0 THEN 1.0 / (1.0 + g.avg_rr_val) ELSE NULL END AS baseline
    FROM grouped g
  ),
  val AS (
    SELECT cv.status FROM public.cell_validation cv, norm n
    WHERE cv.pattern_id = p_pattern_id AND cv.timeframe = p_timeframe
      AND cv.asset_type = p_asset_type AND cv.direction = n.dir
      AND cv.entry_mode = p_entry_mode AND cv.test_end <= CURRENT_DATE
    ORDER BY cv.test_end DESC, cv.validated_at DESC LIMIT 1
  ),
  susp AS (
    SELECT cs.status FROM public.cell_status cs, norm n
    WHERE cs.pattern_id = p_pattern_id AND cs.timeframe = p_timeframe
      AND cs.asset_type = p_asset_type AND cs.direction = n.dir
  )
  SELECT
    c.total AS total_trades,
    ROUND(c.wr_frac * 100, 1) AS win_rate_pct,
    c.gross AS expectancy_r,
    c.cost AS est_cost_r,
    ROUND(c.gross - c.cost, 3) AS expectancy_r_net,
    ROUND(COALESCE(c.avg_rr_val, 0)::numeric, 2) AS avg_rr,
    ROUND(COALESCE(c.avg_bars_val, 0)::numeric, 1) AS avg_bars,
    ROUND(((c.wr_frac - c.baseline) * 100)::numeric, 2) AS edge_points,
    ROUND((c.baseline * 100)::numeric, 1) AS baseline_win_rate_pct,
    COALESCE((SELECT status FROM val) = 'validated', false) AS is_validated,
    COALESCE((SELECT status FROM val), 'unvalidated') AS validation_status,
    (
      c.total >= 100
      AND c.baseline IS NOT NULL AND c.wr_frac > c.baseline
      AND (c.gross - c.cost) > 0
      AND COALESCE((SELECT status FROM susp), 'active') <> 'suspended'
      AND COALESCE((SELECT status FROM val) = 'validated', false)
    ) AS qualifies
  FROM calc c;
$function$;

GRANT EXECUTE ON FUNCTION public.get_pattern_edge(text,text,text,text,date,uuid,numeric,numeric,text,text)
  TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.run_cell_validation(integer,date,integer,text);

CREATE FUNCTION public.run_cell_validation(
  p_cut_months integer DEFAULT 12,
  p_window_start date DEFAULT '2024-01-01'::date,
  p_min_n integer DEFAULT 100,
  p_geometry_source text DEFAULT NULL,
  p_entry_mode text DEFAULT 'next_open')
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
             ((CASE WHEN p_entry_mode = 'close' THEN h.outcome ELSE h.outcome_exec END) = 'hit_tp') AS win,
             h.risk_reward_ratio AS rr
      FROM public.historical_pattern_occurrences h
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

      SELECT coalesce(bool_or(cv.status = 'validated'), false) INTO v_was_validated
      FROM public.cell_validation cv
      WHERE cv.pattern_id = r.pattern_id AND cv.timeframe = r.timeframe
        AND cv.asset_type = r.asset_type AND cv.direction = r.dir
        AND cv.entry_mode = p_entry_mode;

      INSERT INTO public.cell_validation (
        pattern_id, timeframe, asset_type, direction, entry_mode,
        train_start, train_end, test_start, test_end,
        n_train, n_test, edge_points_train, edge_points_test,
        persisted, status, candidate_registered_at, validated_at)
      VALUES (
        r.pattern_id, r.timeframe, r.asset_type, r.dir, p_entry_mode,
        p_window_start, v_cut - 1, v_cut, v_end,
        r.n_train, r.n_test, round(ep_train, 3), round(ep_test, 3),
        v_persisted, v_status,
        coalesce((SELECT min(prev.candidate_registered_at) FROM public.cell_validation prev
          WHERE prev.pattern_id = r.pattern_id AND prev.timeframe = r.timeframe
            AND prev.asset_type = r.asset_type AND prev.direction = r.dir
            AND prev.entry_mode = p_entry_mode), now()),
        now())
      ON CONFLICT (pattern_id, timeframe, asset_type, direction, entry_mode, test_start, test_end)
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

      -- Decay suspension is driven by the realistic entry mode only. Suspending
      -- on the close-entry cohort would act on a benchmark nobody can trade.
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

  cells_scored := v_scored; validated := v_val; failed := v_fail;
  insufficient := v_ins; decayed := v_decay;
  RETURN NEXT;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.run_cell_validation(integer,date,integer,text,text) TO service_role;
