-- =====================================================================
-- DATA HEALTH MONITORING
-- DESIGN PRINCIPLE: DETECT AND ALERT, NEVER AUTO-FIX.
-- A job that silently "corrects" data destroys the evidence needed to
-- find the real bug, and if the check is wrong it corrupts good data.
-- The only thing that acts automatically is the write-time guard
-- (guard_paper_trade_exit), which refuses a bad row before it exists.
-- Everything here reports and lets a human decide.
--
-- These checks only catch what we thought to assert. They would NOT
-- have caught the Edge Atlas hardcoded positive-expectancy filter,
-- which produced perfectly valid-looking data from flawed logic.
-- This is a safety net, not a guarantee.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.data_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL UNIQUE,
  category text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical','warning','info')),
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  sql_expression text,
  expected_result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.data_health_checks TO authenticated;
GRANT ALL ON public.data_health_checks TO service_role;
ALTER TABLE public.data_health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read health checks" ON public.data_health_checks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage health checks" ON public.data_health_checks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_data_health_checks_updated_at
  BEFORE UPDATE ON public.data_health_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.data_health_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  run_at timestamptz NOT NULL DEFAULT now(),
  passed boolean NOT NULL,
  observed_value text,
  detail jsonb,
  severity text,
  duration_ms integer
);

CREATE INDEX IF NOT EXISTS idx_data_health_results_name_run
  ON public.data_health_results (check_name, run_at DESC);

GRANT SELECT ON public.data_health_results TO authenticated;
GRANT ALL ON public.data_health_results TO service_role;
ALTER TABLE public.data_health_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read health results" ON public.data_health_results
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Vocabulary reference: expected values are derived from THIS table,
-- never from a hardcoded list inside a check.
CREATE TABLE IF NOT EXISTS public.data_health_vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  canonical_value text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain, canonical_value)
);

GRANT SELECT ON public.data_health_vocabulary TO authenticated;
GRANT ALL ON public.data_health_vocabulary TO service_role;
ALTER TABLE public.data_health_vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read vocabulary" ON public.data_health_vocabulary
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage vocabulary" ON public.data_health_vocabulary
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.data_health_vocabulary (domain, canonical_value, aliases, note) VALUES
  ('asset_type','fx',          ARRAY['forex','currency'], 'ASSET_CLASS_TO_DB target'),
  ('asset_type','crypto',      ARRAY['cryptocurrency'],   'ASSET_CLASS_TO_DB target'),
  ('asset_type','stocks',      ARRAY['stock','equity','equities'], 'ASSET_CLASS_TO_DB target'),
  ('asset_type','commodities', ARRAY['commodity'],        'ASSET_CLASS_TO_DB target'),
  ('asset_type','indices',     ARRAY['index','indice'],   'ASSET_CLASS_TO_DB target'),
  ('asset_type','etfs',        ARRAY['etf'],              'ASSET_CLASS_TO_DB target'),
  ('direction','bullish',      ARRAY['long','buy','up'],  'historical_pattern_occurrences canonical'),
  ('direction','bearish',      ARRAY['short','sell','down'], 'historical_pattern_occurrences canonical')
ON CONFLICT (domain, canonical_value) DO NOTHING;

-- Which table each cron job is expected to actually write to.
CREATE TABLE IF NOT EXISTS public.data_health_cron_expectations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL UNIQUE,
  target_table text NOT NULL,
  timestamp_column text NOT NULL DEFAULT 'created_at',
  window_hours integer NOT NULL DEFAULT 24,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.data_health_cron_expectations TO authenticated;
GRANT ALL ON public.data_health_cron_expectations TO service_role;
ALTER TABLE public.data_health_cron_expectations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read cron expectations" ON public.data_health_cron_expectations
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage cron expectations" ON public.data_health_cron_expectations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.data_health_cron_expectations (job_name, target_table, timestamp_column, window_hours) VALUES
  ('refresh-fx-prices-5m',            'historical_prices',        'updated_at', 6),
  ('scan-live-1d-fx',                 'live_pattern_detections',  'updated_at', 48),
  ('scan-live-1d-stocks',             'live_pattern_detections',  'updated_at', 48),
  ('scan-live-1d-crypto',             'live_pattern_detections',  'updated_at', 48),
  ('check-alert-matches-scheduled',   'alert_run_log',            'created_at', 24),
  ('manage-trades-every-2min',        'paper_trades',             'updated_at', 24),
  ('recompute-multi-rr-backfill',     'historical_pattern_occurrences', 'updated_at', 24)
ON CONFLICT (job_name) DO NOTHING;

-- Catalogue of checks
INSERT INTO public.data_health_checks (check_name, category, severity, description, expected_result) VALUES
  ('outcome_r_in_range','paper_trading','critical','No closed paper trade may have outcome_r below -1.05 or above 10. R is defined by stop distance, so a stop-loss exit is -1R by construction.','0 rows'),
  ('exit_price_matches_trigger','paper_trading','critical','On a level-triggered close, exit_price must be within 1% of the stop or target level it claims to have hit.','0 rows'),
  ('exit_price_sane','paper_trading','critical','No closed trade may exit more than 50% away from its entry price.','0 rows'),
  ('detections_fresh_per_asset_class','pipeline','critical','Every active asset class must have produced a live pattern detection within 48 hours.','0 stale asset classes'),
  ('prices_fresh_per_asset_class','pipeline','critical','Every active asset class must have price rows updated within 48 hours.','0 stale asset classes'),
  ('no_duplicate_paper_trades','paper_trading','critical','At most one paper trade per (user_id, detection_id).','0 duplicate groups'),
  ('alerts_dispatch_alive','alerts','critical','If active alerts and recent detections both exist, alerts_log must have a row within 7 days.','recent dispatch present'),
  ('vocabulary_consistency','consistency','warning','Asset-type and direction values used across tables must resolve against the vocabulary reference.','0 unknown values'),
  ('fx_stop_distance_sane','pipeline','warning','Median FX stop distance must be under 500 pips; higher indicates a scale error.','< 500 pips'),
  ('scanner_coverage','pipeline','warning','Each asset class must have fresh prices for at least 90% of its active instruments, else the scan cap is truncating coverage.','>= 90% per asset class'),
  ('supported_patterns_current','consistency','warning','Every pattern that has produced occurrences must be marked supported.','0 unmarked patterns'),
  ('no_orphan_enum_options','consistency','warning','chart_pattern enum values with zero detections anywhere.','0 orphan values'),
  ('columns_never_populated','schema','info','Columns that exist but are 100% NULL across monitored tables.','0 empty columns'),
  ('cron_jobs_producing_output','pipeline','info','Each active cron job with a declared target table must have caused rows to appear in its expected window. "Succeeded" only means the request was queued.','0 silent jobs')
ON CONFLICT (check_name) DO UPDATE
  SET category = EXCLUDED.category,
      severity = EXCLUDED.severity,
      description = EXCLUDED.description,
      expected_result = EXCLUDED.expected_result;