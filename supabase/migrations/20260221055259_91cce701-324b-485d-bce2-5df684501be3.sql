
-- Table 1: Learned rules that get injected into the copilot system prompt
CREATE TABLE public.copilot_learned_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('translation', 'fallback', 'correction', 'few_shot', 'guardrail')),
  trigger_pattern TEXT NOT NULL,
  rule_content TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  confidence NUMERIC DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_learned_rules ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (used by edge functions)
CREATE POLICY "Service role full access on copilot_learned_rules"
  ON public.copilot_learned_rules
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Table 2: Training pairs for RLVR pipeline (prompt -> response -> outcome)
CREATE TABLE public.copilot_training_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  user_id UUID,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  tool_calls JSONB DEFAULT '[]',
  tool_results JSONB DEFAULT '[]',
  outcome_signals JSONB DEFAULT '{}',
  reward_score NUMERIC,
  is_preferred BOOLEAN,
  dpo_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_training_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on copilot_training_pairs"
  ON public.copilot_training_pairs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes for efficient querying
CREATE INDEX idx_copilot_learned_rules_active ON public.copilot_learned_rules (is_active, rule_type) WHERE is_active = true;
CREATE INDEX idx_copilot_training_pairs_dpo ON public.copilot_training_pairs (dpo_eligible, reward_score) WHERE dpo_eligible = true;
CREATE INDEX idx_copilot_training_pairs_created ON public.copilot_training_pairs (created_at DESC);

-- Seed initial learned rules based on known failure patterns
INSERT INTO public.copilot_learned_rules (rule_type, trigger_pattern, rule_content, source) VALUES
('translation', 'percentage_to_r', 'When users mention "30% return" or any percentage return, translate to R-multiples. 1R ≈ 1% at 1% risk. Typical top patterns yield 1-10R annualized. Never pass >10 as min_annualized_pct.', 'seed'),
('fallback', 'zero_results_edge_atlas', 'If query_edge_atlas returns 0 results: Step 1) Remove min_annualized_pct and min_win_rate. Step 2) Remove timeframe filter. Step 3) Remove direction filter. Always show whatever data exists.', 'seed'),
('correction', 'best_pattern_intent', 'When user asks "what is the best pattern", they mean highest annualized return OR highest win rate. Ask which metric matters most, or default to sorting by annualized return.', 'seed'),
('guardrail', 'unrealistic_filters', 'Reject filter combinations that would never return data: min_win_rate > 80%, min_annualized_pct > 15, min_trades > 500 for niche asset classes. Silently relax to reasonable values.', 'seed');

-- Trigger for updated_at
CREATE TRIGGER update_copilot_learned_rules_updated_at
  BEFORE UPDATE ON public.copilot_learned_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
