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
  SELECT min(o.detected_at) INTO v_from
  FROM public.historical_pattern_occurrences o
  WHERE o.detected_at >= p_since
    AND (p_force OR o.multi_rr_computed_at IS NULL)
    AND o.entry_price IS NOT NULL AND o.stop_loss_price IS NOT NULL
    AND o.entry_price <> o.stop_loss_price;

  IF v_from IS NULL THEN
    RETURN 0;
  END IF;

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

  v_to := COALESCE(v_to, v_from) + interval '1 microsecond';

  -- One UPDATE for all geometries: these rows carry a large `bars` jsonb payload,
  -- so each separate UPDATE rewrites the whole row. Doing six passes was the
  -- dominant cost; this writes every column once.
  WITH r1   AS (SELECT * FROM public.recompute_outcomes_at_rr(1.0, NULL, p_since, v_from, v_to)),
       r15  AS (SELECT * FROM public.recompute_outcomes_at_rr(1.5, NULL, p_since, v_from, v_to)),
       r3   AS (SELECT * FROM public.recompute_outcomes_at_rr(3.0, NULL, p_since, v_from, v_to)),
       r4   AS (SELECT * FROM public.recompute_outcomes_at_rr(4.0, NULL, p_since, v_from, v_to)),
       r5   AS (SELECT * FROM public.recompute_outcomes_at_rr(5.0, NULL, p_since, v_from, v_to)),
       ratr AS (SELECT * FROM public.recompute_outcomes_atr(2.0, NULL, p_since, v_from, v_to)),
       j AS (
         SELECT r1.occurrence_id,
                r1.outcome o1,   r1.pnl_percent p1,   r1.bars_to_outcome b1,
                r15.outcome o15, r15.pnl_percent p15, r15.bars_to_outcome b15,
                r3.outcome o3,   r3.pnl_percent p3,   r3.bars_to_outcome b3,
                r4.outcome o4,   r4.pnl_percent p4,   r4.bars_to_outcome b4,
                r5.outcome o5,   r5.pnl_percent p5,   r5.bars_to_outcome b5,
                ratr.outcome oa, ratr.pnl_percent pa, ratr.bars_to_outcome ba,
                ratr.atr_value av, ratr.target_r atr_r
         FROM r1
         JOIN r15  USING (occurrence_id)
         JOIN r3   USING (occurrence_id)
         JOIN r4   USING (occurrence_id)
         JOIN r5   USING (occurrence_id)
         JOIN ratr USING (occurrence_id)
       )
  UPDATE public.historical_pattern_occurrences o
  SET outcome_rr1 = j.o1,   outcome_pnl_percent_rr1 = j.p1,   bars_to_outcome_rr1 = j.b1,
      outcome_rr1_5 = j.o15, outcome_pnl_percent_rr1_5 = j.p15, bars_to_outcome_rr1_5 = j.b15,
      outcome_rr3 = j.o3,   outcome_pnl_percent_rr3 = j.p3,   bars_to_outcome_rr3 = j.b3,
      outcome_rr4 = j.o4,   outcome_pnl_percent_rr4 = j.p4,   bars_to_outcome_rr4 = j.b4,
      outcome_rr5 = j.o5,   outcome_pnl_percent_rr5 = j.p5,   bars_to_outcome_rr5 = j.b5,
      outcome_atr = j.oa,   outcome_pnl_percent_atr = j.pa,   bars_to_outcome_atr = j.ba,
      atr_value = j.av, atr_multiple = 2, atr_target_r = j.atr_r,
      multi_rr_computed_at = now()
  FROM j
  WHERE o.id = j.occurrence_id;

  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_multi_rr_batch(integer, date, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_multi_rr_batch(integer, date, boolean) TO service_role, postgres;