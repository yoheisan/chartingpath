DROP FUNCTION IF EXISTS public.recompute_outcomes_at_rr(numeric, integer, date, uuid[]);
DROP FUNCTION IF EXISTS public.recompute_outcomes_atr(numeric, integer, date, uuid[]);
DROP FUNCTION IF EXISTS public.recompute_multi_rr_batch(integer, date, boolean);

CREATE OR REPLACE FUNCTION public.recompute_outcomes_at_rr(
  p_target_r numeric,
  p_limit integer DEFAULT NULL,
  p_since date DEFAULT '2024-01-01',
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  occurrence_id uuid,
  outcome text,
  bars_to_outcome integer,
  pnl_percent numeric,
  r_multiple numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH occ AS (
    SELECT
      o.id, o.symbol, o.timeframe, o.detected_at, o.entry_price, o.stop_loss_price,
      (o.direction IN ('bullish','long')) AS is_long,
      CASE WHEN o.direction IN ('bullish','long') THEN 1 ELSE -1 END AS dir_sign,
      abs(o.entry_price - o.stop_loss_price) AS risk
    FROM public.historical_pattern_occurrences o
    WHERE o.detected_at >= p_since
      AND (p_from IS NULL OR o.detected_at >= p_from)
      AND (p_to   IS NULL OR o.detected_at <  p_to)
      AND o.entry_price IS NOT NULL
      AND o.stop_loss_price IS NOT NULL
      AND o.entry_price <> o.stop_loss_price
    ORDER BY o.detected_at
    LIMIT p_limit
  ),
  t AS (
    SELECT occ.*,
           CASE WHEN occ.is_long
                THEN occ.entry_price + p_target_r * occ.risk
                ELSE occ.entry_price - p_target_r * occ.risk
           END AS tp
    FROM occ
  )
  SELECT
    t.id,
    COALESCE(h.kind, 'timeout'),
    COALESCE(h.rn, lb.n, 0)::int,
    CASE WHEN h.kind IS NULL AND lb.last_close IS NULL THEN NULL
         ELSE t.dir_sign * ((CASE h.kind
                               WHEN 'hit_sl' THEN t.stop_loss_price
                               WHEN 'hit_tp' THEN t.tp
                               ELSE lb.last_close END) - t.entry_price) / t.entry_price * 100 END,
    CASE WHEN h.kind IS NULL AND lb.last_close IS NULL THEN NULL
         ELSE t.dir_sign * ((CASE h.kind
                               WHEN 'hit_sl' THEN t.stop_loss_price
                               WHEN 'hit_tp' THEN t.tp
                               ELSE lb.last_close END) - t.entry_price) / t.risk END
  FROM t
  LEFT JOIN LATERAL (
    SELECT s.rn, s.kind
    FROM (
      SELECT
        row_number() OVER (ORDER BY p.date) AS rn,
        -- PESSIMISTIC SAME-BAR RULE: the stop is tested FIRST, so a bar whose
        -- high/low spans BOTH the target and the stop resolves as 'hit_sl'.
        -- Intra-bar sequence is unknowable from OHLC, and assuming the
        -- favourable leg came first is exactly the optimism that makes
        -- backtests lie. Do not reorder these branches.
        CASE
          WHEN (t.is_long AND p.low <= t.stop_loss_price)
            OR (NOT t.is_long AND p.high >= t.stop_loss_price) THEN 'hit_sl'
          WHEN (t.is_long AND p.high >= t.tp)
            OR (NOT t.is_long AND p.low <= t.tp)               THEN 'hit_tp'
        END AS kind
      FROM (
        SELECT hp.date, hp.high, hp.low
        FROM public.historical_prices hp
        WHERE hp.symbol = t.symbol AND hp.timeframe = t.timeframe
          AND hp.date > t.detected_at   -- strictly after detection: no look-ahead
        ORDER BY hp.date
        LIMIT 100
      ) p
    ) s
    WHERE s.kind IS NOT NULL
    ORDER BY s.rn
    LIMIT 1
  ) h ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::int AS n, (array_agg(q.close ORDER BY q.date DESC))[1] AS last_close
    FROM (
      SELECT hp.date, hp.close
      FROM public.historical_prices hp
      WHERE hp.symbol = t.symbol AND hp.timeframe = t.timeframe
        AND hp.date > t.detected_at
      ORDER BY hp.date
      LIMIT 100
    ) q
  ) lb ON true;
$$;

