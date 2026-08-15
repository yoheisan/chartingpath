-- =====================================================================
-- EDGE VALIDATION
--
-- WHY: `expectancy_r > 0` is not a test for edge. With a close target a
-- coin flip wins often and shows positive expectancy: that is arithmetic,
-- not skill. The correct null for a random walk is that the target is hit
-- before the stop with probability ~ 1/(1+RR). Edge is therefore
--     edge_points = (win_rate - 1/(1+avg_rr)) * 100
-- and a cell only has edge when that is positive AND it survives
-- out-of-sample.
--
-- HONEST LIMITS: this would NOT have caught the ATR-fallback contamination
-- of two thirds of the dataset — that needed provenance labelling nobody
-- had thought to record. And it cannot catch a misspecified null: if the
-- baseline is wrong, bad cells pass confidently. It encodes one lesson
-- well; it does not make the system self-correcting.
-- =====================================================================

-- ── 1. cell_validation ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cell_validation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id text NOT NULL,
  timeframe text NOT NULL,
  asset_type text NOT NULL,
  direction text NOT NULL,
  train_start date NOT NULL,
  train_end date NOT NULL,
  test_start date NOT NULL,
  test_end date NOT NULL,
  n_train integer NOT NULL DEFAULT 0,
  n_test integer NOT NULL DEFAULT 0,
  edge_points_train numeric,
  edge_points_test numeric,
  persisted boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'insufficient_sample',
  -- PRE-REGISTRATION: a cell must be named a candidate BEFORE its test
  -- window closes. Picking winners after seeing the test data is exactly
  -- what makes a 306-cell leaderboard meaningless.
  candidate_registered_at timestamptz,
  validated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cell_validation_cell_window_uniq
  ON public.cell_validation (pattern_id, timeframe, asset_type, direction, test_start, test_end);
CREATE INDEX IF NOT EXISTS cell_validation_status_idx ON public.cell_validation (status);

GRANT SELECT ON public.cell_validation TO anon;
GRANT SELECT ON public.cell_validation TO authenticated;
GRANT ALL ON public.cell_validation TO service_role;

ALTER TABLE public.cell_validation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Validation results are public"
  ON public.cell_validation FOR SELECT USING (true);
CREATE POLICY "Only services write validation results"
  ON public.cell_validation FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER cell_validation_set_updated_at
  BEFORE UPDATE ON public.cell_validation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 2. helper: latest validation verdict per cell ─────────────────────
CREATE OR REPLACE VIEW public.v_cell_validation_latest AS
SELECT DISTINCT ON (pattern_id, timeframe, asset_type, direction)
  pattern_id, timeframe, asset_type, direction,
  status, persisted, n_train, n_test,
  edge_points_train, edge_points_test,
  train_start, train_end, test_start, test_end,
  candidate_registered_at, validated_at
FROM public.cell_validation
ORDER BY pattern_id, timeframe, asset_type, direction, test_end DESC, validated_at DESC;

GRANT SELECT ON public.v_cell_validation_latest TO anon, authenticated, service_role;

-- ── 3. get_pattern_edge: random-walk gate ─────────────────────────────
-- Drop the stale 8-arg overload: two candidates with the same call shape
-- make PostgREST fail with "function is not unique".
DROP FUNCTION IF EXISTS public.get_pattern_edge(text, text, text, text, date, uuid, numeric, numeric);
DROP FUNCTION IF EXISTS public.get_pattern_edge(text, text, text, text, date, uuid, numeric, numeric, text);

