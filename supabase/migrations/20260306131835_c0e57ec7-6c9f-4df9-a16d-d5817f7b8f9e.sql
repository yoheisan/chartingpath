
CREATE TABLE public.agent_scoring_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  weights JSONB NOT NULL DEFAULT '{"analyst":25,"risk":25,"timing":25,"portfolio":25}',
  take_cutoff INTEGER NOT NULL DEFAULT 70,
  watch_cutoff INTEGER NOT NULL DEFAULT 50,
  asset_class_filter TEXT NOT NULL DEFAULT 'all',
  timeframe_filter TEXT NOT NULL DEFAULT 'all',
  sub_filters JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_scoring_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.agent_scoring_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON public.agent_scoring_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON public.agent_scoring_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own settings"
  ON public.agent_scoring_settings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_agent_scoring_settings_user ON public.agent_scoring_settings(user_id);
