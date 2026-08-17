CREATE TABLE IF NOT EXISTS public.edge_cell_stats_cache (
  pattern_id text NOT NULL,
  timeframe text NOT NULL,
  asset_type text NOT NULL,
  dir text NOT NULL,
  total bigint NOT NULL DEFAULT 0,
  wins bigint NOT NULL DEFAULT 0,
  losses bigint NOT NULL DEFAULT 0,
  avg_rr_val numeric,
  avg_bars_val numeric,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pattern_id, timeframe, asset_type, dir)
);

GRANT SELECT ON public.edge_cell_stats_cache TO anon;
GRANT SELECT ON public.edge_cell_stats_cache TO authenticated;
GRANT ALL ON public.edge_cell_stats_cache TO service_role;

ALTER TABLE public.edge_cell_stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edge_cell_stats_cache public read" ON public.edge_cell_stats_cache;
CREATE POLICY "edge_cell_stats_cache public read"
  ON public.edge_cell_stats_cache FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.refresh_edge_cell_stats_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  CREATE TEMP TABLE _fresh ON COMMIT DROP AS
  SELECT
    h.pattern_id,
    h.timeframe,
    h.asset_type,
    CASE lower(h.direction)
      WHEN 'long' THEN 'bullish'
      WHEN 'short' THEN 'bearish'
      ELSE lower(h.direction)
    END AS dir,
    count(h.id) AS total,
    count(h.id) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
    count(h.id) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
    avg(h.risk_reward_ratio) FILTER (WHERE h.risk_reward_ratio IS NOT NULL) AS avg_rr_val,
    avg(h.bars_to_outcome) AS avg_bars_val
  FROM historical_pattern_occurrences h
  WHERE h.outcome IN ('hit_tp','hit_sl')
    AND h.bars_to_outcome IS NOT NULL
    AND h.detected_at >= DATE '2024-01-01'
    AND h.geometry_source = 'pivot'
    AND h.execution_status = 'valid'
  GROUP BY 1,2,3,4;

  DELETE FROM public.edge_cell_stats_cache c
  WHERE NOT EXISTS (
    SELECT 1 FROM _fresh f
    WHERE f.pattern_id = c.pattern_id AND f.timeframe = c.timeframe
      AND f.asset_type = c.asset_type AND f.dir = c.dir
  );

  INSERT INTO public.edge_cell_stats_cache AS c
    (pattern_id, timeframe, asset_type, dir, total, wins, losses, avg_rr_val, avg_bars_val, refreshed_at)
  SELECT f.pattern_id, f.timeframe, f.asset_type, f.dir, f.total, f.wins, f.losses,
         f.avg_rr_val, f.avg_bars_val, now()
  FROM _fresh f
  ON CONFLICT (pattern_id, timeframe, asset_type, dir) DO UPDATE
    SET total = EXCLUDED.total,
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        avg_rr_val = EXCLUDED.avg_rr_val,
        avg_bars_val = EXCLUDED.avg_bars_val,
        refreshed_at = now();

  SELECT count(*) INTO n FROM public.edge_cell_stats_cache;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_edge_cell_stats_cache() FROM public;
GRANT EXECUTE ON FUNCTION public.refresh_edge_cell_stats_cache() TO service_role;

SELECT public.refresh_edge_cell_stats_cache();

CREATE OR REPLACE VIEW public.v_live_detections_with_edge
WITH (security_invoker = true) AS
WITH edge AS (
  SELECT
    g.pattern_id,
    g.timeframe,
    g.asset_type,
    g.dir,
    g.total AS total_trades,
    CASE WHEN g.total > 0 THEN g.wins::numeric / g.total::numeric ELSE 0::numeric END AS wr_frac,
    CASE WHEN g.total > 0 THEN round(g.wins::numeric / g.total::numeric * 100, 1) ELSE 0::numeric END AS win_rate_pct,
    CASE WHEN g.total > 0
      THEN round(g.wins::numeric / g.total::numeric * COALESCE(g.avg_rr_val, 0) - g.losses::numeric / g.total::numeric, 3)
      ELSE 0::numeric END AS expectancy_r,
    CASE WHEN COALESCE(g.avg_rr_val, 0) > 0 THEN 1.0 / (1.0 + g.avg_rr_val) ELSE NULL::numeric END AS baseline,
    round(COALESCE(g.avg_rr_val, 0), 2) AS avg_rr,
    round(COALESCE(g.avg_bars_val, 0), 1) AS avg_bars
  FROM public.edge_cell_stats_cache g
)
SELECT
  d.id,
  d.instrument,
  d.pattern_id,
  d.pattern_name,
  d.timeframe,
  d.asset_type,
  d.direction,
  d.status,
  d.entry_price,
  d.stop_loss_price,
  d.take_profit_price,
  d.risk_reward_ratio,
  d.current_price,
  d.quality_score,
  d.exchange,
  d.first_detected_at,
  d.last_confirmed_at,
  d.geometry_source,
  'pivot'::text AS edge_geometry_source,
  e.total_trades,
  e.win_rate_pct,
  e.expectancy_r,
  COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid), get_est_cost_r(d.asset_type, d.timeframe)) AS est_cost_r,
  round(e.expectancy_r - COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid), get_est_cost_r(d.asset_type, d.timeframe)), 3) AS expectancy_r_net,
  e.avg_rr,
  e.avg_bars,
  round((e.wr_frac - e.baseline) * 100, 2) AS edge_points,
  round(e.baseline * 100, 1) AS baseline_win_rate_pct,
  COALESCE(v.status = 'validated', false) AS is_validated,
  COALESCE(v.status, 'unvalidated') AS validation_status,
  COALESCE(cs.status, 'active') AS cell_status,
  cs.suspended_reason,
  COALESCE(e.total_trades >= 100, false)
    AND e.baseline IS NOT NULL
    AND e.wr_frac > e.baseline
    AND COALESCE((e.expectancy_r - COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid), get_est_cost_r(d.asset_type, d.timeframe))) > 0, false)
    AND COALESCE(cs.status, 'active') <> 'suspended'
    AND COALESCE(v.status = 'validated', false) AS qualifies
FROM public.live_pattern_detections d
LEFT JOIN edge e
  ON e.pattern_id = d.pattern_id AND e.timeframe = d.timeframe AND e.asset_type = d.asset_type
 AND e.dir = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
LEFT JOIN public.cell_status cs
  ON cs.pattern_id = d.pattern_id AND cs.timeframe = d.timeframe AND cs.asset_type = d.asset_type
 AND cs.direction = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
LEFT JOIN public.v_cell_validation_latest v
  ON v.pattern_id = d.pattern_id AND v.timeframe = d.timeframe AND v.asset_type = d.asset_type
 AND v.direction = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
 AND v.entry_mode = 'next_open'
WHERE d.status = 'active';

GRANT SELECT ON public.v_live_detections_with_edge TO anon, authenticated, service_role;

SELECT cron.schedule(
  'refresh-edge-cell-stats-cache',
  '*/15 * * * *',
  $$SELECT public.refresh_edge_cell_stats_cache();$$
);