CREATE OR REPLACE FUNCTION public.recompute_outcomes_atr(
  p_atr_multiple numeric DEFAULT 2,
  p_limit integer DEFAULT NULL,
  p_since date DEFAULT '2024-01-01',
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  occurrence_id uuid,
  outcome text,
  bars_to_outcome integer,
  pnl_percent numeric,
  r_multiple numeric,
  atr_value numeric,
  target_r numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH occ AS (
    SELECT
      o.id, o.symbol, o.timeframe, o.detected_at, o.entry_price, o.stop_loss_price,
      (o.direction IN ('bullish','long')) AS is_long,
      CASE WHEN o.direction IN ('bullish','long') THEN 1 ELSE -1 END AS dir_sign,
      abs(o.entry_price - o.stop_loss_price) AS risk
    FROM public.historical_pattern_occurrences o
    WHERE o.detected_at >= p_since
      AND (p_from IS NULL OR o.detected_at >= p_from)
      AND (p_to   IS NULL OR o.detected_at <  p_to)
      AND o.entry_price IS NOT NULL
      AND o.stop_loss_price IS NOT NULL
      AND o.entry_price <> o.stop_loss_price
    ORDER BY o.detected_at
    LIMIT p_limit
  ),
  t AS (
    SELECT occ.*, a.atr,
           CASE WHEN occ.is_long
                THEN occ.entry_price + p_atr_multiple * a.atr
                ELSE occ.entry_price - p_atr_multiple * a.atr END AS tp
    FROM occ
    LEFT JOIN LATERAL (
      SELECT avg(y.tr) AS atr
      FROM (
        SELECT GREATEST(
                 x.high - x.low,
                 abs(x.high - lag(x.close) OVER (ORDER BY x.date)),
                 abs(x.low  - lag(x.close) OVER (ORDER BY x.date))
               ) AS tr
        FROM (
          SELECT hp.date, hp.high, hp.low, hp.close
          FROM public.historical_prices hp
          WHERE hp.symbol = occ.symbol AND hp.timeframe = occ.timeframe
            AND hp.date <= occ.detected_at   -- pre-detection bars only
          ORDER BY hp.date DESC
          LIMIT 15
        ) x
      ) y
      WHERE y.tr IS NOT NULL
    ) a ON true
  )
  SELECT
    t.id,
    COALESCE(h.kind, 'timeout'),
    COALESCE(h.rn, lb.n, 0)::int,
    CASE WHEN t.atr IS NULL OR (h.kind IS NULL AND lb.last_close IS NULL) THEN NULL
         ELSE t.dir_sign * ((CASE h.kind
                               WHEN 'hit_sl' THEN t.stop_loss_price
                               WHEN 'hit_tp' THEN t.tp
                               ELSE lb.last_close END) - t.entry_price) / t.entry_price * 100 END,
    CASE WHEN t.atr IS NULL OR (h.kind IS NULL AND lb.last_close IS NULL) THEN NULL
         ELSE t.dir_sign * ((CASE h.kind
                               WHEN 'hit_sl' THEN t.stop_loss_price
                               WHEN 'hit_tp' THEN t.tp
                               ELSE lb.last_close END) - t.entry_price) / t.risk END,
    t.atr,
    CASE WHEN t.atr IS NULL THEN NULL ELSE (p_atr_multiple * t.atr) / t.risk END
  FROM t
  LEFT JOIN LATERAL (
    SELECT s.rn, s.kind
    FROM (
      SELECT row_number() OVER (ORDER BY p.date) AS rn,
             -- Same pessimistic same-bar rule: stop first, so a bar spanning
             -- both levels is recorded as a loss.
             CASE
               WHEN (t.is_long AND p.low <= t.stop_loss_price)
                 OR (NOT t.is_long AND p.high >= t.stop_loss_price) THEN 'hit_sl'
               WHEN (t.is_long AND p.high >= t.tp)
                 OR (NOT t.is_long AND p.low <= t.tp)               THEN 'hit_tp'
             END AS kind
      FROM (
        SELECT hp.date, hp.high, hp.low
        FROM public.historical_prices hp
        WHERE hp.symbol = t.symbol AND hp.timeframe = t.timeframe
          AND hp.date > t.detected_at
        ORDER BY hp.date
        LIMIT 100
      ) p
    ) s
    WHERE s.kind IS NOT NULL
    ORDER BY s.rn
    LIMIT 1
  ) h ON true
  LEFT JOIN LATERAL (
    SELECT count(*)::int AS n, (array_agg(q.close ORDER BY q.date DESC))[1] AS last_close
    FROM (
      SELECT hp.date, hp.close
      FROM public.historical_prices hp
      WHERE hp.symbol = t.symbol AND hp.timeframe = t.timeframe
        AND hp.date > t.detected_at
      ORDER BY hp.date
      LIMIT 100
    ) q
  ) lb ON true;
$$;

CREATE OR REPLACE FUNCTION public.recompute_multi_rr_batch(
  p_batch_size integer DEFAULT 5000,
  p_since date DEFAULT '2024-01-01',
  p_force boolean DEFAULT false
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from timestamptz;
  v_to   timestamptz;
  v_n    integer;
BEGIN
  -- Resumable cursor: start just after the newest already-computed row.
  SELECT min(o.detected_at) INTO v_from
  FROM public.historical_pattern_occurrences o
  WHERE o.detected_at >= p_since
    AND (p_force OR o.multi_rr_computed_at IS NULL)
    AND o.entry_price IS NOT NULL AND o.stop_loss_price IS NOT NULL
    AND o.entry_price <> o.stop_loss_price;

  IF v_from IS NULL THEN
    RETURN 0;
  END IF;

  -- Window end = detected_at of the row p_batch_size ahead, so chunks stay
  -- index-friendly. NULL means "rest of history".
  SELECT max(s.detected_at) INTO v_to
  FROM (
    SELECT o.detected_at
    FROM public.historical_pattern_occurrences o
    WHERE o.detected_at >= v_from
      AND o.entry_price IS NOT NULL AND o.stop_loss_price IS NOT NULL
      AND o.entry_price <> o.stop_loss_price
    ORDER BY o.detected_at
    LIMIT p_batch_size
  ) s;

  -- Always advance past ties on the boundary timestamp.
  v_to := COALESCE(v_to, v_from) + interval '1 microsecond';

  UPDATE public.historical_pattern_occurrences o
  SET outcome_rr1 = r.outcome, outcome_pnl_percent_rr1 = r.pnl_percent, bars_to_outcome_rr1 = r.bars_to_outcome
  FROM public.recompute_outcomes_at_rr(1.0, NULL, p_since, v_from, v_to) r WHERE o.id = r.occurrence_id;

  UPDATE public.historical_pattern_occurrences o
  SET outcome_rr1_5 = r.outcome, outcome_pnl_percent_rr1_5 = r.pnl_percent, bars_to_outcome_rr1_5 = r.bars_to_outcome
  FROM public.recompute_outcomes_at_rr(1.5, NULL, p_since, v_from, v_to) r WHERE o.id = r.occurrence_id;

  UPDATE public.historical_pattern_occurrences o
  SET outcome_rr3 = r.outcome, outcome_pnl_percent_rr3 = r.pnl_percent, bars_to_outcome_rr3 = r.bars_to_outcome
  FROM public.recompute_outcomes_at_rr(3.0, NULL, p_since, v_from, v_to) r WHERE o.id = r.occurrence_id;

  UPDATE public.historical_pattern_occurrences o
  SET outcome_rr4 = r.outcome, outcome_pnl_percent_rr4 = r.pnl_percent, bars_to_outcome_rr4 = r.bars_to_outcome
  FROM public.recompute_outcomes_at_rr(4.0, NULL, p_since, v_from, v_to) r WHERE o.id = r.occurrence_id;

  UPDATE public.historical_pattern_occurrences o
  SET outcome_rr5 = r.outcome, outcome_pnl_percent_rr5 = r.pnl_percent, bars_to_outcome_rr5 = r.bars_to_outcome
  FROM public.recompute_outcomes_at_rr(5.0, NULL, p_since, v_from, v_to) r WHERE o.id = r.occurrence_id;

  UPDATE public.historical_pattern_occurrences o
  SET outcome_atr = r.outcome, outcome_pnl_percent_atr = r.pnl_percent, bars_to_outcome_atr = r.bars_to_outcome,
      atr_value = r.atr_value, atr_multiple = 2, atr_target_r = r.target_r
  FROM public.recompute_outcomes_atr(2.0, NULL, p_since, v_from, v_to) r WHERE o.id = r.occurrence_id;

  UPDATE public.historical_pattern_occurrences o
  SET multi_rr_computed_at = now()
  WHERE o.detected_at >= v_from AND o.detected_at < v_to
    AND o.entry_price IS NOT NULL AND o.stop_loss_price IS NOT NULL
    AND o.entry_price <> o.stop_loss_price;

  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_outcomes_at_rr(numeric, integer, date, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_outcomes_atr(numeric, integer, date, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recompute_multi_rr_batch(integer, date, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_outcomes_at_rr(numeric, integer, date, timestamptz, timestamptz) TO service_role, postgres, supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.recompute_outcomes_atr(numeric, integer, date, timestamptz, timestamptz) TO service_role, postgres, supabase_read_only_user;
GRANT EXECUTE ON FUNCTION public.recompute_multi_rr_batch(integer, date, boolean) TO service_role, postgres;