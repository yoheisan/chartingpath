CREATE OR REPLACE VIEW public.v_live_detections_with_edge
WITH (security_invoker = true) AS
WITH cells AS (
  SELECT DISTINCT
    d.pattern_id,
    d.timeframe,
    d.asset_type,
    CASE lower(d.direction)
      WHEN 'long' THEN 'bullish'
      WHEN 'short' THEN 'bearish'
      ELSE lower(d.direction)
    END AS dir
  FROM public.live_pattern_detections d
  WHERE d.status = 'active'
),
grouped AS (
  -- Single grouped pass over history. The previous definition called
  -- get_pattern_edge() via LATERAL once per detection (333 calls), which blew
  -- past the 8s statement timeout for anon and made the view return an error
  -- to the browser while looking fine to the service role.
  SELECT
    c.pattern_id, c.timeframe, c.asset_type, c.dir,
    COUNT(h.id) AS total,
    COUNT(h.id) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
    COUNT(h.id) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
    AVG(COALESCE(h.risk_reward_ratio, 2)) AS avg_rr_val,
    AVG(h.bars_to_outcome) AS avg_bars_val
  FROM cells c
  LEFT JOIN public.historical_pattern_occurrences h
    ON h.pattern_id = c.pattern_id
   AND h.timeframe  = c.timeframe
   AND h.asset_type = c.asset_type
   AND CASE lower(h.direction)
         WHEN 'long' THEN 'bullish'
         WHEN 'short' THEN 'bearish'
         ELSE lower(h.direction)
       END = c.dir
   AND h.outcome IN ('hit_tp', 'hit_sl')
   AND h.bars_to_outcome IS NOT NULL
   AND h.detected_at >= DATE '2024-01-01'
  GROUP BY c.pattern_id, c.timeframe, c.asset_type, c.dir
),
edge AS (
  SELECT
    g.pattern_id, g.timeframe, g.asset_type, g.dir,
    g.total AS total_trades,
    CASE WHEN g.total > 0 THEN ROUND((g.wins::numeric / g.total) * 100, 1) ELSE 0 END AS win_rate_pct,
    CASE WHEN g.total > 0
      THEN ROUND((g.wins::numeric / g.total) * g.avg_rr_val - (g.losses::numeric / g.total), 3)
      ELSE 0 END AS expectancy_r,
    public.get_est_cost_r(g.asset_type, g.timeframe) AS est_cost_r,
    ROUND(COALESCE(g.avg_rr_val, 0)::numeric, 2) AS avg_rr,
    ROUND(COALESCE(g.avg_bars_val, 0)::numeric, 1) AS avg_bars
  FROM grouped g
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
  e.total_trades,
  e.win_rate_pct,
  e.expectancy_r,
  e.est_cost_r,
  ROUND(e.expectancy_r - e.est_cost_r, 3) AS expectancy_r_net,
  e.avg_rr,
  e.avg_bars,
  COALESCE(cs.status, 'active') AS cell_status,
  cs.suspended_reason,
  COALESCE(e.total_trades >= 100 AND (e.expectancy_r - e.est_cost_r) > 0, false)
    AND COALESCE(cs.status, 'active') <> 'suspended' AS qualifies
FROM public.live_pattern_detections d
LEFT JOIN edge e
  ON e.pattern_id = d.pattern_id
 AND e.timeframe  = d.timeframe
 AND e.asset_type = d.asset_type
 AND e.dir = CASE lower(d.direction)
       WHEN 'long' THEN 'bullish'
       WHEN 'short' THEN 'bearish'
       ELSE lower(d.direction)
     END
LEFT JOIN public.cell_status cs
  ON cs.pattern_id = d.pattern_id
 AND cs.timeframe = d.timeframe
 AND cs.asset_type = d.asset_type
 AND cs.direction = CASE lower(d.direction)
       WHEN 'long' THEN 'bullish'
       WHEN 'short' THEN 'bearish'
       ELSE lower(d.direction)
     END
WHERE d.status = 'active';

GRANT SELECT ON public.v_live_detections_with_edge TO anon, authenticated;
GRANT ALL ON public.v_live_detections_with_edge TO service_role;