
-- Add data version tracking to pattern_hit_rates
ALTER TABLE public.pattern_hit_rates
  ADD COLUMN IF NOT EXISTS data_version integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_reseeded_at timestamptz,
  ADD COLUMN IF NOT EXISTS reseed_reason text,
  ADD COLUMN IF NOT EXISTS previous_win_rate numeric,
  ADD COLUMN IF NOT EXISTS previous_sample_size integer,
  ADD COLUMN IF NOT EXISTS is_reseeding boolean DEFAULT false;

-- Create reseed audit log
CREATE TABLE IF NOT EXISTS public.reseed_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseed_batch text NOT NULL,
  pattern_id text,
  asset_class text,
  timeframe text,
  instruments_affected integer,
  detections_before integer,
  detections_after integer,
  win_rate_before numeric,
  win_rate_after numeric,
  reseed_reason text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  status text DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'rolled_back'))
);

-- Create platform data version table
CREATE TABLE IF NOT EXISTS public.platform_data_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL,
  label text NOT NULL,
  description text,
  changes_summary text[],
  is_active boolean DEFAULT false,
  activated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Insert initial version
INSERT INTO public.platform_data_version
  (version, label, description, changes_summary, is_active, activated_at)
VALUES (
  1,
  'v1.0 — Baseline',
  'Original detection methodology',
  ARRAY[
    'Initial pattern detection engine',
    'Close-to-close ATR calculation',
    'Unsmoothed ADX proxy',
    'Fixed 8-bar flag pole'
  ],
  true,
  now()
);

-- Insert upcoming version
INSERT INTO public.platform_data_version
  (version, label, description, changes_summary, is_active)
VALUES (
  2,
  'v2.0 — Improved Detection Accuracy',
  'Methodology improvements across 8 pattern types based on technical audit',
  ARRAY[
    'True range ATR calculation (more accurate volatility for stocks/indices)',
    'Wilder-smoothed ADX filter (fewer false Donchian breakouts)',
    'Symmetrical Triangle now detects both Long and Short breakouts',
    'Adaptive flag pole length by timeframe',
    'Tighter Triple Top/Bottom pivot detection',
    'Asset-class specific stop loss floors',
    'Linear regression wedge detection',
    'Tighter Cup and Handle handle retracement'
  ],
  false
);

-- RLS for audit log and platform version
ALTER TABLE public.reseed_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_data_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read platform version"
  ON public.platform_data_version FOR SELECT USING (true);

CREATE POLICY "Public read reseed audit"
  ON public.reseed_audit_log FOR SELECT USING (true);
