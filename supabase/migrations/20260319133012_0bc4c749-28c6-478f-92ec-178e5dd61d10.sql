
ALTER TABLE public.alerts_log 
  ADD COLUMN IF NOT EXISTS mfe_r numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mae_r numeric DEFAULT 0;

COMMENT ON COLUMN public.alerts_log.mfe_r IS 'Max Favorable Excursion in R-multiples (best unrealized profit during monitoring)';
COMMENT ON COLUMN public.alerts_log.mae_r IS 'Max Adverse Excursion in R-multiples (worst unrealized loss during monitoring)';
