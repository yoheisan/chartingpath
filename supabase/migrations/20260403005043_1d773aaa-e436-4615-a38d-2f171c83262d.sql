
CREATE TABLE public.copilot_model_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  model_used text NOT NULL,
  response_latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  source text NOT NULL DEFAULT 'copilot',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_copilot_model_usage_user ON public.copilot_model_usage(user_id, created_at DESC);
CREATE INDEX idx_copilot_model_usage_model ON public.copilot_model_usage(model_used, created_at DESC);

ALTER TABLE public.copilot_model_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own model usage"
  ON public.copilot_model_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert model usage"
  ON public.copilot_model_usage FOR INSERT
  WITH CHECK (true);
