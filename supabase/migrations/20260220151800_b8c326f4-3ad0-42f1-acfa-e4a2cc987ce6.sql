
CREATE OR REPLACE FUNCTION public.get_edge_atlas_rankings(
  p_asset_type text,
  p_min_trades integer DEFAULT 50,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  pattern_id text,
  pattern_name text,
  timeframe text,
  total_trades bigint,
  win_rate_pct numeric,
  expectancy_r numeric,
  trades_per_year numeric,
  est_annualized_pct numeric,
  avg_bars numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH grouped AS (
    SELECT
      h.pattern_id,
      h.pattern_name,
      h.timeframe,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
      AVG(COALESCE(h.risk_reward_ratio, 2)) AS avg_rr,
      AVG(h.bars_to_outcome) AS avg_bars_val
    FROM public.historical_pattern_occurrences h
    WHERE h.asset_type = p_asset_type
      AND h.outcome IN ('hit_tp', 'hit_sl')
      AND h.bars_to_outcome IS NOT NULL
    GROUP BY h.pattern_id, h.pattern_name, h.timeframe
    HAVING COUNT(*) >= p_min_trades
  ),
  ranked AS (
    SELECT
      g.pattern_id,
      g.pattern_name,
      g.timeframe,
      g.total AS total_trades,
      ROUND((g.wins::numeric / g.total) * 100, 1) AS win_rate_pct,
      ROUND(
        (g.wins::numeric / g.total) * g.avg_rr
        - (g.losses::numeric / g.total),
        3
      ) AS expectancy_r,
      g.avg_bars_val AS avg_bars,
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
    r.total_trades,
    r.win_rate_pct,
    r.expectancy_r,
    ROUND(r.trades_per_year, 1) AS trades_per_year,
    ROUND(r.trades_per_year * r.expectancy_r, 1) AS est_annualized_pct,
    ROUND(r.avg_bars::numeric, 1) AS avg_bars
  FROM ranked r
  WHERE r.expectancy_r > 0
  ORDER BY (r.trades_per_year * r.expectancy_r) DESC
  LIMIT p_limit;
$$;

-- Also a variant for FX that accepts symbol filter list
CREATE OR REPLACE FUNCTION public.get_edge_atlas_rankings_fx(
  p_symbols text[],  -- pass null for all FX, or specific symbol list
  p_min_trades integer DEFAULT 50,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  pattern_id text,
  pattern_name text,
  timeframe text,
  total_trades bigint,
  win_rate_pct numeric,
  expectancy_r numeric,
  trades_per_year numeric,
  est_annualized_pct numeric,
  avg_bars numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH grouped AS (
    SELECT
      h.pattern_id,
      h.pattern_name,
      h.timeframe,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
      AVG(COALESCE(h.risk_reward_ratio, 2)) AS avg_rr,
      AVG(h.bars_to_outcome) AS avg_bars_val
    FROM public.historical_pattern_occurrences h
    WHERE h.asset_type = 'fx'
      AND h.outcome IN ('hit_tp', 'hit_sl')
      AND h.bars_to_outcome IS NOT NULL
      AND (p_symbols IS NULL OR h.symbol = ANY(p_symbols))
    GROUP BY h.pattern_id, h.pattern_name, h.timeframe
    HAVING COUNT(*) >= p_min_trades
  ),
  ranked AS (
    SELECT
      g.pattern_id,
      g.pattern_name,
      g.timeframe,
      g.total AS total_trades,
      ROUND((g.wins::numeric / g.total) * 100, 1) AS win_rate_pct,
      ROUND(
        (g.wins::numeric / g.total) * g.avg_rr
        - (g.losses::numeric / g.total),
        3
      ) AS expectancy_r,
      g.avg_bars_val AS avg_bars,
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
    r.total_trades,
    r.win_rate_pct,
    r.expectancy_r,
    ROUND(r.trades_per_year, 1) AS trades_per_year,
    ROUND(r.trades_per_year * r.expectancy_r, 1) AS est_annualized_pct,
    ROUND(r.avg_bars::numeric, 1) AS avg_bars
  FROM ranked r
  WHERE r.expectancy_r > 0
  ORDER BY (r.trades_per_year * r.expectancy_r) DESC
  LIMIT p_limit;
$$;
