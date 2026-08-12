-- =====================================================================
-- Broker cost profiles.
-- These are researched approximations taken from public retail broker
-- comparisons (2026), NOT live feeds. Spreads vary materially by session
-- (Asian session is wider), by pair, and around scheduled news. Treat the
-- figures as a plausible cost band, not a quote.
--
-- Column semantics differ by asset class, deliberately:
--   asset_class = 'fx'  -> typical_spread_pips is in PIPS
--                          commission_per_lot_roundtrip is USD per 100k lot
--   otherwise           -> typical_spread_pips is PERCENT OF PRICE
--                          commission_per_lot_roundtrip is PERCENT of notional
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.broker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('raw','standard')),
  asset_class text NOT NULL,
  typical_spread_pips numeric NOT NULL DEFAULT 0,
  commission_per_lot_roundtrip numeric NOT NULL DEFAULT 0,
  notes text,
  source_url text,
  is_custom boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, asset_class)
);

GRANT SELECT ON public.broker_profiles TO anon;
GRANT SELECT ON public.broker_profiles TO authenticated;
GRANT ALL ON public.broker_profiles TO service_role;

ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Broker profiles are publicly readable"
  ON public.broker_profiles FOR SELECT USING (true);

CREATE POLICY "Only service role can modify broker profiles"
  ON public.broker_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER update_broker_profiles_updated_at
  BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- Seed: FX archetypes, named by pricing model rather than by broker.
-- ---------------------------------------------------------------------
INSERT INTO public.broker_profiles (name, account_type, asset_class, typical_spread_pips, commission_per_lot_roundtrip, notes, source_url, is_custom, is_default) VALUES
  ('Raw / ECN', 'raw', 'fx', 0.10, 7.00,
   'Raw-spread archetype: 0.0-0.2 pips on EUR/USD plus roughly $7 round-trip commission per standard lot. Researched approximation from public 2026 retail comparisons, not a live feed.',
   'https://www.forexbrokers.com/guides/forex-spreads', false, false),
  ('Standard, commission-free (tight)', 'standard', 'fx', 0.60, 0,
   'Commission-free standard account at the tight end: ~0.5-0.9 pips all-in on EUR/USD. Majors generally under 1.5 pips.',
   'https://www.forexbrokers.com/guides/forex-spreads', false, false),
  ('Standard, commission-free (wide)', 'standard', 'fx', 1.20, 0,
   'Commission-free standard account at the wide end: ~1.0-1.5 pips on EUR/USD. Minors and crosses run 1.5-5 pips and are not modelled separately yet.',
   'https://www.forexbrokers.com/guides/forex-spreads', false, false),
  ('Not sure / industry average', 'standard', 'fx', 0.88, 0,
   'Conservative default. Industry average all-in EUR/USD cost of roughly 0.88 pips. Used when you have not told us what you actually pay.',
   'https://www.forexbrokers.com/guides/forex-spreads', false, true),
  ('Custom', 'standard', 'fx', 0.90, 0,
   'Placeholder. Enter your own spread and commission in settings; your figures override this row.',
   NULL, true, false)
ON CONFLICT (name, asset_class) DO NOTHING;

-- Non-FX defaults, expressed as percent of price / percent of notional.
INSERT INTO public.broker_profiles (name, account_type, asset_class, typical_spread_pips, commission_per_lot_roundtrip, notes, source_url, is_custom, is_default) VALUES
  ('Not sure / industry average', 'standard', 'stocks',      0.030, 0.010, 'Percent of price. Retail equity spread plus a small commission/slippage allowance.', NULL, false, true),
  ('Not sure / industry average', 'standard', 'etfs',        0.020, 0.010, 'Percent of price. Tighter than single names.', NULL, false, true),
  ('Not sure / industry average', 'standard', 'indices',     0.020, 0.005, 'Percent of price. Index CFD spread.', NULL, false, true),
  ('Not sure / industry average', 'standard', 'commodities', 0.040, 0.010, 'Percent of price. Thinner books outside the front month.', NULL, false, true),
  ('Not sure / industry average', 'standard', 'crypto',      0.060, 0.100, 'Percent of price. Taker fees roughly 0.05% each side plus spread.', NULL, false, true)
ON CONFLICT (name, asset_class) DO NOTHING;

-- ---------------------------------------------------------------------
-- User settings
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS broker_profile_id uuid REFERENCES public.broker_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_spread_pips numeric,
  ADD COLUMN IF NOT EXISTS custom_commission_per_lot numeric;

