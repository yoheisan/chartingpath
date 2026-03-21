
CREATE TABLE IF NOT EXISTS public.insight_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  insight text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.insight_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own insights" ON public.insight_cache
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON public.insight_cache
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON public.insight_cache
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to insight_cache" ON public.insight_cache
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.insight_cache;
