
-- Backfill function for live_pattern_detections
CREATE OR REPLACE FUNCTION public.backfill_exchange_live_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.live_pattern_detections lpd
  SET exchange = i.exchange
  FROM public.instruments i
  WHERE lpd.instrument = i.symbol
    AND lpd.exchange IS NULL;
END;
$$;

-- Backfill function for historical_pattern_occurrences
CREATE OR REPLACE FUNCTION public.backfill_exchange_historical_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.historical_pattern_occurrences hpo
  SET exchange = i.exchange
  FROM public.instruments i
  WHERE hpo.symbol = i.symbol
    AND hpo.exchange IS NULL;
END;
$$;