-- =====================================================================
-- Per-detection cost, in R.
--   cost_r = (spread_in_price + commission_in_price) / abs(entry - stop)
-- R is DEFINED by stop distance, so a flat per-asset-class cost cannot be
-- right: the same 0.9 pip EUR/USD spread is ~0.004R against a 200 pip stop
-- and ~0.09R against a 10 pip stop.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_detection_cost_r(
  p_entry numeric,
  p_stop numeric,
  p_symbol text,
  p_asset_type text,
  p_broker_profile_id uuid DEFAULT NULL,
  p_spread_override numeric DEFAULT NULL,
  p_commission_override numeric DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_asset text := lower(coalesce(p_asset_type, ''));
  v_risk numeric := abs(coalesce(p_entry, 0) - coalesce(p_stop, 0));
  v_name text;
  v_spread numeric;
  v_comm numeric;
  v_pip numeric;
  v_cost numeric;
BEGIN
  -- Divide-by-zero guard: no usable stop distance means no per-detection cost.
  IF p_entry IS NULL OR p_stop IS NULL OR v_risk = 0 OR p_entry <= 0 THEN
    RETURN NULL;
  END IF;

  SELECT name INTO v_name FROM public.broker_profiles WHERE id = p_broker_profile_id;

  -- Resolve the row for THIS asset class, under the selected profile's name,
  -- falling back to the conservative industry-average row.
  SELECT b.typical_spread_pips, b.commission_per_lot_roundtrip
    INTO v_spread, v_comm
  FROM public.broker_profiles b
  WHERE b.asset_class = v_asset
    AND b.name = coalesce(v_name, 'Not sure / industry average')
  LIMIT 1;

  IF v_spread IS NULL THEN
    SELECT b.typical_spread_pips, b.commission_per_lot_roundtrip
      INTO v_spread, v_comm
    FROM public.broker_profiles b
    WHERE b.asset_class = v_asset AND b.is_default
    LIMIT 1;
  END IF;

  IF v_spread IS NULL THEN
    RETURN NULL; -- caller falls back to the static assumptions table
  END IF;

  -- User overrides win over the profile figures.
  v_spread := coalesce(p_spread_override, v_spread);
  v_comm   := coalesce(p_commission_override, v_comm);

  IF v_asset = 'fx' THEN
    -- JPY quote pairs price to 0.01, everything else to 0.0001.
    v_pip := CASE WHEN upper(coalesce(p_symbol, '')) LIKE '%JPY%' THEN 0.01 ELSE 0.0001 END;
    -- Commission is USD per 100k standard lot -> price terms per unit.
    v_cost := (v_spread * v_pip) + (v_comm / 100000.0);
  ELSE
    -- Non-FX: spread and commission are percentages of price / notional.
    v_cost := p_entry * ((v_spread + v_comm) / 100.0);
  END IF;

  RETURN round(v_cost / v_risk, 4);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_detection_cost_r(numeric, numeric, text, text, uuid, numeric, numeric) TO anon, authenticated, service_role;

-- =====================================================================
-- Cell-level edge, now costed from the median per-occurrence cost.
-- Qualification rule unchanged: n >= 100 AND expectancy net of cost > 0.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_pattern_edge(
  p_pattern_id text,
  p_timeframe text,
  p_asset_type text,
  p_direction text,
  p_since date DEFAULT '2024-01-01'::date,
  p_broker_profile_id uuid DEFAULT NULL,
  p_spread_override numeric DEFAULT NULL,
  p_commission_override numeric DEFAULT NULL
)
RETURNS TABLE(total_trades bigint, win_rate_pct numeric, expectancy_r numeric, est_cost_r numeric, expectancy_r_net numeric, avg_rr numeric, avg_bars numeric, qualifies boolean)
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
  rows AS (
    SELECT h.outcome, h.risk_reward_ratio, h.bars_to_outcome,
           public.get_detection_cost_r(h.entry_price, h.stop_loss_price, h.symbol,
                                       h.asset_type, p_broker_profile_id,
                                       p_spread_override, p_commission_override) AS cost_r
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
  ),
  grouped AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE outcome = 'hit_tp') AS wins,
      COUNT(*) FILTER (WHERE outcome = 'hit_sl') AS losses,
      AVG(COALESCE(risk_reward_ratio, 2)) AS avg_rr_val,
      AVG(bars_to_outcome) AS avg_bars_val,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY cost_r)::numeric AS median_cost
    FROM rows
  ),
  calc AS (
    SELECT
      g.total, g.avg_rr_val, g.avg_bars_val,
      CASE WHEN g.total > 0 THEN ROUND((g.wins::numeric / g.total) * 100, 1) ELSE 0 END AS wr,
      CASE WHEN g.total > 0
        THEN ROUND((g.wins::numeric / g.total) * g.avg_rr_val - (g.losses::numeric / g.total), 3)
        ELSE 0 END AS gross,
      -- Per-detection cost where entry/stop exist, static table only as fallback.
      ROUND(COALESCE(g.median_cost, public.get_est_cost_r(p_asset_type, p_timeframe)), 4) AS cost
    FROM grouped g
  )
  SELECT
    c.total AS total_trades,
    c.wr AS win_rate_pct,
    c.gross AS expectancy_r,
    c.cost AS est_cost_r,
    ROUND(c.gross - c.cost, 3) AS expectancy_r_net,
    ROUND(COALESCE(c.avg_rr_val, 0)::numeric, 2) AS avg_rr,
    ROUND(COALESCE(c.avg_bars_val, 0)::numeric, 1) AS avg_bars,
    (c.total >= 100 AND (c.gross - c.cost) > 0) AS qualifies
  FROM calc c;
