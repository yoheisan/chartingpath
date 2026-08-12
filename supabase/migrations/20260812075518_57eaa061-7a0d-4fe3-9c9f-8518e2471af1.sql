
-- ============================================================
-- PART 1: COST MODEL
-- ============================================================
CREATE TABLE public.pattern_cost_assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL,
  timeframe text NOT NULL,
  est_cost_r numeric NOT NULL CHECK (est_cost_r >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_type, timeframe)
);

GRANT SELECT ON public.pattern_cost_assumptions TO anon;
GRANT SELECT ON public.pattern_cost_assumptions TO authenticated;
GRANT ALL ON public.pattern_cost_assumptions TO service_role;

ALTER TABLE public.pattern_cost_assumptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cost assumptions are publicly readable"
  ON public.pattern_cost_assumptions FOR SELECT USING (true);

CREATE POLICY "Only admins can modify cost assumptions"
  ON public.pattern_cost_assumptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_pattern_cost_assumptions_updated_at
  BEFORE UPDATE ON public.pattern_cost_assumptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.pattern_cost_assumptions IS
$c$PROVISIONAL round-trip cost estimates (spread + commission + slippage) expressed
in R, i.e. as a fraction of the trade''s initial risk (entry-to-stop distance).

WHY IT IS EXPRESSED IN R: costs are roughly FIXED per trade in price terms, while
the edge scales with the size of the move. A 15m stop is small, so a fixed cost eats
a large fraction of R; a daily or weekly stop is wide, so the same cost is a rounding
error. This is why the same gross expectancy can be net-positive on 1d and
net-negative on 15m.

THESE NUMBERS ARE PLACEHOLDERS. They are deliberately conservative order-of-magnitude
estimates, NOT measured execution data, and NOT specific to any broker. They must be
replaced with broker-specific figures (real spreads, commission schedule and measured
slippage) before anyone relies on the resulting net expectancy for real money.
Until then, treat every "after estimated costs" figure on the platform as indicative.$c$;

-- Provisional seeds. Shorter timeframe => smaller stop => larger cost in R.
INSERT INTO public.pattern_cost_assumptions (asset_type, timeframe, est_cost_r, notes) VALUES
  ('stocks','15m',0.150,'PROVISIONAL. US equities, retail commission + typical spread on a tight intraday stop.'),
  ('stocks','1h', 0.080,'PROVISIONAL.'),
  ('stocks','4h', 0.050,'PROVISIONAL.'),
  ('stocks','8h', 0.040,'PROVISIONAL.'),
  ('stocks','1d', 0.030,'PROVISIONAL.'),
  ('stocks','1wk',0.020,'PROVISIONAL.'),
  ('etfs','15m',0.120,'PROVISIONAL. Tighter spreads than single names.'),
  ('etfs','1h', 0.070,'PROVISIONAL.'),
  ('etfs','4h', 0.040,'PROVISIONAL.'),
  ('etfs','8h', 0.030,'PROVISIONAL.'),
  ('etfs','1d', 0.020,'PROVISIONAL.'),
  ('etfs','1wk',0.015,'PROVISIONAL.'),
  ('fx','15m',0.100,'PROVISIONAL. Major pairs; exotics are materially worse and are not modelled separately yet.'),
  ('fx','1h', 0.060,'PROVISIONAL.'),
  ('fx','4h', 0.040,'PROVISIONAL.'),
  ('fx','8h', 0.030,'PROVISIONAL.'),
  ('fx','1d', 0.020,'PROVISIONAL.'),
  ('fx','1wk',0.015,'PROVISIONAL. Excludes swap/rollover, which can dominate at this horizon.'),
  ('crypto','15m',0.200,'PROVISIONAL. Taker fees both sides plus wide slippage; the worst asset class for cost drag.'),
  ('crypto','1h', 0.120,'PROVISIONAL.'),
  ('crypto','4h', 0.080,'PROVISIONAL.'),
  ('crypto','8h', 0.060,'PROVISIONAL.'),
  ('crypto','1d', 0.050,'PROVISIONAL.'),
  ('crypto','1wk',0.040,'PROVISIONAL.'),
  ('indices','15m',0.120,'PROVISIONAL. CFD/futures index products.'),
  ('indices','1h', 0.070,'PROVISIONAL.'),
  ('indices','4h', 0.040,'PROVISIONAL.'),
  ('indices','8h', 0.030,'PROVISIONAL.'),
  ('indices','1d', 0.025,'PROVISIONAL.'),
  ('indices','1wk',0.020,'PROVISIONAL.'),
  ('commodities','15m',0.150,'PROVISIONAL. Futures/CFD, thinner books outside the front month.'),
  ('commodities','1h', 0.090,'PROVISIONAL.'),
  ('commodities','4h', 0.060,'PROVISIONAL.'),
  ('commodities','8h', 0.045,'PROVISIONAL.'),
  ('commodities','1d', 0.035,'PROVISIONAL.'),
  ('commodities','1wk',0.030,'PROVISIONAL.');

CREATE OR REPLACE FUNCTION public.get_est_cost_r(p_asset_type text, p_timeframe text)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT c.est_cost_r
       FROM public.pattern_cost_assumptions c
      WHERE c.asset_type = lower(p_asset_type)
        AND c.timeframe  = p_timeframe
      LIMIT 1),
    -- Unknown asset_type/timeframe: assume an expensive trade rather than a free one.
    0.100
  );
$$;

