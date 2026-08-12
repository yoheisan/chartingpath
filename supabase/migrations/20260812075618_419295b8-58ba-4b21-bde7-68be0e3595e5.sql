
DROP VIEW IF EXISTS public.v_live_detections_with_edge;
DROP FUNCTION IF EXISTS public.get_pattern_edge(text, text, text, text, date);

CREATE FUNCTION public.get_pattern_edge(
  p_pattern_id text,
  p_timeframe text,
  p_asset_type text,
  p_direction text,
  p_since date DEFAULT '2024-01-01'::date
)
RETURNS TABLE(
  total_trades bigint,
  win_rate_pct numeric,
  expectancy_r numeric,
  est_cost_r numeric,
  expectancy_r_net numeric,
  avg_rr numeric,
  avg_bars numeric,
  qualifies boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH norm AS (
    SELECT CASE lower(p_direction)
             WHEN 'long'  THEN 'bullish'
             WHEN 'short' THEN 'bearish'
             ELSE lower(p_direction)
           END AS dir
  ),
  grouped AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
      AVG(COALESCE(h.risk_reward_ratio, 2)) AS avg_rr_val,
      AVG(h.bars_to_outcome) AS avg_bars_val
    FROM public.historical_pattern_occurrences h, norm n
    WHERE h.outcome IN ('hit_tp', 'hit_sl')
      AND h.bars_to_outcome IS NOT NULL
      AND h.detected_at >= p_since
      AND h.pattern_id = p_pattern_id
      AND h.timeframe  = p_timeframe
      AND h.asset_type = p_asset_type
      AND CASE lower(h.direction)
            WHEN 'long'  THEN 'bullish'
            WHEN 'short' THEN 'bearish'
            ELSE lower(h.direction)
          END = n.dir
  ),
  calc AS (
    SELECT
      g.total,
      g.avg_rr_val,
      g.avg_bars_val,
      CASE WHEN g.total > 0 THEN ROUND((g.wins::numeric / g.total) * 100, 1) ELSE 0 END AS wr,
      CASE WHEN g.total > 0
        THEN ROUND((g.wins::numeric / g.total) * g.avg_rr_val - (g.losses::numeric / g.total), 3)
        ELSE 0 END AS gross,
      public.get_est_cost_r(p_asset_type, p_timeframe) AS cost
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

COMMENT ON FUNCTION public.get_pattern_edge(text, text, text, text, date) IS
$c$Measured edge for one pattern/timeframe/asset/direction cell, used to decide whether
an alert may be sent.

WINDOW: defaults to detected_at >= 2024-01-01. The dataset is not homogeneous over
time; 2024 onward is the clean, comparable window. Widening the window backwards makes
the filter LESS reliable, not more.

FLOORS: total_trades >= 100 (stricter than the n>=30 display floor used by
get_pattern_outcome_cells and /outcomes — showing data is low-stakes, telling someone
to risk money is not) AND expectancy_r_net > 0.

NET vs GROSS: expectancy_r is gross of costs. expectancy_r_net subtracts
get_est_cost_r(asset_type, timeframe), a PROVISIONAL round-trip cost estimate in R.
Qualification is on NET, because costs are roughly fixed per trade while the edge
scales with move size: a 15m cell at +0.13R gross can be net-negative while a 1d cell
with the same gross figure has ample room. See pattern_cost_assumptions — those seeds
are placeholders and must be replaced with broker-specific figures.

Seasonality was tested and rejected as an explanation for the regime break; see
docs/SEASONALITY-FINDING.md. Do not re-litigate it.$c$;

CREATE VIEW public.v_live_detections_with_edge AS
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
  e.expectancy_r_net,
  e.avg_rr,
  e.avg_bars,
  COALESCE(cs.status, 'active') AS cell_status,
  cs.suspended_reason,
  -- Qualification = measured net edge AND the cell is not suspended by the kill switch.
  (COALESCE(e.qualifies, false) AND COALESCE(cs.status, 'active') <> 'suspended') AS qualifies
FROM public.live_pattern_detections d
LEFT JOIN LATERAL public.get_pattern_edge(d.pattern_id, d.timeframe, d.asset_type, d.direction) e ON true
LEFT JOIN public.cell_status cs
  ON cs.pattern_id = d.pattern_id
 AND cs.timeframe  = d.timeframe
 AND cs.asset_type = d.asset_type
 AND cs.direction  = CASE lower(d.direction)
                       WHEN 'long'  THEN 'bullish'
                       WHEN 'short' THEN 'bearish'
                       ELSE lower(d.direction)
                     END
WHERE d.status = 'active';

COMMENT ON VIEW public.v_live_detections_with_edge IS
$c$Live detections joined to their measured edge and kill-switch state.

VOCABULARY WARNING: live_pattern_detections.direction stores long/short while
historical_pattern_occurrences.direction and cell_status.direction store
bullish/bearish. Every join across those tables MUST normalise explicitly, as the
LEFT JOIN above does. A missing normalisation fails silently with zero rows, not with
an error. See src/config/vocabularies.ts and docs/VOCABULARY-CONTRACT.md.$c$;

GRANT SELECT ON public.v_live_detections_with_edge TO authenticated;
GRANT SELECT ON public.v_live_detections_with_edge TO service_role;

SELECT cron.schedule(
  'evaluate-cell-suspensions-daily',
  '20 3 * * *',
  $$SELECT public.evaluate_cell_suspensions();$$
);
