-- Rotation cursor so scheduled scans cover the whole instrument universe over a cycle
CREATE TABLE IF NOT EXISTS public.scan_rotation_cursor (
  asset_type text NOT NULL,
  timeframe text NOT NULL,
  cursor_offset integer NOT NULL DEFAULT 0,
  universe_size integer NOT NULL DEFAULT 0,
  last_advanced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (asset_type, timeframe)
);
GRANT ALL ON public.scan_rotation_cursor TO service_role;
GRANT SELECT ON public.scan_rotation_cursor TO authenticated;
ALTER TABLE public.scan_rotation_cursor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scan_rotation_cursor_admin_read" ON public.scan_rotation_cursor
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Per-asset-class detection freshness alarm
CREATE TABLE IF NOT EXISTS public.asset_class_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at timestamptz NOT NULL DEFAULT now(),
  asset_type text NOT NULL,
  timeframe text,
  active_detection_count integer NOT NULL DEFAULT 0,
  newest_detection_at timestamptz,
  hours_since_newest numeric,
  threshold_hours numeric NOT NULL,
  status text NOT NULL,
  detail text
);
CREATE INDEX IF NOT EXISTS idx_asset_class_health_checked ON public.asset_class_health (checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_class_health_status ON public.asset_class_health (status, checked_at DESC);
GRANT ALL ON public.asset_class_health TO service_role;
GRANT SELECT ON public.asset_class_health TO authenticated;
ALTER TABLE public.asset_class_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asset_class_health_admin_read" ON public.asset_class_health
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Per-run observability for the alert pipeline
CREATE TABLE IF NOT EXISTS public.alert_run_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  asset_type_filter text,
  alerts_evaluated integer NOT NULL DEFAULT 0,
  alerts_skipped_recent integer NOT NULL DEFAULT 0,
  detections_considered integer NOT NULL DEFAULT 0,
  matches_found integer NOT NULL DEFAULT 0,
  alerts_dispatched integer NOT NULL DEFAULT 0,
  watch_only integer NOT NULL DEFAULT 0,
  emails_confirmed integer NOT NULL DEFAULT 0,
  dispatch_failures integer NOT NULL DEFAULT 0,
  failure_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome text NOT NULL DEFAULT 'ok',
  duration_ms integer
);
CREATE INDEX IF NOT EXISTS idx_alert_run_log_run_at ON public.alert_run_log (run_at DESC);
GRANT ALL ON public.alert_run_log TO service_role;
GRANT SELECT ON public.alert_run_log TO authenticated;
ALTER TABLE public.alert_run_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alert_run_log_admin_read" ON public.alert_run_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));