COMMENT ON FUNCTION public.get_est_cost_r(text, text) IS
'Provisional estimated round-trip cost in R. Falls back to a deliberately pessimistic
0.100R when the asset_type/timeframe pair is unknown: an unmodelled combination must
never look cheaper than a modelled one.';

-- ============================================================
-- PART 2: KILL SWITCH — cell_status
-- ============================================================
CREATE TABLE public.cell_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id text NOT NULL,
  timeframe text NOT NULL,
  asset_type text NOT NULL,
  -- Canonical direction vocabulary here is the HISTORICAL one: 'bullish' / 'bearish'.
  direction text NOT NULL CHECK (direction IN ('bullish','bearish')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  suspended_at timestamptz,
  suspended_reason text,
  reinstated_at timestamptz,
  reinstated_by uuid,
  forward_n integer NOT NULL DEFAULT 0,
  forward_expectancy_r numeric,
  last_evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pattern_id, timeframe, asset_type, direction)
);

GRANT SELECT ON public.cell_status TO anon;
GRANT SELECT ON public.cell_status TO authenticated;
GRANT ALL ON public.cell_status TO service_role;

ALTER TABLE public.cell_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cell status is publicly readable"
  ON public.cell_status FOR SELECT USING (true);

CREATE POLICY "Only admins can modify cell status"
  ON public.cell_status FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_cell_status_updated_at
  BEFORE UPDATE ON public.cell_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.cell_status IS
$c$Kill switch for pattern/timeframe/asset/direction cells.

Suspension is AUTOMATIC and requires no human decision: evaluate_cell_suspensions()
suspends a cell once at least 50 autopilot paper trades have resolved for it AND the
forward expectancy is negative. The threshold was fixed in advance, deliberately, so
that it cannot be renegotiated in the middle of a losing streak.

Reinstatement is MANUAL and deliberate. Nothing auto-reinstates on a bounce: a cell
that recovers must be re-enabled by an admin, who should record why.$c$;

CREATE OR REPLACE FUNCTION public.evaluate_cell_suspensions()
RETURNS TABLE(evaluated integer, newly_suspended integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_evaluated integer := 0;
  v_suspended integer := 0;
BEGIN
  WITH fwd AS (
    SELECT
      pt.pattern_id,
      pt.timeframe,
      lower(pt.asset_type) AS asset_type,
      CASE lower(pt.trade_type)
        WHEN 'long'  THEN 'bullish'
        WHEN 'short' THEN 'bearish'
        ELSE lower(pt.trade_type)
      END AS direction,
      COUNT(*)::int      AS forward_n,
      ROUND(AVG(pt.outcome_r)::numeric, 3) AS forward_expectancy_r
    FROM public.paper_trades pt
    WHERE pt.source = 'edge_alert_autopilot'
      AND pt.outcome_r IS NOT NULL
      AND pt.pattern_id IS NOT NULL
      AND pt.timeframe IS NOT NULL
      AND pt.asset_type IS NOT NULL
      AND lower(pt.trade_type) IN ('long','short','bullish','bearish')
    GROUP BY 1,2,3,4
  ), upserted AS (
    INSERT INTO public.cell_status AS cs
      (pattern_id, timeframe, asset_type, direction, forward_n, forward_expectancy_r, last_evaluated_at,
       status, suspended_at, suspended_reason)
    SELECT
      f.pattern_id, f.timeframe, f.asset_type, f.direction, f.forward_n, f.forward_expectancy_r, now(),
      CASE WHEN f.forward_n >= 50 AND f.forward_expectancy_r < 0 THEN 'suspended' ELSE 'active' END,
      CASE WHEN f.forward_n >= 50 AND f.forward_expectancy_r < 0 THEN now() END,
      CASE WHEN f.forward_n >= 50 AND f.forward_expectancy_r < 0
           THEN format('Forward results contradicted the backtest: %s resolved autopilot trades, forward expectancy %sR.',
                       f.forward_n, f.forward_expectancy_r)
      END
    FROM fwd f
    ON CONFLICT (pattern_id, timeframe, asset_type, direction) DO UPDATE
      SET forward_n = EXCLUDED.forward_n,
          forward_expectancy_r = EXCLUDED.forward_expectancy_r,
          last_evaluated_at = now(),
          -- Suspend automatically; never auto-reinstate.
          status = CASE
                     WHEN cs.status = 'suspended' THEN 'suspended'
                     WHEN EXCLUDED.forward_n >= 50 AND EXCLUDED.forward_expectancy_r < 0 THEN 'suspended'
                     ELSE 'active'
                   END,
          suspended_at = CASE
                           WHEN cs.status = 'suspended' THEN cs.suspended_at
                           WHEN EXCLUDED.forward_n >= 50 AND EXCLUDED.forward_expectancy_r < 0 THEN now()
                           ELSE NULL
                         END,
          suspended_reason = CASE
                               WHEN cs.status = 'suspended' THEN cs.suspended_reason
                               WHEN EXCLUDED.forward_n >= 50 AND EXCLUDED.forward_expectancy_r < 0
                                 THEN format('Forward results contradicted the backtest: %s resolved autopilot trades, forward expectancy %sR.',
                                             EXCLUDED.forward_n, EXCLUDED.forward_expectancy_r)
                               ELSE NULL
                             END
    RETURNING (xmax = 0) AS inserted, cs.status
  )
  SELECT COUNT(*)::int, COUNT(*) FILTER (WHERE status = 'suspended')::int
    INTO v_evaluated, v_suspended
  FROM upserted;

  RETURN QUERY SELECT v_evaluated, v_suspended;
END;
$$;
