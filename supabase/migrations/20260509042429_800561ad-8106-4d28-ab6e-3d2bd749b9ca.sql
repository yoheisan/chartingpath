
-- Plan validation gate: refuse to activate a Trading Plan that has no quality filter.
-- Universal — applies to all users.
CREATE OR REPLACE FUNCTION public.enforce_master_plan_quality_gate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active IS TRUE
     AND COALESCE(NEW.min_agent_score, 0)      < 50
     AND COALESCE(NEW.min_confluence_score, 0) < 50
     AND COALESCE(NEW.mtf_min_aligned, 0)      < 1
  THEN
    RAISE EXCEPTION
      'Trading Plan needs at least one quality filter before it can be activated: min_agent_score >= 50, min_confluence_score >= 50, or mtf_min_aligned >= 1.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_master_plan_quality_gate ON public.master_plans;
CREATE TRIGGER trg_master_plan_quality_gate
BEFORE INSERT OR UPDATE ON public.master_plans
FOR EACH ROW
EXECUTE FUNCTION public.enforce_master_plan_quality_gate();
