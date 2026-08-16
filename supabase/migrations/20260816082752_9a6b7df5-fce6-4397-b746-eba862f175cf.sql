-- 1. Execution-entry measurement columns (additive; close-entry columns untouched)
ALTER TABLE public.historical_pattern_occurrences
  ADD COLUMN IF NOT EXISTS execution_entry_price numeric,
  ADD COLUMN IF NOT EXISTS execution_gap_r numeric,
  ADD COLUMN IF NOT EXISTS outcome_exec text,
  ADD COLUMN IF NOT EXISTS bars_to_outcome_exec integer,
  ADD COLUMN IF NOT EXISTS execution_computed_at timestamptz;

COMMENT ON COLUMN public.historical_pattern_occurrences.execution_entry_price IS
  'Open of the first bar AFTER detected_at. What a trader could actually transact at; entry_price is the confirming bar close, which is not achievable in practice.';
COMMENT ON COLUMN public.historical_pattern_occurrences.execution_gap_r IS
  'Signed gap between execution entry and close entry, in units of the original risk distance. Positive = adverse.';

CREATE INDEX IF NOT EXISTS idx_hpo_exec_pending
  ON public.historical_pattern_occurrences (detected_at)
  WHERE execution_computed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hpo_outcome_exec
  ON public.historical_pattern_occurrences (pattern_id, timeframe, asset_type, direction)
  WHERE outcome_exec IN ('hit_tp','hit_sl');

-- 2. Batched, resumable execution-outcome computation
CREATE OR REPLACE FUNCTION public.compute_execution_outcomes(p_batch_size integer DEFAULT 20000)
RETURNS TABLE(processed integer, with_entry integer, resolved integer, skipped_no_bar integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_processed int := 0;
  v_with int := 0;
  v_res int := 0;
BEGIN
  CREATE TEMP TABLE _batch ON COMMIT DROP AS
  SELECT o.id, o.symbol, o.timeframe, o.detected_at,
         o.entry_price, o.stop_loss_price, o.take_profit_price,
         abs(o.entry_price - o.stop_loss_price) AS risk,
         coalesce(o.risk_reward_ratio,
                  CASE WHEN abs(o.entry_price - o.stop_loss_price) > 0
                       THEN abs(o.take_profit_price - o.entry_price)
                            / abs(o.entry_price - o.stop_loss_price) END) AS rr,
         (lower(o.direction) IN ('long','bullish','buy')) AS is_long
  FROM public.historical_pattern_occurrences o
  WHERE o.execution_computed_at IS NULL
  ORDER BY o.detected_at
  LIMIT p_batch_size;

  SELECT count(*) INTO v_processed FROM _batch;
  IF v_processed = 0 THEN
    RETURN QUERY SELECT 0,0,0,0; RETURN;
  END IF;

  -- Forward bars: the entry bar (rn = 1) plus the same 60-bar window used by
  -- the close-entry outcome. The entry bar's own range can already resolve.
  CREATE TEMP TABLE _fwd ON COMMIT DROP AS
  SELECT b.id, p.rn, p.open, p.high, p.low
  FROM _batch b
  JOIN LATERAL (
    SELECT hp.open, hp.high, hp.low,
           row_number() OVER (ORDER BY hp.date) AS rn
    FROM public.historical_prices hp
    WHERE hp.symbol = b.symbol
      AND hp.timeframe = b.timeframe
      AND hp.date > b.detected_at
    ORDER BY hp.date
    LIMIT 60
  ) p ON true;

  CREATE TEMP TABLE _lev ON COMMIT DROP AS
  SELECT b.id, b.is_long, b.risk, b.rr, b.entry_price,
         f.open AS exec_entry,
         CASE WHEN b.is_long THEN f.open - b.risk ELSE f.open + b.risk END AS exec_sl,
         CASE WHEN b.is_long THEN f.open + b.risk * b.rr ELSE f.open - b.risk * b.rr END AS exec_tp
  FROM _batch b
  JOIN _fwd f ON f.id = b.id AND f.rn = 1
  WHERE b.risk > 0 AND b.rr IS NOT NULL AND b.rr > 0;

  SELECT count(*) INTO v_with FROM _lev;

  CREATE TEMP TABLE _hit ON COMMIT DROP AS
  SELECT DISTINCT ON (h.id) h.id, h.rn,
         CASE WHEN h.sl THEN 'hit_sl' ELSE 'hit_tp' END AS outcome
  FROM (
    SELECT l.id, f.rn,
           CASE WHEN l.is_long THEN f.low <= l.exec_sl ELSE f.high >= l.exec_sl END AS sl,
           CASE WHEN l.is_long THEN f.high >= l.exec_tp ELSE f.low <= l.exec_tp END AS tp
    FROM _lev l
    JOIN _fwd f ON f.id = l.id
  ) h
  WHERE h.sl OR h.tp
  ORDER BY h.id, h.rn;  -- same-bar ambiguity resolves pessimistically to the stop

  SELECT count(*) INTO v_res FROM _hit;

  UPDATE public.historical_pattern_occurrences o
  SET execution_entry_price = l.exec_entry,
      execution_gap_r = round(
        (CASE WHEN l.is_long THEN l.exec_entry - l.entry_price
              ELSE l.entry_price - l.exec_entry END) / l.risk, 6),
      outcome_exec = coalesce(hh.outcome, 'timeout'),
      bars_to_outcome_exec = hh.rn,
      execution_computed_at = now()
  FROM _lev l
  LEFT JOIN _hit hh ON hh.id = l.id
  WHERE o.id = l.id;

  -- Rows with no subsequent bar (or unusable geometry): mark done so the
  -- backfill stays resumable and never re-scans them.
  UPDATE public.historical_pattern_occurrences o
  SET execution_computed_at = now()
  FROM _batch b
  WHERE o.id = b.id AND o.execution_computed_at IS NULL;

  RETURN QUERY SELECT v_processed, v_with, v_res, v_processed - v_with;
END;
$function$;

REVOKE ALL ON FUNCTION public.compute_execution_outcomes(integer) FROM anon, authenticated;

-- 3. cell_validation gains the entry assumption it was measured under
ALTER TABLE public.cell_validation
  ADD COLUMN IF NOT EXISTS entry_mode text NOT NULL DEFAULT 'close';

ALTER TABLE public.cell_validation
  ADD CONSTRAINT cell_validation_entry_mode_chk
  CHECK (entry_mode IN ('close','next_open'));

DROP INDEX IF EXISTS cell_validation_cell_window_uniq;
DROP INDEX IF EXISTS cell_validation_cell_test_end_uniq;

CREATE UNIQUE INDEX cell_validation_cell_window_uniq
  ON public.cell_validation (pattern_id, timeframe, asset_type, direction, entry_mode, test_start, test_end);
CREATE UNIQUE INDEX cell_validation_cell_test_end_uniq
  ON public.cell_validation (pattern_id, timeframe, asset_type, direction, entry_mode, test_end);