$function$;

-- =====================================================================
-- Live detections: cost is now computed from THIS detection's stop distance.
-- =====================================================================
DROP VIEW IF EXISTS public.v_live_detections_with_edge;

CREATE VIEW public.v_live_detections_with_edge
WITH (security_invoker = true) AS
WITH cells AS (
  SELECT DISTINCT d.pattern_id, d.timeframe, d.asset_type,
         CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END AS dir
  FROM public.live_pattern_detections d
  WHERE d.status = 'active'
),
grouped AS (
  SELECT c.pattern_id, c.timeframe, c.asset_type, c.dir,
         count(h.id) AS total,
         count(h.id) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
         count(h.id) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
         avg(COALESCE(h.risk_reward_ratio, 2)) AS avg_rr_val,
         avg(h.bars_to_outcome) AS avg_bars_val
  FROM cells c
  LEFT JOIN public.historical_pattern_occurrences h
    ON h.pattern_id = c.pattern_id
   AND h.timeframe = c.timeframe
   AND h.asset_type = c.asset_type
   AND CASE lower(h.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END = c.dir
   AND h.outcome IN ('hit_tp','hit_sl')
   AND h.bars_to_outcome IS NOT NULL
   AND h.detected_at >= '2024-01-01'::date
  GROUP BY c.pattern_id, c.timeframe, c.asset_type, c.dir
),
edge AS (
  SELECT g.pattern_id, g.timeframe, g.asset_type, g.dir,
         g.total AS total_trades,
         CASE WHEN g.total > 0 THEN round(g.wins::numeric / g.total * 100, 1) ELSE 0 END AS win_rate_pct,
         CASE WHEN g.total > 0 THEN round(g.wins::numeric / g.total * g.avg_rr_val - g.losses::numeric / g.total, 3) ELSE 0 END AS expectancy_r,
         round(COALESCE(g.avg_rr_val, 0), 2) AS avg_rr,
         round(COALESCE(g.avg_bars_val, 0), 1) AS avg_bars
  FROM grouped g
)
SELECT d.id, d.instrument, d.pattern_id, d.pattern_name, d.timeframe, d.asset_type,
       d.direction, d.status, d.entry_price, d.stop_loss_price, d.take_profit_price,
       d.risk_reward_ratio, d.current_price, d.quality_score, d.exchange,
       d.first_detected_at, d.last_confirmed_at,
       e.total_trades, e.win_rate_pct, e.expectancy_r,
       COALESCE(
         public.get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL),
         public.get_est_cost_r(d.asset_type, d.timeframe)
       ) AS est_cost_r,
       round(e.expectancy_r - COALESCE(
         public.get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL),
         public.get_est_cost_r(d.asset_type, d.timeframe)
       ), 3) AS expectancy_r_net,
       e.avg_rr, e.avg_bars,
       COALESCE(cs.status, 'active') AS cell_status,
       cs.suspended_reason,
       COALESCE(
         e.total_trades >= 100
         AND (e.expectancy_r - COALESCE(
                public.get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL),
                public.get_est_cost_r(d.asset_type, d.timeframe))) > 0,
         false)
       AND COALESCE(cs.status, 'active') <> 'suspended' AS qualifies
FROM public.live_pattern_detections d
LEFT JOIN edge e
  ON e.pattern_id = d.pattern_id AND e.timeframe = d.timeframe AND e.asset_type = d.asset_type
 AND e.dir = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
LEFT JOIN public.cell_status cs
  ON cs.pattern_id = d.pattern_id AND cs.timeframe = d.timeframe AND cs.asset_type = d.asset_type
 AND cs.direction = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
WHERE d.status = 'active';

GRANT SELECT ON public.v_live_detections_with_edge TO anon, authenticated, service_role;