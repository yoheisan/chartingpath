-- Edge lookup for a single pattern/timeframe/asset/direction cell.
-- Same grouping and expectancy maths as public.get_pattern_outcome_cells.
--
-- NOTE ON THE FLOOR: the /outcomes display surface uses n >= 30 because merely
-- showing a statistic is low-stakes. Alerting a user to risk money is not, so
-- `qualifies` uses a stricter n >= 100 together with expectancy_r > 0. The two
-- floors are deliberately different and should not be unified.
CREATE OR REPLACE FUNCTION public.get_pattern_edge(
  p_pattern_id text,
  p_timeframe  text,
  p_asset_type text,
  p_direction  text
)
RETURNS TABLE(
  total_trades bigint,
  win_rate_pct numeric,
  expectancy_r numeric,
  avg_rr       numeric,
  avg_bars     numeric,
  qualifies    boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH grouped AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
      AVG(COALESCE(h.risk_reward_ratio, 2)) AS avg_rr_val,
      AVG(h.bars_to_outcome) AS avg_bars_val
    FROM public.historical_pattern_occurrences h
    WHERE h.outcome IN ('hit_tp', 'hit_sl')
      AND h.bars_to_outcome IS NOT NULL
      AND h.pattern_id = p_pattern_id
      AND h.timeframe  = p_timeframe
      AND h.asset_type = p_asset_type
      AND h.direction  = p_direction
  )
  SELECT
    g.total AS total_trades,
    CASE WHEN g.total > 0 THEN ROUND((g.wins::numeric / g.total) * 100, 1) ELSE 0 END AS win_rate_pct,
    CASE WHEN g.total > 0
      THEN ROUND((g.wins::numeric / g.total) * g.avg_rr_val - (g.losses::numeric / g.total), 3)
      ELSE 0 END AS expectancy_r,
    ROUND(COALESCE(g.avg_rr_val, 0)::numeric, 2) AS avg_rr,
    ROUND(COALESCE(g.avg_bars_val, 0)::numeric, 1) AS avg_bars,
    (
      g.total >= 100
      AND CASE WHEN g.total > 0
            THEN (g.wins::numeric / g.total) * g.avg_rr_val - (g.losses::numeric / g.total)
            ELSE 0 END > 0
    ) AS qualifies
  FROM grouped g;
$$;

GRANT EXECUTE ON FUNCTION public.get_pattern_edge(text, text, text, text) TO anon, authenticated, service_role;

-- Active live detections joined to their measured edge.
CREATE OR REPLACE VIEW public.v_live_detections_with_edge
WITH (security_invoker = true)
AS
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
  e.avg_rr,
  e.avg_bars,
  COALESCE(e.qualifies, false) AS qualifies
FROM public.live_pattern_detections d
LEFT JOIN LATERAL public.get_pattern_edge(d.pattern_id, d.timeframe, d.asset_type, d.direction) e ON true
WHERE d.status = 'active';

GRANT SELECT ON public.v_live_detections_with_edge TO authenticated, service_role;

-- Detections that matched a user's alert but were withheld for lack of measured edge.
CREATE TABLE IF NOT EXISTS public.alert_suppression_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_id uuid,
  detection_id uuid,
  symbol text NOT NULL,
  pattern_id text NOT NULL,
  timeframe text NOT NULL,
  asset_type text,
  direction text,
  total_trades bigint,
  expectancy_r numeric,
  reason text NOT NULL DEFAULT 'no_measured_edge',
  suppressed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.alert_suppression_log TO authenticated;
GRANT ALL ON public.alert_suppression_log TO service_role;

ALTER TABLE public.alert_suppression_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own suppressed detections"
  ON public.alert_suppression_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_alert_suppression_user_time
  ON public.alert_suppression_log (user_id, suppressed_at DESC);