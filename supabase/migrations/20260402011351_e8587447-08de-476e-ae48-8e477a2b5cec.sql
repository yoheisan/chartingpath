
ALTER TABLE public.backtest_pattern_outcomes
  DROP CONSTRAINT backtest_pattern_outcomes_run_id_fkey;

ALTER TABLE public.backtest_pattern_outcomes
  ADD CONSTRAINT backtest_pattern_outcomes_run_id_fkey
  FOREIGN KEY (run_id) REFERENCES public.project_runs(id) ON DELETE CASCADE;
