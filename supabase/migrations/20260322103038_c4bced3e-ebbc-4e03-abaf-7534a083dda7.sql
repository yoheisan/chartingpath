ALTER TABLE public.master_plans
  ADD COLUMN IF NOT EXISTS name text DEFAULT 'My Trading Plan',
  ADD COLUMN IF NOT EXISTS plan_order integer DEFAULT 0;

COMMENT ON COLUMN public.master_plans.name IS 'User-facing plan name e.g. Momentum Breakouts';
COMMENT ON COLUMN public.master_plans.plan_order IS 'Display sort order';