
-- Insert missing paper portfolio for the active user
INSERT INTO public.paper_portfolios (user_id)
VALUES ('584ebfae-fac6-4a07-8e06-935e3e282b67')
ON CONFLICT DO NOTHING;

-- Attach the existing initialize_paper_portfolio trigger to master_plans
-- so future plan creation auto-creates a portfolio
CREATE OR REPLACE FUNCTION public.ensure_paper_portfolio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.paper_portfolios (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_paper_portfolio ON public.master_plans;
CREATE TRIGGER trg_ensure_paper_portfolio
  AFTER INSERT ON public.master_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_paper_portfolio();
