-- Materialized view: pre-aggregated instrument+pattern stats
CREATE MATERIALIZED VIEW IF NOT EXISTS public.instrument_pattern_stats_mv AS
SELECT
  pattern_id,
  pattern_name,
  symbol,
  asset_type,
  timeframe,
  COUNT(*) AS total_trades,
  COUNT(*) FILTER (WHERE outcome = 'hit_tp') AS wins,
  COUNT(*) FILTER (WHERE outcome = 'hit_sl') AS losses,
  ROUND((COUNT(*) FILTER (WHERE outcome = 'hit_tp'))::numeric / COUNT(*) * 100, 1) AS win_rate_pct,
  ROUND(
    (COUNT(*) FILTER (WHERE outcome = 'hit_tp'))::numeric / COUNT(*) * AVG(COALESCE(risk_reward_ratio, 2))
    - (COUNT(*) FILTER (WHERE outcome = 'hit_sl'))::numeric / COUNT(*),
    3
  ) AS expectancy_r,
  ROUND(AVG(COALESCE(risk_reward_ratio, 2))::numeric, 2) AS avg_rr,
  ROUND(AVG(bars_to_outcome)::numeric, 1) AS avg_bars
FROM public.historical_pattern_occurrences
WHERE outcome IN ('hit_tp', 'hit_sl')
  AND bars_to_outcome IS NOT NULL
GROUP BY pattern_id, pattern_name, symbol, asset_type, timeframe
HAVING COUNT(*) >= 10;

CREATE UNIQUE INDEX IF NOT EXISTS idx_instrument_pattern_stats_mv_pk
  ON public.instrument_pattern_stats_mv (pattern_id, symbol, timeframe);

CREATE INDEX IF NOT EXISTS idx_instrument_pattern_stats_mv_pattern
  ON public.instrument_pattern_stats_mv (pattern_id);

CREATE INDEX IF NOT EXISTS idx_instrument_pattern_stats_mv_symbol
  ON public.instrument_pattern_stats_mv (symbol);

-- Function to refresh the materialized view (called by existing cron)
CREATE OR REPLACE FUNCTION public.refresh_instrument_pattern_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.instrument_pattern_stats_mv;
END;
$$;