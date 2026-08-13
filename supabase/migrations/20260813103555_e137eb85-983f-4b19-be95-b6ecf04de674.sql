ALTER TABLE public.data_health_results
  ADD COLUMN IF NOT EXISTS notified boolean NOT NULL DEFAULT false;