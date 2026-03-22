
ALTER TABLE public.master_plans
  ADD COLUMN IF NOT EXISTS mtf_required_timeframes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mtf_min_aligned integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS min_agent_score integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trend_context_filter text DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS min_confluence_score integer DEFAULT NULL;

COMMENT ON COLUMN public.master_plans.mtf_required_timeframes IS 'Timeframes to check for MTF alignment e.g. ["1h","4h","1d"]';
COMMENT ON COLUMN public.master_plans.mtf_min_aligned IS 'Minimum number of timeframes that must agree on trend direction';
COMMENT ON COLUMN public.master_plans.min_agent_score IS 'Minimum agent composite score (0-100) to take a trade';
COMMENT ON COLUMN public.master_plans.trend_context_filter IS 'with_trend, counter_trend, or any';
COMMENT ON COLUMN public.master_plans.min_confluence_score IS 'Minimum confluence score (0-100) from contextual analysis';