CREATE FUNCTION public.get_pattern_edge(
  p_pattern_id text,
  p_timeframe text,
  p_asset_type text,
  p_direction text,
  p_since date DEFAULT '2024-01-01'::date,
  p_broker_profile_id uuid DEFAULT NULL,
  p_spread_override numeric DEFAULT NULL,
  p_commission_override numeric DEFAULT NULL,
  p_geometry_source text DEFAULT 'pivot'
)
RETURNS TABLE(
  total_trades bigint, win_rate_pct numeric, expectancy_r numeric,
  est_cost_r numeric, expectancy_r_net numeric, avg_rr numeric,
  avg_bars numeric, edge_points numeric, baseline_win_rate_pct numeric,
  is_validated boolean, validation_status text, qualifies boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH norm AS (
    SELECT CASE lower(p_direction)
             WHEN 'long'  THEN 'bullish'
             WHEN 'short' THEN 'bearish'
             ELSE lower(p_direction)
           END AS dir
  ),
  rows AS (
    SELECT h.outcome, h.risk_reward_ratio, h.bars_to_outcome,
           public.get_detection_cost_r(h.entry_price, h.stop_loss_price, h.symbol,
                                       h.asset_type, p_broker_profile_id,
                                       p_spread_override, p_commission_override) AS cost_r
    FROM public.historical_pattern_occurrences h, norm n
    WHERE h.outcome IN ('hit_tp', 'hit_sl')
      AND h.bars_to_outcome IS NOT NULL
      AND h.detected_at >= p_since
      AND h.pattern_id = p_pattern_id
      AND h.timeframe  = p_timeframe
      AND h.asset_type = p_asset_type
      AND (p_geometry_source IS NULL OR h.geometry_source = p_geometry_source)
      AND CASE lower(h.direction)
            WHEN 'long'  THEN 'bullish'
            WHEN 'short' THEN 'bearish'
            ELSE lower(h.direction)
          END = n.dir
  ),
  grouped AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE outcome = 'hit_sl') AS losses,
      AVG(risk_reward_ratio) FILTER (WHERE risk_reward_ratio IS NOT NULL) AS avg_rr_val,
      AVG(bars_to_outcome) AS avg_bars_val,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY cost_r)::numeric AS median_cost
    FROM rows
  ),
  calc AS (
    SELECT
      g.total, g.avg_rr_val, g.avg_bars_val,
      CASE WHEN g.total > 0 THEN g.wins::numeric / g.total ELSE 0 END AS wr_frac,
      CASE WHEN g.total > 0
        THEN ROUND((g.wins::numeric / g.total) * COALESCE(g.avg_rr_val, 0) - (g.losses::numeric / g.total), 3)
        ELSE 0 END AS gross,
      ROUND(COALESCE(g.median_cost, public.get_est_cost_r(p_asset_type, p_timeframe)), 4) AS cost,
      -- Random-walk null: P(target before stop) ~ 1/(1+RR).
      CASE WHEN COALESCE(g.avg_rr_val, 0) > 0
        THEN 1.0 / (1.0 + g.avg_rr_val) ELSE NULL END AS baseline
    FROM grouped g
  ),
  val AS (
    SELECT v.status
    FROM public.v_cell_validation_latest v, norm n
    WHERE v.pattern_id = p_pattern_id AND v.timeframe = p_timeframe
      AND v.asset_type = p_asset_type AND v.direction = n.dir
  ),
  susp AS (
    SELECT cs.status
    FROM public.cell_status cs, norm n
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
    -- QUALIFICATION. All must hold. Expectancy alone must never again be
    -- the sole signal: a positive expectancy with a win rate at or below
    -- 1/(1+RR) is a coin flip with a close target, not an edge.
    (
      c.total >= 100                                                  -- a) sample floor
      AND c.baseline IS NOT NULL AND c.wr_frac > c.baseline           -- b) beats random walk
      AND (c.gross - c.cost) > 0                                      -- c) survives costs
      AND COALESCE((SELECT status FROM susp), 'active') <> 'suspended'-- d) not suspended
      AND COALESCE((SELECT status FROM val) = 'validated', false)     -- e) held out of sample
    ) AS qualifies
  FROM calc c;
$function$;

