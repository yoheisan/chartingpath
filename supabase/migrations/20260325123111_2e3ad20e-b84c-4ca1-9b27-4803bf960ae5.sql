ALTER TABLE public.master_plans 
ADD COLUMN IF NOT EXISTS trading_schedules jsonb DEFAULT '{}'::jsonb;