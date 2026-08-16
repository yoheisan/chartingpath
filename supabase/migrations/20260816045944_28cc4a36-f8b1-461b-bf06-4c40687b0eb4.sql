ALTER TABLE public.master_plans
  ADD COLUMN IF NOT EXISTS validated_only boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_instruments integer;

-- One active plan per user. Interleaved plans make the forward record unattributable.
CREATE OR REPLACE FUNCTION public.enforce_single_active_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.master_plans
       SET is_active = false, updated_at = now()
     WHERE user_id = NEW.user_id
       AND id <> NEW.id
       AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_active_plan ON public.master_plans;
CREATE TRIGGER trg_single_active_plan
AFTER INSERT OR UPDATE OF is_active ON public.master_plans
FOR EACH ROW WHEN (NEW.is_active) EXECUTE FUNCTION public.enforce_single_active_plan();

-- The validated edge pool: one row per pattern x timeframe x asset class x direction
-- that passed out-of-sample validation, with its measured metrics.
CREATE OR REPLACE FUNCTION public.get_validated_edge_pool(
  p_since date DEFAULT '2024-01-01'::date
)
RETURNS TABLE(
  pattern_id text, pattern_name text, timeframe text, asset_type text, direction text,
  total_trades bigint, win_rate_pct numeric, avg_rr numeric,
  expectancy_r numeric, est_cost_r numeric, expectancy_r_net numeric,
  edge_points numeric, baseline_win_rate_pct numeric,
  edge_points_train numeric, edge_points_test numeric,
  n_train integer, n_test integer, validated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH grouped AS (
    SELECT h.pattern_id, min(h.pattern_name) AS pattern_name, h.timeframe, h.asset_type,
           CASE lower(h.direction) WHEN 'long' THEN 'bullish'
                WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END AS dir,
           count(*) AS total,
           count(*) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
           count(*) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
           avg(h.risk_reward_ratio) FILTER (WHERE h.risk_reward_ratio IS NOT NULL) AS rr
    FROM public.historical_pattern_occurrences h
    WHERE h.outcome IN ('hit_tp','hit_sl')
      AND h.bars_to_outcome IS NOT NULL
      AND h.detected_at >= p_since
    GROUP BY h.pattern_id, h.timeframe, h.asset_type,
             CASE lower(h.direction) WHEN 'long' THEN 'bullish'
                  WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END
  ),
  calc AS (
    SELECT g.*, g.wins::numeric / g.total AS wr,
           CASE WHEN coalesce(g.rr,0) > 0 THEN 1.0/(1.0 + g.rr) END AS baseline
    FROM grouped g
  )
  SELECT c.pattern_id, c.pattern_name, c.timeframe, c.asset_type, c.dir AS direction,
         c.total AS total_trades,
         round(c.wr * 100, 1) AS win_rate_pct,
         round(coalesce(c.rr,0)::numeric, 2) AS avg_rr,
         round(c.wr * coalesce(c.rr,0) - (c.losses::numeric / c.total), 3) AS expectancy_r,
         round(coalesce(public.get_est_cost_r(c.asset_type, c.timeframe), 0)::numeric, 3) AS est_cost_r,
         round(c.wr * coalesce(c.rr,0) - (c.losses::numeric / c.total)
               - coalesce(public.get_est_cost_r(c.asset_type, c.timeframe), 0), 3) AS expectancy_r_net,
         round(((c.wr - c.baseline) * 100)::numeric, 2) AS edge_points,
         round((c.baseline * 100)::numeric, 1) AS baseline_win_rate_pct,
         v.edge_points_train, v.edge_points_test, v.n_train, v.n_test, v.validated_at
  FROM calc c
  JOIN public.v_cell_validation_latest v
    ON v.pattern_id = c.pattern_id AND v.timeframe = c.timeframe
   AND v.asset_type = c.asset_type AND v.direction = c.dir
  WHERE v.status = 'validated'
  ORDER BY round(((c.wr - c.baseline) * 100)::numeric, 2) DESC NULLS LAST;
$$;

-- Instruments the validated pool applies to, ranked by measured edge then sample size.
CREATE OR REPLACE FUNCTION public.get_validated_pool_instruments(
  p_asset_types text[] DEFAULT NULL,
  p_timeframes  text[] DEFAULT NULL,
  p_direction   text    DEFAULT NULL,   -- 'bullish' | 'bearish' | NULL for both
  p_max         integer DEFAULT NULL,
  p_since       date    DEFAULT '2024-01-01'::date
)
RETURNS TABLE(
  symbol text, asset_type text, cells integer,
  best_edge_points numeric, occurrences bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH pool AS (
    SELECT v.pattern_id, v.timeframe, v.asset_type, v.direction, v.edge_points_test
    FROM public.v_cell_validation_latest v
    WHERE v.status = 'validated'
      AND (p_asset_types IS NULL OR v.asset_type = ANY(p_asset_types))
      AND (p_timeframes  IS NULL OR v.timeframe  = ANY(p_timeframes))
      AND (p_direction   IS NULL OR v.direction  = p_direction)
  ),
  hits AS (
    SELECT h.symbol, h.asset_type, p.pattern_id, p.timeframe, p.edge_points_test
    FROM public.historical_pattern_occurrences h
    JOIN pool p
      ON p.pattern_id = h.pattern_id
     AND p.timeframe = h.timeframe
     AND p.asset_type = h.asset_type
     AND p.direction = CASE lower(h.direction) WHEN 'long' THEN 'bullish'
                            WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END
    WHERE h.detected_at >= p_since
  )
  SELECT hits.symbol,
         min(hits.asset_type) AS asset_type,
         count(DISTINCT (hits.pattern_id || '|' || hits.timeframe))::int AS cells,
         round(max(hits.edge_points_test), 2) AS best_edge_points,
         count(*) AS occurrences
  FROM hits
  GROUP BY hits.symbol
  ORDER BY round(max(hits.edge_points_test), 2) DESC, count(*) DESC, hits.symbol
  LIMIT p_max;
$$;

-- Live counts as the user narrows the pool.
CREATE OR REPLACE FUNCTION public.get_validated_pool_summary(
  p_asset_types text[] DEFAULT NULL,
  p_timeframes  text[] DEFAULT NULL,
  p_direction   text    DEFAULT NULL,
  p_since       date    DEFAULT '2024-01-01'::date
)
RETURNS TABLE(cell_count integer, instrument_count integer, avg_edge_points numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH pool AS (
    SELECT v.pattern_id, v.timeframe, v.asset_type, v.direction, v.edge_points_test
    FROM public.v_cell_validation_latest v
    WHERE v.status = 'validated'
      AND (p_asset_types IS NULL OR v.asset_type = ANY(p_asset_types))
      AND (p_timeframes  IS NULL OR v.timeframe  = ANY(p_timeframes))
      AND (p_direction   IS NULL OR v.direction  = p_direction)
  ),
  instr AS (
    SELECT DISTINCT h.symbol
    FROM public.historical_pattern_occurrences h
    JOIN pool p
      ON p.pattern_id = h.pattern_id AND p.timeframe = h.timeframe
     AND p.asset_type = h.asset_type
     AND p.direction = CASE lower(h.direction) WHEN 'long' THEN 'bullish'
                            WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END
    WHERE h.detected_at >= p_since
  )
  SELECT (SELECT count(*) FROM pool)::int,
         (SELECT count(*) FROM instr)::int,
         (SELECT round(avg(edge_points_test), 2) FROM pool);
$$;

GRANT EXECUTE ON FUNCTION public.get_validated_edge_pool(date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_validated_pool_instruments(text[], text[], text, integer, date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_validated_pool_summary(text[], text[], text, date) TO anon, authenticated, service_role;