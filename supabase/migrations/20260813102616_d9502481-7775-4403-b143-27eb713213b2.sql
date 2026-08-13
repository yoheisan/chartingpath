ALTER TABLE public.paper_trades
  ADD COLUMN IF NOT EXISTS initial_stop_loss numeric;

UPDATE public.paper_trades
SET initial_stop_loss = stop_loss
WHERE initial_stop_loss IS NULL;

CREATE OR REPLACE FUNCTION public.guard_paper_trade_exit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  entry numeric;
  sl numeric;
  base_sl numeric;
  tp numeric;
  risk numeric;
  is_long boolean;
  move numeric;
  reason text;
  tol numeric;
BEGIN
  IF NEW.initial_stop_loss IS NULL THEN
    NEW.initial_stop_loss := NEW.stop_loss;
  END IF;

  IF NEW.status IS DISTINCT FROM 'closed' OR NEW.exit_price IS NULL THEN
    RETURN NEW;
  END IF;

  entry := NEW.entry_price;
  sl := NEW.stop_loss;
  base_sl := coalesce(NEW.initial_stop_loss, NEW.stop_loss);
  tp := NEW.take_profit;
  reason := lower(coalesce(NEW.close_reason, ''));
  is_long := NEW.trade_type IN ('long', 'buy');
  risk := abs(coalesce(entry, 0) - coalesce(base_sl, 0));

  IF reason LIKE 'stop loss hit%' AND sl IS NOT NULL THEN
    tol := abs(sl) * 0.02;
    IF abs(NEW.exit_price - sl) > tol THEN
      NEW.data_quality_suspect := true;
      NEW.exit_price := sl;
    END IF;
    NEW.outcome_r := -1;
  ELSIF reason LIKE 'take profit hit%' AND tp IS NOT NULL THEN
    tol := abs(tp) * 0.02;
    IF abs(NEW.exit_price - tp) > tol THEN
      NEW.data_quality_suspect := true;
      NEW.exit_price := tp;
    END IF;
    IF risk > 0 THEN
      NEW.outcome_r := round(abs(tp - entry) / risk, 2);
    ELSE
      NEW.data_quality_suspect := true;
      NEW.outcome_r := NULL;
    END IF;
  ELSE
    IF entry IS NOT NULL AND entry <> 0 AND abs(NEW.exit_price - entry) / abs(entry) > 0.5 THEN
      NEW.data_quality_suspect := true;
    END IF;
    IF risk > 0 THEN
      move := CASE WHEN is_long THEN NEW.exit_price - entry ELSE entry - NEW.exit_price END;
      NEW.outcome_r := round(move / risk, 2);
    ELSE
      NEW.data_quality_suspect := true;
      NEW.outcome_r := NULL;
    END IF;
  END IF;

  -- A loss worse than 1R is impossible: the stop would have executed first.
  IF NEW.outcome_r IS NOT NULL AND NEW.outcome_r < -1.05 THEN
    NEW.data_quality_suspect := true;
    NEW.outcome_r := -1;
    IF base_sl IS NOT NULL THEN
      NEW.exit_price := base_sl;
    END IF;
  END IF;

  IF NEW.outcome_r IS NOT NULL AND NEW.outcome_r > 10 THEN
    NEW.data_quality_suspect := true;
  END IF;

  NEW.outcome := CASE
    WHEN NEW.outcome_r IS NULL THEN NEW.outcome
    WHEN NEW.outcome_r >= 0 THEN 'win'
    ELSE 'loss'
  END;

  RETURN NEW;
END;
$$;