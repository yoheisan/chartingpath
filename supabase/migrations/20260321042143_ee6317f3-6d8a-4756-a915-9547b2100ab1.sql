
-- Create gate_evaluations table
CREATE TABLE public.gate_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  ticker text NOT NULL,
  setup_type text,
  timeframe text,
  direction text,
  agent_score numeric,
  agent_verdict text,
  gate_result text NOT NULL,
  gate_reason text,
  master_plan_id uuid REFERENCES public.master_plans(id) ON DELETE SET NULL,
  source text DEFAULT 'ai_scan'
);

-- Add gate_evaluation_id to paper_trades
ALTER TABLE public.paper_trades ADD COLUMN IF NOT EXISTS gate_evaluation_id uuid REFERENCES public.gate_evaluations(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.gate_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own gate evaluations" ON public.gate_evaluations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gate evaluations" ON public.gate_evaluations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_gate_evaluations_user_ticker ON public.gate_evaluations (user_id, ticker, created_at DESC);
CREATE INDEX idx_gate_evaluations_user_result ON public.gate_evaluations (user_id, gate_result, created_at DESC);
