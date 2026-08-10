-- Unfiltered sibling of get_edge_atlas_rankings_filtered, used by the public /outcomes page.
-- Edge Atlas intentionally filters to expectancy_r > 0 because it ranks the BEST opportunities.
-- This function deliberately has NO expectancy filter: /outcomes must show losing cells alongside
-- winners, otherwise the table contradicts the negative aggregate baseline shown above it and
-- reproduces the exact selection effect we criticise. Do not "helpfully" add the filter back.
CREATE OR REPLACE FUNCTION public.get_pattern_outcome_cells(
  p_asset_type text DEFAULT NULL,
  p_timeframe  text DEFAULT NULL,
  p_min_trades integer DEFAULT 30,
  p_limit      integer DEFAULT 200
)
RETURNS TABLE(
  pattern_id text, pattern_name text, timeframe text, asset_type text,
  direction text, total_trades bigint, win_rate_pct numeric,
  expectancy_r numeric, avg_rr numeric, avg_bars numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH grouped AS (
    SELECT
      h.pattern_id, h.pattern_name, h.timeframe, h.asset_type, h.direction,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
      AVG(COALESCE(h.risk_reward_ratio, 2)) AS avg_rr_val,
      AVG(h.bars_to_outcome) AS avg_bars_val
    FROM public.historical_pattern_occurrences h
    WHERE h.outcome IN ('hit_tp', 'hit_sl')
      AND h.bars_to_outcome IS NOT NULL
      AND (p_asset_type IS NULL OR h.asset_type = p_asset_type)
      AND (p_timeframe  IS NULL OR h.timeframe  = p_timeframe)
    GROUP BY h.pattern_id, h.pattern_name, h.timeframe, h.asset_type, h.direction
    HAVING COUNT(*) >= p_min_trades
  )
  SELECT
    g.pattern_id, g.pattern_name, g.timeframe, g.asset_type, g.direction,
    g.total AS total_trades,
    ROUND((g.wins::numeric / g.total) * 100, 1) AS win_rate_pct,
    ROUND((g.wins::numeric / g.total) * g.avg_rr_val - (g.losses::numeric / g.total), 3) AS expectancy_r,
    ROUND(g.avg_rr_val::numeric, 2) AS avg_rr,
    ROUND(g.avg_bars_val::numeric, 1) AS avg_bars
  FROM grouped g
  -- Deliberately no expectancy filter. That omission is the entire point.
  ORDER BY g.total DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_pattern_outcome_cells(text, text, integer, integer) TO anon, authenticated;