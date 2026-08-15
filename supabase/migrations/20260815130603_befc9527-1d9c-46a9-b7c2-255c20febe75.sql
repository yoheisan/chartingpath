DROP VIEW IF EXISTS public.v_live_detections_with_edge;
CREATE VIEW public.v_live_detections_with_edge AS
WITH cells AS (
  SELECT DISTINCT d.pattern_id, d.timeframe, d.asset_type,
    CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish'
         ELSE lower(d.direction) END AS dir
  FROM live_pattern_detections d WHERE d.status = 'active'
), grouped AS (
  SELECT c.pattern_id, c.timeframe, c.asset_type, c.dir,
    count(h.id) AS total,
    count(h.id) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
    count(h.id) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
    avg(h.risk_reward_ratio) FILTER (WHERE h.risk_reward_ratio IS NOT NULL) AS avg_rr_val,
    avg(h.bars_to_outcome) AS avg_bars_val
  FROM cells c
  LEFT JOIN historical_pattern_occurrences h
    ON h.pattern_id = c.pattern_id AND h.timeframe = c.timeframe
   AND h.asset_type = c.asset_type
   AND CASE lower(h.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish'
            ELSE lower(h.direction) END = c.dir
   AND h.outcome = ANY (ARRAY['hit_tp','hit_sl'])
   AND h.bars_to_outcome IS NOT NULL
   AND h.detected_at >= '2024-01-01'::date
   AND h.geometry_source = 'pivot'
  GROUP BY c.pattern_id, c.timeframe, c.asset_type, c.dir
), edge AS (
  SELECT g.pattern_id, g.timeframe, g.asset_type, g.dir,
    g.total AS total_trades,
    CASE WHEN g.total > 0 THEN g.wins::numeric / g.total ELSE 0 END AS wr_frac,
    CASE WHEN g.total > 0 THEN round(g.wins::numeric / g.total * 100, 1) ELSE 0 END AS win_rate_pct,
    CASE WHEN g.total > 0
      THEN round(g.wins::numeric / g.total * COALESCE(g.avg_rr_val, 0) - g.losses::numeric / g.total, 3)
      ELSE 0 END AS expectancy_r,
    -- Random-walk null: a coin flip hits the target before the stop with
    -- probability ~1/(1+RR). Beating that is edge; positive expectancy alone
    -- is just a close target.
    CASE WHEN COALESCE(g.avg_rr_val, 0) > 0 THEN 1.0 / (1.0 + g.avg_rr_val) END AS baseline,
    round(COALESCE(g.avg_rr_val, 0), 2) AS avg_rr,
    round(COALESCE(g.avg_bars_val, 0), 1) AS avg_bars
  FROM grouped g
)
SELECT d.id, d.instrument, d.pattern_id, d.pattern_name, d.timeframe, d.asset_type,
  d.direction, d.status, d.entry_price, d.stop_loss_price, d.take_profit_price,
  d.risk_reward_ratio, d.current_price, d.quality_score, d.exchange,
  d.first_detected_at, d.last_confirmed_at, d.geometry_source,
  'pivot'::text AS edge_geometry_source,
  e.total_trades, e.win_rate_pct, e.expectancy_r,
  COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid),
           get_est_cost_r(d.asset_type, d.timeframe)) AS est_cost_r,
  round(e.expectancy_r - COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid),
           get_est_cost_r(d.asset_type, d.timeframe)), 3) AS expectancy_r_net,
  e.avg_rr, e.avg_bars,
  round(((e.wr_frac - e.baseline) * 100)::numeric, 2) AS edge_points,
  round((e.baseline * 100)::numeric, 1) AS baseline_win_rate_pct,
  COALESCE(v.status = 'validated', false) AS is_validated,
  COALESCE(v.status, 'unvalidated') AS validation_status,
  COALESCE(cs.status, 'active') AS cell_status,
  cs.suspended_reason,
  (
    COALESCE(e.total_trades >= 100, false)
    AND e.baseline IS NOT NULL AND e.wr_frac > e.baseline
    AND COALESCE(e.expectancy_r - COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid),
        get_est_cost_r(d.asset_type, d.timeframe)) > 0, false)
    AND COALESCE(cs.status, 'active') <> 'suspended'
    AND COALESCE(v.status = 'validated', false)
  ) AS qualifies
FROM live_pattern_detections d
LEFT JOIN edge e ON e.pattern_id = d.pattern_id AND e.timeframe = d.timeframe
  AND e.asset_type = d.asset_type AND e.dir =
  CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
LEFT JOIN cell_status cs ON cs.pattern_id = d.pattern_id AND cs.timeframe = d.timeframe
  AND cs.asset_type = d.asset_type AND cs.direction =
  CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
LEFT JOIN v_cell_validation_latest v ON v.pattern_id = d.pattern_id AND v.timeframe = d.timeframe
  AND v.asset_type = d.asset_type AND v.direction =
  CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
WHERE d.status = 'active';