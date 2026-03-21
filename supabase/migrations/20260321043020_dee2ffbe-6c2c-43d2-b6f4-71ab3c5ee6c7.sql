
-- Add new columns to paper_trades for Copilot attribution
ALTER TABLE public.paper_trades
  ADD COLUMN IF NOT EXISTS master_plan_id uuid REFERENCES public.master_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS position_size_pct numeric,
  ADD COLUMN IF NOT EXISTS hold_duration_mins integer,
  ADD COLUMN IF NOT EXISTS setup_type text,
  ADD COLUMN IF NOT EXISTS copilot_reasoning text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'user_selected',
  ADD COLUMN IF NOT EXISTS gate_result text,
  ADD COLUMN IF NOT EXISTS gate_reason text,
  ADD COLUMN IF NOT EXISTS user_action text DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS attribution text DEFAULT 'ai_approved',
  ADD COLUMN IF NOT EXISTS outcome text DEFAULT 'open';

-- Create session_logs table
CREATE TABLE IF NOT EXISTS public.session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  session_date date NOT NULL,
  total_scanned integer DEFAULT 0,
  trades_taken integer DEFAULT 0,
  ai_pnl_r numeric DEFAULT 0,
  human_pnl_r numeric DEFAULT 0,
  summary_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session logs"
  ON public.session_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session logs"
  ON public.session_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access session_logs"
  ON public.session_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
