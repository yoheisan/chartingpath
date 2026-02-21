
CREATE OR REPLACE FUNCTION public.get_edge_atlas_rankings_filtered(
  p_asset_type text DEFAULT NULL,
  p_timeframe text DEFAULT NULL,
  p_pattern_name text DEFAULT NULL,
  p_direction text DEFAULT NULL,
  p_min_trades integer DEFAULT 30,
  p_min_win_rate numeric DEFAULT NULL,
  p_min_annualized_pct numeric DEFAULT NULL,
  p_min_expectancy numeric DEFAULT NULL,
  p_fx_symbols text[] DEFAULT NULL,
  p_sort_by text DEFAULT 'annualized',
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  pattern_id text,
  pattern_name text,
  timeframe text,
  asset_type text,
  direction text,
  total_trades bigint,
  win_rate_pct numeric,
  expectancy_r numeric,
  trades_per_year numeric,
  est_annualized_pct numeric,
  avg_bars numeric,
  avg_rr numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH grouped AS (
    SELECT
      h.pattern_id,
      h.pattern_name,
      h.timeframe,
      h.asset_type,
      h.direction,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
      AVG(COALESCE(h.risk_reward_ratio, 2)) AS avg_rr_val,
      AVG(h.bars_to_outcome) AS avg_bars_val
    FROM public.historical_pattern_occurrences h
    WHERE h.outcome IN ('hit_tp', 'hit_sl')
      AND h.bars_to_outcome IS NOT NULL
      AND (p_asset_type IS NULL OR h.asset_type = p_asset_type)
      AND (p_timeframe IS NULL OR h.timeframe = p_timeframe)
      AND (p_pattern_name IS NULL OR h.pattern_name ILIKE '%' || p_pattern_name || '%')
      AND (p_direction IS NULL OR h.direction = p_direction)
      AND (p_fx_symbols IS NULL OR h.symbol = ANY(p_fx_symbols))
    GROUP BY h.pattern_id, h.pattern_name, h.timeframe, h.asset_type, h.direction
    HAVING COUNT(*) >= p_min_trades
  ),
  ranked AS (
    SELECT
      g.pattern_id,
      g.pattern_name,
      g.timeframe,
      g.asset_type,
      g.direction,
      g.total AS total_trades,
      ROUND((g.wins::numeric / g.total) * 100, 1) AS win_rate_pct,
      ROUND(
        (g.wins::numeric / g.total) * g.avg_rr_val
        - (g.losses::numeric / g.total),
        3
      ) AS expectancy_r,
      g.avg_bars_val AS avg_bars,
      ROUND(g.avg_rr_val::numeric, 2) AS avg_rr,
      CASE g.timeframe
        WHEN '1wk' THEN 52.0
        WHEN '1d'  THEN 252.0
        WHEN '8h'  THEN 756.0
        WHEN '4h'  THEN 1512.0
        WHEN '1h'  THEN 6048.0
        ELSE 252.0
      END / GREATEST(g.avg_bars_val, 1) AS trades_per_year
    FROM grouped g
  )
  SELECT
    r.pattern_id,
    r.pattern_name,
    r.timeframe,
    r.asset_type,
    r.direction,
    r.total_trades,
    r.win_rate_pct,
    r.expectancy_r,
    ROUND(r.trades_per_year, 1) AS trades_per_year,
    ROUND(r.trades_per_year * r.expectancy_r, 1) AS est_annualized_pct,
    ROUND(r.avg_bars::numeric, 1) AS avg_bars,
    r.avg_rr
  FROM ranked r
  WHERE r.expectancy_r > 0
    AND (p_min_win_rate IS NULL OR r.win_rate_pct >= p_min_win_rate)
    AND (p_min_annualized_pct IS NULL OR (r.trades_per_year * r.expectancy_r) >= p_min_annualized_pct)
    AND (p_min_expectancy IS NULL OR r.expectancy_r >= p_min_expectancy)
  ORDER BY
    CASE p_sort_by
      WHEN 'win_rate' THEN r.win_rate_pct
      WHEN 'expectancy' THEN r.expectancy_r
      WHEN 'trades' THEN r.total_trades::numeric
      ELSE r.trades_per_year * r.expectancy_r
    END DESC
  LIMIT p_limit;
$$;
