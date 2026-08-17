-- FIX 1 + FIX 2: execution_status classification for historical pattern occurrences

ALTER TABLE public.historical_pattern_occurrences
  ADD COLUMN IF NOT EXISTS execution_status text NOT NULL DEFAULT 'valid';

ALTER TABLE public.historical_pattern_occurrences
  DROP CONSTRAINT IF EXISTS historical_pattern_occurrences_execution_status_chk;
ALTER TABLE public.historical_pattern_occurrences
  ADD CONSTRAINT historical_pattern_occurrences_execution_status_chk
  CHECK (execution_status IN ('valid','gapped_through_stop','gapped_past_target','no_next_bar','invalid_risk_distance'));

-- Classifier shared by the backfill and the write-time trigger.
CREATE OR REPLACE FUNCTION public.classify_execution_status(
  p_direction text, p_entry numeric, p_sl numeric, p_tp numeric, p_exec_entry numeric,
  p_execution_computed_at timestamptz)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- A stop this close to entry is not a tradable setup; the R denominator explodes.
    WHEN p_entry IS NULL OR p_sl IS NULL OR p_entry = 0
      OR abs(p_entry - p_sl) / abs(p_entry) < 0.001 THEN 'invalid_risk_distance'
    WHEN p_exec_entry IS NULL THEN
      CASE WHEN p_execution_computed_at IS NULL THEN 'valid' ELSE 'no_next_bar' END
    WHEN (lower(p_direction) IN ('long','bullish','buy') AND p_exec_entry <= p_sl)
      OR (lower(p_direction) NOT IN ('long','bullish','buy') AND p_exec_entry >= p_sl)
      THEN 'gapped_through_stop'
    WHEN p_tp IS NOT NULL AND (
        (lower(p_direction) IN ('long','bullish','buy') AND p_exec_entry >= p_tp)
     OR (lower(p_direction) NOT IN ('long','bullish','buy') AND p_exec_entry <= p_tp))
      THEN 'gapped_past_target'
    ELSE 'valid'
  END;
$$;

-- Backfill (rows that are not plain 'valid' only)
UPDATE public.historical_pattern_occurrences o
SET execution_status = public.classify_execution_status(
    o.direction, o.entry_price, o.stop_loss_price, o.take_profit_price,
    o.execution_entry_price, o.execution_computed_at)
WHERE public.classify_execution_status(
    o.direction, o.entry_price, o.stop_loss_price, o.take_profit_price,
    o.execution_entry_price, o.execution_computed_at) <> o.execution_status;

CREATE INDEX IF NOT EXISTS idx_hpo_execution_status
  ON public.historical_pattern_occurrences (execution_status);

-- Write-time guard: reject sub-0.1% risk distances outright, and keep the
-- execution_status classification in sync on every write.
CREATE OR REPLACE FUNCTION public.guard_occurrence_risk_distance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.entry_price IS NULL OR NEW.stop_loss_price IS NULL OR NEW.entry_price = 0
     OR abs(NEW.entry_price - NEW.stop_loss_price) / abs(NEW.entry_price) < 0.001 THEN
    RAISE EXCEPTION 'Rejected occurrence: risk distance below 0.1%% of entry (entry=%, stop=%)',
      NEW.entry_price, NEW.stop_loss_price
      USING ERRCODE = 'check_violation';
  END IF;

  NEW.execution_status := public.classify_execution_status(
    NEW.direction, NEW.entry_price, NEW.stop_loss_price, NEW.take_profit_price,
    NEW.execution_entry_price, NEW.execution_computed_at);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_occurrence_risk_distance ON public.historical_pattern_occurrences;
CREATE TRIGGER trg_guard_occurrence_risk_distance
  BEFORE INSERT OR UPDATE OF entry_price, stop_loss_price, take_profit_price,
                             execution_entry_price, execution_computed_at, direction
  ON public.historical_pattern_occurrences
  FOR EACH ROW EXECUTE FUNCTION public.guard_occurrence_risk_distance();