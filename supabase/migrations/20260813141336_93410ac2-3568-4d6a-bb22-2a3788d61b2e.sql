-- 1) Outcome cells gain a geometry source filter
CREATE OR REPLACE FUNCTION public.get_pattern_outcome_cells(
  p_asset_type text DEFAULT NULL,
  p_timeframe text DEFAULT NULL,
  p_min_trades integer DEFAULT 30,
  p_limit integer DEFAULT 200,
  p_geometry_source text DEFAULT NULL
)
RETURNS TABLE(pattern_id text, pattern_name text, timeframe text, asset_type text, direction text,
              total_trades bigint, win_rate_pct numeric, expectancy_r numeric, avg_rr numeric, avg_bars numeric)
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
  )
  SELECT
    g.pattern_id, g.pattern_name, g.timeframe, g.asset_type, g.direction,
    g.total AS total_trades,
    ROUND((g.wins::numeric / g.total) * 100, 1) AS win_rate_pct,
    ROUND((g.wins::numeric / g.total) * COALESCE(g.avg_rr_val, 0) - (g.losses::numeric / g.total), 3) AS expectancy_r,
    ROUND(COALESCE(g.avg_rr_val, 0)::numeric, 2) AS avg_rr,
    ROUND(g.avg_bars_val::numeric, 1) AS avg_bars
  FROM grouped g
  -- Deliberately no expectancy filter. That omission is the entire point.
  ORDER BY g.total DESC
  LIMIT p_limit;
$function$;

-- 2) Retire the legacy 5-arg overload (ambiguous once defaults overlap)
DROP FUNCTION IF EXISTS public.get_pattern_edge(text, text, text, text, date);

CREATE OR REPLACE FUNCTION public.get_pattern_edge(
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
RETURNS TABLE(total_trades bigint, win_rate_pct numeric, expectancy_r numeric, est_cost_r numeric,
              expectancy_r_net numeric, avg_rr numeric, avg_bars numeric, qualifies boolean)
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
      CASE WHEN g.total > 0 THEN ROUND((g.wins::numeric / g.total) * 100, 1) ELSE 0 END AS wr,
      CASE WHEN g.total > 0
        THEN ROUND((g.wins::numeric / g.total) * COALESCE(g.avg_rr_val, 0) - (g.losses::numeric / g.total), 3)
        ELSE 0 END AS gross,
      ROUND(COALESCE(g.median_cost, public.get_est_cost_r(p_asset_type, p_timeframe)), 4) AS cost
    FROM grouped g
  )
  SELECT
    c.total AS total_trades,
    c.wr AS win_rate_pct,
    c.gross AS expectancy_r,
    c.cost AS est_cost_r,
    ROUND(c.gross - c.cost, 3) AS expectancy_r_net,
    ROUND(COALESCE(c.avg_rr_val, 0)::numeric, 2) AS avg_rr,
    ROUND(COALESCE(c.avg_bars_val, 0)::numeric, 1) AS avg_bars,
    (c.total >= 100 AND (c.gross - c.cost) > 0) AS qualifies
  FROM calc c;
$function$;

-- 3) Live detections view: edge stats from the pivot cohort only
DROP VIEW IF EXISTS public.v_live_detections_with_edge;
CREATE VIEW public.v_live_detections_with_edge AS
WITH cells AS (
  SELECT DISTINCT d_1.pattern_id, d_1.timeframe, d_1.asset_type,
    CASE lower(d_1.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d_1.direction) END AS dir
  FROM live_pattern_detections d_1
  WHERE d_1.status = 'active'
), grouped AS (
  SELECT c.pattern_id, c.timeframe, c.asset_type, c.dir,
    count(h.id) AS total,
    count(h.id) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
    count(h.id) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
    avg(h.risk_reward_ratio) FILTER (WHERE h.risk_reward_ratio IS NOT NULL) AS avg_rr_val,
    avg(h.bars_to_outcome) AS avg_bars_val
  FROM cells c
  LEFT JOIN historical_pattern_occurrences h
    ON h.pattern_id = c.pattern_id AND h.timeframe = c.timeframe AND h.asset_type = c.asset_type
   AND CASE lower(h.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END = c.dir
   AND h.outcome = ANY (ARRAY['hit_tp','hit_sl'])
   AND h.bars_to_outcome IS NOT NULL
   AND h.detected_at >= '2024-01-01'::date
   AND h.geometry_source = 'pivot'
  GROUP BY c.pattern_id, c.timeframe, c.asset_type, c.dir
), edge AS (
  SELECT g.pattern_id, g.timeframe, g.asset_type, g.dir,
    g.total AS total_trades,
    CASE WHEN g.total > 0 THEN round(g.wins::numeric / g.total::numeric * 100::numeric, 1) ELSE 0 END AS win_rate_pct,
    CASE WHEN g.total > 0 THEN round(g.wins::numeric / g.total::numeric * COALESCE(g.avg_rr_val, 0) - g.losses::numeric / g.total::numeric, 3) ELSE 0 END AS expectancy_r,
    round(COALESCE(g.avg_rr_val, 0), 2) AS avg_rr,
    round(COALESCE(g.avg_bars_val, 0), 1) AS avg_bars
  FROM grouped g
)
SELECT d.id, d.instrument, d.pattern_id, d.pattern_name, d.timeframe, d.asset_type, d.direction, d.status,
  d.entry_price, d.stop_loss_price, d.take_profit_price, d.risk_reward_ratio, d.current_price,
  d.quality_score, d.exchange, d.first_detected_at, d.last_confirmed_at,
  d.geometry_source,
  'pivot'::text AS edge_geometry_source,
  e.total_trades, e.win_rate_pct, e.expectancy_r,
  COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid), get_est_cost_r(d.asset_type, d.timeframe)) AS est_cost_r,
  round(e.expectancy_r - COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid), get_est_cost_r(d.asset_type, d.timeframe)), 3) AS expectancy_r_net,
  e.avg_rr, e.avg_bars,
  COALESCE(cs.status, 'active') AS cell_status,
  cs.suspended_reason,
  COALESCE(e.total_trades >= 100 AND (e.expectancy_r - COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid), get_est_cost_r(d.asset_type, d.timeframe))) > 0, false)
    AND COALESCE(cs.status, 'active') <> 'suspended' AS qualifies
FROM live_pattern_detections d
LEFT JOIN edge e ON e.pattern_id = d.pattern_id AND e.timeframe = d.timeframe AND e.asset_type = d.asset_type
  AND e.dir = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
LEFT JOIN cell_status cs ON cs.pattern_id = d.pattern_id AND cs.timeframe = d.timeframe AND cs.asset_type = d.asset_type
  AND cs.direction = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
WHERE d.status = 'active';

GRANT SELECT ON public.v_live_detections_with_edge TO anon, authenticated, service_role;

-- 4) Health check registration
INSERT INTO public.data_health_checks (check_name, category, severity, description, is_enabled)
VALUES ('geometry_source_distribution', 'consistency', 'warning',
        'Warns when more than 50% of a pattern''s resolved occurrences use the generic ATR fallback instead of pattern-derived pivot geometry.', true)
ON CONFLICT (check_name) DO UPDATE SET severity = EXCLUDED.severity, is_enabled = true;