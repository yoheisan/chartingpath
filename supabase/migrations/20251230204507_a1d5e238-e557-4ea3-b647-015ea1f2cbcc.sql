-- =====================================================
-- PHASE 2: MANUS-LIKE PROJECTS INFRASTRUCTURE
-- Core workflow tables + Credits + Support + Analytics
-- =====================================================

-- 2.9 Multi-tenant (future B2B)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- 2.1 Core workflow tables
CREATE TYPE project_type AS ENUM (
  'setup_finder',
  'pattern_lab', 
  'portfolio_checkup',
  'portfolio_sim',
  'filings_watch'
);

CREATE TYPE project_run_status AS ENUM (
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled'
);

CREATE TYPE artifact_type AS ENUM (
  'setup_list',
  'backtest_report',
  'portfolio_report',
  'portfolio_sim',
  'filings_report'
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  type project_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  input_id UUID NOT NULL REFERENCES public.project_inputs(id) ON DELETE CASCADE,
  status project_run_status NOT NULL DEFAULT 'queued',
  credits_estimated INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_code TEXT,
  error_message TEXT,
  execution_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_run_id UUID NOT NULL REFERENCES public.project_runs(id) ON DELETE CASCADE,
  type artifact_type NOT NULL,
  artifact_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Credits / usage model
CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'elite', 'enterprise');

CREATE TABLE IF NOT EXISTS public.usage_credits (
  user_id UUID PRIMARY KEY,
  plan_tier plan_tier NOT NULL DEFAULT 'free',
  credits_balance INTEGER NOT NULL DEFAULT 100,
  credits_reset_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  daily_run_cap INTEGER NOT NULL DEFAULT 5,
  max_instruments_per_run INTEGER NOT NULL DEFAULT 10,
  max_lookback_years INTEGER NOT NULL DEFAULT 1,
  max_active_alerts INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_run_id UUID REFERENCES public.project_runs(id) ON DELETE SET NULL,
  credits_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Customer support / ticketing
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_category AS ENUM ('bug', 'feature', 'billing', 'account', 'other');

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  category ticket_category NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  context_json JSONB DEFAULT '{}'::jsonb,
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_user_message_at TIMESTAMPTZ,
  last_admin_message_at TIMESTAMPTZ
);

CREATE TYPE message_sender_type AS ENUM ('user', 'admin', 'system');

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type message_sender_type NOT NULL,
  sender_id UUID,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 Admin analytics + growth instrumentation
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  session_id TEXT,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_ts ON public.analytics_events(ts DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id) WHERE user_id IS NOT NULL;

-- 2.3 Pattern & execution objects
CREATE TABLE IF NOT EXISTS public.trade_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  instrument_symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  entry_type TEXT NOT NULL DEFAULT 'bar_close',
  entry_price NUMERIC NOT NULL,
  stop_price NUMERIC NOT NULL,
  take_profit_price NUMERIC NOT NULL,
  planned_rr NUMERIC NOT NULL,
  time_stop_bars INTEGER,
  stop_loss_method TEXT,
  take_profit_method TEXT,
  pattern_name TEXT,
  pattern_quality NUMERIC,
  execution_assumptions JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_artifact_id UUID REFERENCES public.artifacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for core tables
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(type);
CREATE INDEX IF NOT EXISTS idx_project_runs_status ON public.project_runs(status);
CREATE INDEX IF NOT EXISTS idx_project_runs_project ON public.project_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_run ON public.artifacts(project_run_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON public.artifacts(type);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_user ON public.usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_trade_plans_user ON public.trade_plans(user_id);

-- Enable RLS on all new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: members can view their orgs
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE org_id = organizations.id AND user_id = auth.uid()
  ));

CREATE POLICY "Org owners can manage organization"
  ON public.organizations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE org_id = organizations.id AND user_id = auth.uid() AND role = 'owner'
  ));

-- Organization members
CREATE POLICY "Users can view org members of their orgs"
  ON public.organization_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = organization_members.org_id AND om.user_id = auth.uid()
  ));

CREATE POLICY "Org admins can manage members"
  ON public.organization_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = organization_members.org_id 
    AND om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin')
  ));

-- Projects: users can manage their own, or org projects they belong to
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (
    auth.uid() = user_id 
    OR (org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = projects.org_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Project inputs: follow project access
CREATE POLICY "Users can view project inputs"
  ON public.project_inputs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_inputs.project_id 
    AND (user_id = auth.uid() OR (org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = projects.org_id AND user_id = auth.uid()
    )))
  ));

CREATE POLICY "Users can create project inputs"
  ON public.project_inputs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_inputs.project_id AND user_id = auth.uid()
  ));

-- Project runs: follow project access
CREATE POLICY "Users can view project runs"
  ON public.project_runs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_runs.project_id 
    AND (user_id = auth.uid() OR (org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = projects.org_id AND user_id = auth.uid()
    )))
  ));

CREATE POLICY "Users can create project runs"
  ON public.project_runs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_runs.project_id AND user_id = auth.uid()
  ));

CREATE POLICY "Service can update project runs"
  ON public.project_runs FOR UPDATE
  USING (true);

