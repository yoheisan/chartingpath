ALTER TABLE public.alerts
  ADD COLUMN IF NOT EXISTS master_plan_id uuid REFERENCES public.master_plans(id);