GRANT EXECUTE ON FUNCTION public.get_pattern_edge(text,text,text,text,date,uuid,numeric,numeric,text)
  TO anon, authenticated, service_role;

-- ── 4. get_pattern_outcome_cells: expose edge_points + validation ─────
DROP FUNCTION IF EXISTS public.get_pattern_outcome_cells(text, text, integer, integer, text);

CREATE FUNCTION public.get_pattern_outcome_cells(
  p_asset_type text DEFAULT NULL,
  p_timeframe text DEFAULT NULL,
  p_min_trades integer DEFAULT 30,
  p_limit integer DEFAULT 200,
  p_geometry_source text DEFAULT NULL
)
RETURNS TABLE(
  pattern_id text, pattern_name text, timeframe text, asset_type text,
  direction text, total_trades bigint, win_rate_pct numeric,
  expectancy_r numeric, avg_rr numeric, avg_bars numeric,
  edge_points numeric, baseline_win_rate_pct numeric,
  is_validated boolean, validation_status text, qualifies boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH grouped AS (
    SELECT
      h.pattern_id, h.pattern_name, h.timeframe, h.asset_type, h.direction,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
      AVG(h.risk_reward_ratio) FILTER (WHERE h.risk_reward_ratio IS NOT NULL) AS avg_rr_val,
      AVG(h.bars_to_outcome) AS avg_bars_val
    FROM public.historical_pattern_occurrences h
    WHERE h.outcome IN ('hit_tp', 'hit_sl')
      AND h.bars_to_outcome IS NOT NULL
      AND (p_asset_type IS NULL OR h.asset_type = p_asset_type)
      AND (p_timeframe  IS NULL OR h.timeframe  = p_timeframe)
      AND (p_geometry_source IS NULL OR h.geometry_source = p_geometry_source)
    GROUP BY h.pattern_id, h.pattern_name, h.timeframe, h.asset_type, h.direction
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
    -- A cell only counts as having edge when it beats the random-walk
    -- baseline AND held up out of sample. Raw expectancy is not enough.
    (c.total >= 100 AND c.baseline IS NOT NULL AND c.wr_frac > c.baseline
       AND COALESCE(v.status = 'validated', false)) AS qualifies
  FROM calc c
  LEFT JOIN public.v_cell_validation_latest v
    ON v.pattern_id = c.pattern_id AND v.timeframe = c.timeframe
   AND v.asset_type = c.asset_type AND v.direction = c.dir
  -- Deliberately no expectancy filter. That omission is the entire point.
  ORDER BY c.total DESC
  LIMIT p_limit;
$function$;

GRANT EXECUTE ON FUNCTION public.get_pattern_outcome_cells(text,text,integer,integer,text)
  TO anon, authenticated, service_role;

-- ── 5. monthly validation job ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.run_cell_validation(
  p_cut_months integer DEFAULT 12,
  p_window_start date DEFAULT '2024-01-01'::date,
  p_min_n integer DEFAULT 100,
  p_geometry_source text DEFAULT NULL
)
RETURNS TABLE(cells_scored integer, validated integer, failed integer, insufficient integer, decayed integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
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
        -- Pre-registration: the current row's candidacy was declared when
        -- the previous run registered the next period, if it existed.
        (SELECT prev.candidate_registered_at FROM public.cell_validation prev
          WHERE prev.pattern_id = r.pattern_id AND prev.timeframe = r.timeframe
            AND prev.asset_type = r.asset_type AND prev.direction = r.dir
            AND prev.test_start = v_cut AND prev.test_end > v_end
          LIMIT 1),
        now())
      ON CONFLICT (pattern_id, timeframe, asset_type, direction, test_start, test_end)
      DO UPDATE SET
        n_train = EXCLUDED.n_train, n_test = EXCLUDED.n_test,
        edge_points_train = EXCLUDED.edge_points_train,
        edge_points_test = EXCLUDED.edge_points_test,
        persisted = EXCLUDED.persisted, status = EXCLUDED.status,
        validated_at = now();

      -- CHANGE 4: register this cell as a candidate for NEXT period's test
      -- window, before that window has closed and before we can see it.
      INSERT INTO public.cell_validation (
        pattern_id, timeframe, asset_type, direction,
        train_start, train_end, test_start, test_end,
        n_train, n_test, persisted, status, candidate_registered_at)
      VALUES (
        r.pattern_id, r.timeframe, r.asset_type, r.dir,
        p_window_start, v_end, v_end + 1, (v_end + interval '12 months')::date,
        0, 0, false, 'insufficient_sample', now())
      ON CONFLICT (pattern_id, timeframe, asset_type, direction, test_start, test_end)
      DO NOTHING;

      v_scored := v_scored + 1;
      IF v_status = 'validated' THEN v_val := v_val + 1;
      ELSIF v_status = 'failed' THEN v_fail := v_fail + 1;
      ELSE v_ins := v_ins + 1; END IF;

      -- Decay: a cell that once validated and now fails is suspended
      -- automatically. Reinstatement stays manual, deliberately.
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

-- ── 6. population-level alarms ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.run_extra_health_check(p_name text)
RETURNS TABLE(passed boolean, observed_value text, detail jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_total int; v_above int; v_expected numeric; v_corr numeric; v_decay int;
BEGIN
  IF p_name = 'population_edge_vs_chance' THEN
    -- If every cell were noise, ~half would beat the baseline by luck.
    -- Observing no more than that means the leaderboard is indistinguishable
    -- from chance, however good individual rows look.
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
    WHERE n_train >= 100 AND n_test >= 100
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
  END IF;

  passed := false;
  observed_value := 'no implementation for check';
  detail := NULL;
  RETURN NEXT;
END;
$function$;

INSERT INTO public.data_health_checks (check_name, category, severity, description, expected_result, is_enabled)
VALUES
 ('population_edge_vs_chance', 'consistency', 'critical',
  'Counts cells (n>=100, 2024+) whose win rate beats the random-walk baseline 1/(1+RR), against the number chance alone predicts (~half). If observed <= expected the leaderboard is indistinguishable from noise.',
  'more cells above baseline than chance predicts', true),
 ('train_test_correlation', 'consistency', 'warning',
  'Correlation of edge_points between the train and test halves in cell_validation. Below 0.4 the rankings must stop being presented as rankings.',
  'correlation >= 0.4', true),
 ('cell_decay', 'consistency', 'warning',
  'Cells that previously validated and now fail. These are auto-suspended by the monthly validation job; reinstatement is manual.',
  'no decayed cells', true)
ON CONFLICT (check_name) DO UPDATE
  SET severity = EXCLUDED.severity, description = EXCLUDED.description,
      expected_result = EXCLUDED.expected_result, is_enabled = true;

-- Route unimplemented CASE names in run_data_health_checks to the new
-- dispatcher instead of rewriting that 350-line function wholesale.
DO $patch$
DECLARE d text; d2 text;
BEGIN
  d := pg_get_functiondef('public.run_data_health_checks(text)'::regprocedure);
  d2 := replace(d,
    E'      ELSE\n        v_passed := false;\n        v_obs := ''no implementation for check'';',
    E'      ELSE\n        SELECT x.passed, x.observed_value, x.detail\n          INTO v_passed, v_obs, v_detail\n          FROM public.run_extra_health_check(c.name) x;');
  IF d2 = d THEN
    RAISE EXCEPTION 'could not patch run_data_health_checks ELSE branch';
  END IF;
  EXECUTE d2;
END
$patch$;

-- ── 7. schedule the monthly job ───────────────────────────────────────
SELECT cron.unschedule('cell-validation-monthly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cell-validation-monthly');

SELECT cron.schedule('cell-validation-monthly', '30 4 1 * *',
  $cron$SELECT public.run_cell_validation();$cron$);
