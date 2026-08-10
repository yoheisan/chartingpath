DROP VIEW IF EXISTS public.v_live_detections_with_edge;
DROP FUNCTION IF EXISTS public.get_pattern_edge(text, text, text, text);

CREATE OR REPLACE FUNCTION public.get_pattern_edge(
  p_pattern_id text,
  p_timeframe text,
  p_asset_type text,
  p_direction text,
  p_since date DEFAULT '2024-01-01'
)
 RETURNS TABLE(total_trades bigint, win_rate_pct numeric, expectancy_r numeric, avg_rr numeric, avg_bars numeric, qualifies boolean)
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
  )
  SELECT
    g.total AS total_trades,
    CASE WHEN g.total > 0 THEN ROUND((g.wins::numeric / g.total) * 100, 1) ELSE 0 END,
    CASE WHEN g.total > 0
      THEN ROUND((g.wins::numeric / g.total) * g.avg_rr_val - (g.losses::numeric / g.total), 3)
      ELSE 0 END,
    ROUND(COALESCE(g.avg_rr_val, 0)::numeric, 2),
    ROUND(COALESCE(g.avg_bars_val, 0)::numeric, 1),
    (
      g.total >= 100
      AND CASE WHEN g.total > 0
            THEN (g.wins::numeric / g.total) * g.avg_rr_val - (g.losses::numeric / g.total)
            ELSE 0 END > 0
    )
  FROM grouped g;
$function$;

COMMENT ON FUNCTION public.get_pattern_edge(text, text, text, text, date) IS
$c$Decision rule for alert qualification. Measures a single pattern/timeframe/asset/direction cell over a TRAILING window (default 2024-01-01), not all history.

WHY THE WINDOW EXISTS (do not widen it):
The dataset is not homogeneous over time. Measured by detection year:
  year  timeout%  timeframes  expectancy
  2021   44.4%       4         -0.460
  2022   42.3%       4         -0.361
  2023   33.6%       4         -0.381
  2024   17.5%       6         -0.152
  2025   12.3%       6         -0.044
  2026   13.2%       5         +0.009
The timeframe count went from 4 to 6 (15m and 8h added in 2024) and the timeout
rate collapsed from ~44% to ~12%. That is a change in HOW outcomes are measured,
not evidence that patterns improved. Pooling 2006-2026 averages several
incompatible measurement regimes.

Extending p_since BACKWARDS makes this filter LESS reliable, not more: it
re-admits pre-2024 occurrences measured under different resolution rules.
More data is not automatically better here.

qualifies = total_trades >= 100 AND expectancy_r > 0. The n>=100 floor is
deliberately stricter than the n>=30 display floor used by
get_pattern_outcome_cells: showing data is low-stakes, telling someone to risk
money is not. get_pattern_outcome_cells and the public /outcomes page
intentionally remain on ALL history — that page is a descriptive record, this
function is a decision rule.

No seasonality adjustment is applied, deliberately. See
docs/SEASONALITY-FINDING.md.$c$;

CREATE VIEW public.v_live_detections_with_edge AS
SELECT d.id,
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
    e.avg_rr,
    e.avg_bars,
    COALESCE(e.qualifies, false) AS qualifies
   FROM public.live_pattern_detections d
     LEFT JOIN LATERAL public.get_pattern_edge(d.pattern_id, d.timeframe, d.asset_type, d.direction) e ON true
  WHERE d.status = 'active';

GRANT SELECT ON public.v_live_detections_with_edge TO authenticated;
GRANT SELECT ON public.v_live_detections_with_edge TO service_role;