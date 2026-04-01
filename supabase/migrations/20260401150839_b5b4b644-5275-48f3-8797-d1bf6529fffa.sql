
-- 1. Add override_constraints to master_plans
ALTER TABLE public.master_plans
ADD COLUMN IF NOT EXISTS override_constraints jsonb DEFAULT NULL;

-- 2. Backfill source on paper_trades
UPDATE public.paper_trades
SET source = 'copilot'
WHERE source IS NULL;

-- 3. Create get_override_comparison RPC function
CREATE OR REPLACE FUNCTION public.get_override_comparison(
  p_user_id uuid,
  p_days int DEFAULT 7
)
RETURNS TABLE (
  copilot_trades bigint,
  copilot_r numeric,
  override_trades bigint,
  override_r numeric,
  gap numeric,
  worst_override_symbol text,
  worst_override_pattern text,
  worst_override_r numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    COUNT(*) FILTER (WHERE source = 'copilot') AS copilot_trades,
    COALESCE(SUM(outcome_r) FILTER (WHERE source = 'copilot'), 0) AS copilot_r,
    COUNT(*) FILTER (WHERE source = 'override') AS override_trades,
    COALESCE(SUM(outcome_r) FILTER (WHERE source = 'override'), 0) AS override_r,
    COALESCE(SUM(outcome_r) FILTER (WHERE source = 'copilot'), 0) -
    COALESCE(SUM(outcome_r) FILTER (WHERE source = 'override'), 0) AS gap,
    (SELECT symbol FROM public.paper_trades pt2
     WHERE pt2.user_id = p_user_id
     AND pt2.source = 'override'
     AND pt2.status = 'closed'
     AND pt2.closed_at > now() - (p_days || ' days')::interval
     ORDER BY pt2.outcome_r ASC LIMIT 1) AS worst_override_symbol,
    (SELECT pt2.setup_type FROM public.paper_trades pt2
     WHERE pt2.user_id = p_user_id
     AND pt2.source = 'override'
     AND pt2.status = 'closed'
     AND pt2.closed_at > now() - (p_days || ' days')::interval
     ORDER BY pt2.outcome_r ASC LIMIT 1) AS worst_override_pattern,
    (SELECT pt2.outcome_r FROM public.paper_trades pt2
     WHERE pt2.user_id = p_user_id
     AND pt2.source = 'override'
     AND pt2.status = 'closed'
     AND pt2.closed_at > now() - (p_days || ' days')::interval
     ORDER BY pt2.outcome_r ASC LIMIT 1) AS worst_override_r
  FROM public.paper_trades
  WHERE user_id = p_user_id
  AND status = 'closed'
  AND closed_at > now() - (p_days || ' days')::interval;
$$;
