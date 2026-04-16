CREATE OR REPLACE FUNCTION public.compute_market_breadth_from_history(
  p_lookback_hours int DEFAULT 72
)
RETURNS TABLE (
  advances int,
  declines int,
  unchanged int,
  symbols_used int,
  latest_bar timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stock_universe AS (
    SELECT DISTINCT symbol
    FROM historical_prices
    WHERE timeframe = '1d'
      AND instrument_type IN ('stocks', 'stock', 'etfs')
      AND date >= now() - (p_lookback_hours || ' hours')::interval
  ),
  ranked AS (
    SELECT
      hp.symbol,
      hp.close,
      hp.date,
      ROW_NUMBER() OVER (PARTITION BY hp.symbol ORDER BY hp.date DESC) AS rn
    FROM historical_prices hp
    JOIN stock_universe u ON u.symbol = hp.symbol
    WHERE hp.timeframe = '1d'
      AND hp.instrument_type IN ('stocks', 'stock', 'etfs')
      AND hp.date >= now() - ((p_lookback_hours + 240) || ' hours')::interval
  ),
  pairs AS (
    SELECT
      symbol,
      MAX(CASE WHEN rn = 1 THEN close END) AS latest_close,
      MAX(CASE WHEN rn = 2 THEN close END) AS prev_close,
      MAX(CASE WHEN rn = 1 THEN date END) AS latest_date
    FROM ranked
    WHERE rn <= 2
    GROUP BY symbol
    HAVING COUNT(*) = 2
  )
  SELECT
    COUNT(*) FILTER (WHERE latest_close > prev_close)::int AS advances,
    COUNT(*) FILTER (WHERE latest_close < prev_close)::int AS declines,
    COUNT(*) FILTER (WHERE latest_close = prev_close)::int AS unchanged,
    COUNT(*)::int AS symbols_used,
    MAX(latest_date) AS latest_bar
  FROM pairs
  WHERE latest_close IS NOT NULL AND prev_close IS NOT NULL AND prev_close > 0;
$$;

GRANT EXECUTE ON FUNCTION public.compute_market_breadth_from_history(int) TO authenticated, service_role, anon;