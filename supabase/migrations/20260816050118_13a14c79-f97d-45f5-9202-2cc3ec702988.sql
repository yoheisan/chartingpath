ALTER TABLE public.master_plans
  ADD COLUMN IF NOT EXISTS pool_timeframes text[] NOT NULL DEFAULT '{}';