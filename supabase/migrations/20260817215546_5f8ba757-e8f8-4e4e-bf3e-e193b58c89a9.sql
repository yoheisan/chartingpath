-- Seeder invocation ledger + seeder_error_rate health check.
--
-- HTTP 546 (edge runtime resource limit) kills the function process: no
-- response, no in-function error handler, nothing written. The only way to
-- observe it from Postgres is to record a row when the run STARTS and mark it
-- on completion. A row still 'running' after 15 minutes is a run that died.
CREATE TABLE IF NOT EXISTS public.seed_invocation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL DEFAULT 'seed-historical-patterns-mtf',
  timeframe text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  symbols text[],
  cursor_offset integer,
  instruments_processed integer NOT NULL DEFAULT 0,
  occurrences_detected integer NOT NULL DEFAULT 0,
  rows_inserted integer NOT NULL DEFAULT 0,
  peak_rss_mb integer,
  duration_ms integer,
  error text
);

GRANT SELECT ON public.seed_invocation_log TO authenticated;
GRANT ALL ON public.seed_invocation_log TO service_role;

ALTER TABLE public.seed_invocation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read seed invocation log"
  ON public.seed_invocation_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages seed invocation log"
  ON public.seed_invocation_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_seed_invocation_log_started
  ON public.seed_invocation_log (started_at DESC);

-- Cursor row for the seeder's rotation through the instrument universe.
INSERT INTO public.scan_rotation_cursor (asset_type, timeframe, cursor_offset, universe_size)
VALUES ('seed_mtf', '1h', 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO public.data_health_checks (check_name, category, severity, description, expected_result)
VALUES (
  'seeder_error_rate',
  'pipeline',
  'critical',
  'More than 20% of seed-historical-patterns-mtf invocations in the last 3 hours did not complete successfully. HTTP 546 (edge runtime resource limit) kills the process without a response, so a run left in status=running for over 15 minutes counts as a failure.',
  'Non-success rate <= 20% over the last 3 hours'
)
ON CONFLICT (check_name) DO UPDATE
  SET severity = EXCLUDED.severity,
      category = EXCLUDED.category,
      description = EXCLUDED.description,
      expected_result = EXCLUDED.expected_result;