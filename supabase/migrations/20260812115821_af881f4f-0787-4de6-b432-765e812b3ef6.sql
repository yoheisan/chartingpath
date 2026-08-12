-- Cluster-based exposure grouping.
-- NOTE: We deliberately do NOT compute pairwise return correlation. There is no
-- price-history table available for this, and raw correlation is unreliable for
-- risk purposes anyway: it converges to 1 in exactly the stress scenarios that
-- matter. Grouping by direction + asset class + country is the honest
-- approximation of shared factor exposure.
-- TODO: sector-level clustering is blocked on backfilling instruments.sector,
-- which is NULL for all rows today. Do not add sector logic until it is populated.

CREATE OR REPLACE VIEW public.v_user_exposure
WITH (security_invoker = true) AS
WITH open_trades AS (
  SELECT
    pt.user_id,
    CASE WHEN lower(pt.trade_type) = 'short' THEN 'short' ELSE 'long' END AS direction,
    COALESCE(NULLIF(pt.asset_type, ''), i.asset_type, 'unknown') AS asset_type,
    COALESCE(NULLIF(i.country, ''), 'unknown') AS country,
    COALESCE(i.currency, 'unknown') AS currency,
    COALESCE(pt.position_size_pct, 0) AS position_size_pct
  FROM public.paper_trades pt
  LEFT JOIN public.instruments i ON upper(i.symbol) = upper(pt.symbol)
  WHERE pt.status = 'open'
),
buckets AS (
  SELECT
    user_id,
    direction || '|' || asset_type || '|' || country AS exposure_bucket,
    direction,
    asset_type,
    country,
    count(*)::int AS positions,
    sum(position_size_pct) AS pct
  FROM open_trades
  GROUP BY user_id, 1 + 0, direction, asset_type, country
)
SELECT
  t.user_id,
  count(*)::int AS total_open_positions,
  sum(t.position_size_pct) AS total_position_size_pct,
  sum(t.position_size_pct) FILTER (WHERE t.direction = 'long') AS net_long_pct,
  sum(t.position_size_pct) FILTER (WHERE t.direction = 'short') AS net_short_pct,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'exposure_bucket', b.exposure_bucket,
      'direction', b.direction,
      'asset_type', b.asset_type,
      'country', b.country,
      'positions', b.positions,
      'pct', b.pct
    ) ORDER BY b.pct DESC)
    FROM buckets b WHERE b.user_id = t.user_id
  ) AS buckets
FROM open_trades t
GROUP BY t.user_id;

COMMENT ON VIEW public.v_user_exposure IS
  'Per-user open paper-trade exposure. security_invoker so paper_trades RLS applies: a user only ever sees their own row.';

GRANT SELECT ON public.v_user_exposure TO authenticated;

CREATE OR REPLACE FUNCTION public.get_exposure_cluster(
  p_user_id uuid,
  p_symbol text,
  p_direction text,
  p_asset_type text,
  p_new_position_pct numeric DEFAULT 1.0
)
RETURNS TABLE (
  cluster_key text,
  existing_positions_in_cluster int,
  existing_pct_in_cluster numeric,
  correlated_after_add numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_direction text := CASE WHEN lower(coalesce(p_direction,'long')) LIKE '%short%' THEN 'short' ELSE 'long' END;
  v_asset text;
  v_country text;
  v_key text;
BEGIN
  -- Hard scope: never return data for anyone but the caller.
  IF p_user_id IS NULL OR auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    IF NOT (auth.role() = 'service_role') THEN
      RAISE EXCEPTION 'not authorized';
    END IF;
  END IF;

  SELECT COALESCE(NULLIF(p_asset_type,''), i.asset_type, 'unknown'),
         COALESCE(NULLIF(i.country,''), 'unknown')
    INTO v_asset, v_country
  FROM public.instruments i
  WHERE upper(i.symbol) = upper(p_symbol)
  LIMIT 1;

  v_asset := COALESCE(v_asset, NULLIF(p_asset_type,''), 'unknown');
  v_country := COALESCE(v_country, 'unknown');
  v_key := v_direction || '|' || v_asset || '|' || v_country;

  RETURN QUERY
  WITH mine AS (
    SELECT COALESCE(pt.position_size_pct, 0) AS pct
    FROM public.paper_trades pt
    LEFT JOIN public.instruments i2 ON upper(i2.symbol) = upper(pt.symbol)
    WHERE pt.user_id = p_user_id
      AND pt.status = 'open'
      AND (CASE WHEN lower(pt.trade_type) = 'short' THEN 'short' ELSE 'long' END) = v_direction
      AND COALESCE(NULLIF(pt.asset_type,''), i2.asset_type, 'unknown') = v_asset
      AND COALESCE(NULLIF(i2.country,''), 'unknown') = v_country
  )
  SELECT v_key,
         (SELECT count(*)::int FROM mine),
         (SELECT COALESCE(sum(pct),0) FROM mine),
         (SELECT COALESCE(sum(pct),0) FROM mine) + COALESCE(p_new_position_pct, 0);
END;
$$;

COMMENT ON FUNCTION public.get_exposure_cluster(uuid, text, text, text, numeric) IS
  'Factor-exposure cluster lookup for a proposed trade. SECURITY DEFINER but strictly scoped to the calling user. Cluster = direction + asset_type + country (no sector: instruments.sector is unpopulated; no pairwise correlation by design).';

REVOKE ALL ON FUNCTION public.get_exposure_cluster(uuid, text, text, text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exposure_cluster(uuid, text, text, text, numeric) TO authenticated, service_role;

ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS max_correlated_exposure_pct numeric NOT NULL DEFAULT 4.0;

COMMENT ON COLUMN public.alerts.max_correlated_exposure_pct IS
  'Caps AGGREGATE exposure to a single correlated cluster (direction + asset class + country). alerts.risk_percent caps risk PER TRADE; this caps the whole cluster. Ten correlated trades at 1% each is a 10% bet, not ten 1% bets.';