-- Artifacts: follow project run access
CREATE POLICY "Users can view artifacts"
  ON public.artifacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.project_runs pr
    JOIN public.projects p ON p.id = pr.project_id
    WHERE pr.id = artifacts.project_run_id 
    AND (p.user_id = auth.uid() OR (p.org_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE org_id = p.org_id AND user_id = auth.uid()
    )))
  ));

CREATE POLICY "Service can manage artifacts"
  ON public.artifacts FOR ALL
  USING (true);

-- Usage credits: users see their own
CREATE POLICY "Users can view own credits"
  ON public.usage_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage credits"
  ON public.usage_credits FOR ALL
  USING (true);

-- Usage ledger: users see their own
CREATE POLICY "Users can view own ledger"
  ON public.usage_ledger FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage ledger"
  ON public.usage_ledger FOR ALL
  USING (true);

-- Support tickets: users see their own, admins see all
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Support messages: follow ticket access
CREATE POLICY "Users can view ticket messages"
  ON public.support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = support_messages.ticket_id 
    AND (user_id = auth.uid() OR is_admin(auth.uid()))
  ));

CREATE POLICY "Users can create messages on own tickets"
  ON public.support_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = support_messages.ticket_id 
    AND (user_id = auth.uid() OR is_admin(auth.uid()))
  ));

-- Analytics events: users can insert, admins can read all
CREATE POLICY "Anyone can insert analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read analytics"
  ON public.analytics_events FOR SELECT
  USING (is_admin(auth.uid()));

-- Trade plans: users manage their own
CREATE POLICY "Users can view own trade plans"
  ON public.trade_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create trade plans"
  ON public.trade_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trade plans"
  ON public.trade_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trade plans"
  ON public.trade_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Function to initialize credits for new users
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_credits (user_id, plan_tier, credits_balance)
  VALUES (NEW.id, 'free', 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function to estimate credits for a project run
CREATE OR REPLACE FUNCTION public.estimate_project_credits(
  p_type project_type,
  p_instruments_count INTEGER,
  p_lookback_years INTEGER,
  p_timeframe TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_cost INTEGER;
  multiplier NUMERIC;
BEGIN
  -- Base cost by project type
  CASE p_type
    WHEN 'setup_finder' THEN base_cost := 5;
    WHEN 'pattern_lab' THEN base_cost := 10;
    WHEN 'portfolio_checkup' THEN base_cost := 3;
    WHEN 'portfolio_sim' THEN base_cost := 8;
    WHEN 'filings_watch' THEN base_cost := 2;
  END CASE;
  
  -- Multiplier based on scope
  multiplier := 1.0;
  multiplier := multiplier * GREATEST(1, p_instruments_count / 5.0);
  multiplier := multiplier * GREATEST(1, p_lookback_years);
  
  -- Timeframe adjustment (lower timeframes = more data)
  CASE p_timeframe
    WHEN '1m' THEN multiplier := multiplier * 4;
    WHEN '5m' THEN multiplier := multiplier * 3;
    WHEN '15m' THEN multiplier := multiplier * 2;
    WHEN '1h' THEN multiplier := multiplier * 1.5;
    WHEN '4h' THEN multiplier := multiplier * 1.2;
    ELSE multiplier := multiplier * 1; -- 1D or higher
  END CASE;
  
  RETURN CEIL(base_cost * multiplier);
END;
$$;

-- Function to check if user can run project (within caps)
CREATE OR REPLACE FUNCTION public.check_project_run_allowed(
  p_user_id UUID,
  p_credits_needed INTEGER,
  p_instruments_count INTEGER,
  p_lookback_years INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_credits RECORD;
  daily_runs INTEGER;
BEGIN
  -- Get user credits
  SELECT * INTO user_credits
  FROM public.usage_credits
  WHERE user_id = p_user_id;
  
  -- Initialize if not exists
  IF user_credits IS NULL THEN
    INSERT INTO public.usage_credits (user_id, plan_tier, credits_balance)
    VALUES (p_user_id, 'free', 100)
    RETURNING * INTO user_credits;
  END IF;
  
  -- Count daily runs
  SELECT COUNT(*) INTO daily_runs
  FROM public.project_runs pr
  JOIN public.projects p ON p.id = pr.project_id
  WHERE p.user_id = p_user_id
  AND pr.created_at >= CURRENT_DATE;
  
  -- Check all constraints
  IF user_credits.credits_balance < p_credits_needed THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'insufficient_credits',
      'credits_balance', user_credits.credits_balance,
      'credits_needed', p_credits_needed
    );
  END IF;
  
  IF daily_runs >= user_credits.daily_run_cap THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_cap_reached',
      'daily_runs', daily_runs,
      'daily_cap', user_credits.daily_run_cap
    );
  END IF;
  
  IF p_instruments_count > user_credits.max_instruments_per_run THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'too_many_instruments',
      'requested', p_instruments_count,
      'max_allowed', user_credits.max_instruments_per_run
    );
  END IF;
  
  IF p_lookback_years > user_credits.max_lookback_years THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'lookback_too_long',
      'requested', p_lookback_years,
      'max_allowed', user_credits.max_lookback_years
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'credits_balance', user_credits.credits_balance,
    'credits_after', user_credits.credits_balance - p_credits_needed,
    'daily_runs', daily_runs,
    'plan_tier', user_credits.plan_tier
  );
END;
$$;