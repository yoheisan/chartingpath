
CREATE TABLE public.backtest_pattern_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID REFERENCES public.backtest_runs(id) ON DELETE CASCADE NOT NULL,
  instrument TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  direction TEXT NOT NULL,
  grade TEXT,
  entry_date TIMESTAMPTZ NOT NULL,
  outcome TEXT NOT NULL,
  bars_to_close INTEGER,
  r_multiple NUMERIC,
  rr_target NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backtest_pattern_outcomes_lookup ON public.backtest_pattern_outcomes (instrument, timeframe, pattern_name);

ALTER TABLE public.backtest_pattern_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read backtest pattern outcomes"
  ON public.backtest_pattern_outcomes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own backtest pattern outcomes"
  ON public.backtest_pattern_outcomes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.backtest_runs br
      WHERE br.id = run_id AND br.user_id = auth.uid()
    )
  );
