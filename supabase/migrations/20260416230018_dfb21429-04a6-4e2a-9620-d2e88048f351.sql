CREATE OR REPLACE FUNCTION public.compute_market_breadth_by_asset_class(
  p_lookback_hours int DEFAULT 72
)
RETURNS TABLE (
  asset_class text,
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
  WITH normalized AS (
    SELECT
      hp.symbol,
      hp.close,
      hp.date,
      CASE
        WHEN hp.instrument_type IN ('stocks', 'stock', 'etfs') THEN 'stocks'
        WHEN hp.instrument_type IN ('fx', 'forex') THEN 'fx'
        WHEN hp.instrument_type = 'crypto' THEN 'crypto'
        WHEN hp.instrument_type = 'commodities' THEN 'commodities'
        WHEN hp.instrument_type IN ('indices', 'index') THEN 'indices'
        ELSE NULL
      END AS asset_class
    FROM historical_prices hp
    WHERE hp.timeframe = '1d'
      AND hp.date >= now() - ((p_lookback_hours + 240) || ' hours')::interval
  ),
  universe AS (
    SELECT DISTINCT asset_class, symbol
    FROM normalized
    WHERE asset_class IS NOT NULL
      AND date >= now() - (p_lookback_hours || ' hours')::interval
  ),
  ranked AS (
    SELECT
      n.asset_class,
      n.symbol,
      n.close,
      n.date,
      ROW_NUMBER() OVER (PARTITION BY n.asset_class, n.symbol ORDER BY n.date DESC) AS rn
    FROM normalized n
    JOIN universe u ON u.asset_class = n.asset_class AND u.symbol = n.symbol
  ),
  pairs AS (
    SELECT
      asset_class,
      symbol,
      MAX(CASE WHEN rn = 1 THEN close END) AS latest_close,
      MAX(CASE WHEN rn = 2 THEN close END) AS prev_close,
      MAX(CASE WHEN rn = 1 THEN date END) AS latest_date
    FROM ranked
    WHERE rn <= 2
    GROUP BY asset_class, symbol
    HAVING COUNT(*) = 2
  )
  SELECT
    asset_class,
    COUNT(*) FILTER (WHERE latest_close > prev_close)::int AS advances,
    COUNT(*) FILTER (WHERE latest_close < prev_close)::int AS declines,
    COUNT(*) FILTER (WHERE latest_close = prev_close)::int AS unchanged,
    COUNT(*)::int AS symbols_used,
    MAX(latest_date) AS latest_bar
  FROM pairs
  WHERE latest_close IS NOT NULL AND prev_close IS NOT NULL AND prev_close > 0
  GROUP BY asset_class
  ORDER BY asset_class;
$$;

GRANT EXECUTE ON FUNCTION public.compute_market_breadth_by_asset_class(int) TO authenticated, service_role, anon;