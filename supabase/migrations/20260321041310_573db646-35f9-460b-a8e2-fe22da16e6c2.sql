
-- Create master_plans table
CREATE TABLE public.master_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true,
  raw_nl_input text,
  max_position_pct numeric,
  max_open_positions integer,
  trading_window_start time,
  trading_window_end time,
  stop_loss_rule text,
  excluded_conditions jsonb DEFAULT '[]'::jsonb,
  preferred_patterns jsonb DEFAULT '[]'::jsonb,
  sector_filters jsonb DEFAULT '[]'::jsonb,
  trend_direction text,
  min_market_cap text
);

-- Create session_overrides table
CREATE TABLE public.session_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id text,
  override_text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.master_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_overrides ENABLE ROW LEVEL SECURITY;

-- RLS policies for master_plans
CREATE POLICY "Users can read own master plans" ON public.master_plans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own master plans" ON public.master_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own master plans" ON public.master_plans
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS policies for session_overrides
CREATE POLICY "Users can read own overrides" ON public.session_overrides
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own overrides" ON public.session_overrides
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger for master_plans
CREATE TRIGGER update_master_plans_updated_at
  BEFORE UPDATE ON public.master_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
