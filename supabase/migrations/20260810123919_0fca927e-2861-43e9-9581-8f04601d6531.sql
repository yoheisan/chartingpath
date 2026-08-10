-- Live detections store direction as long/short; the historical record stores
-- bullish/bearish. Normalise both sides so the join actually matches.
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
$$;