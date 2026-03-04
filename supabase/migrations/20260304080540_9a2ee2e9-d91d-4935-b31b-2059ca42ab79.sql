
-- 1. Create instruments reference table
CREATE TABLE public.instruments (
  symbol TEXT PRIMARY KEY,
  name TEXT,
  exchange TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  country TEXT,
  sector TEXT,
  currency TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_instruments_exchange ON public.instruments (exchange);
CREATE INDEX idx_instruments_asset_type ON public.instruments (asset_type);
CREATE INDEX idx_instruments_country ON public.instruments (country);

-- RLS: public read, service-role write
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read instruments"
  ON public.instruments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage instruments"
  ON public.instruments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Add exchange column to live_pattern_detections
ALTER TABLE public.live_pattern_detections
  ADD COLUMN IF NOT EXISTS exchange TEXT;

CREATE INDEX idx_lpd_exchange ON public.live_pattern_detections (exchange);

-- 3. Add exchange column to historical_pattern_occurrences
ALTER TABLE public.historical_pattern_occurrences
  ADD COLUMN IF NOT EXISTS exchange TEXT;

CREATE INDEX idx_hpo_exchange ON public.historical_pattern_occurrences (exchange);

-- 4. Updated_at trigger for instruments
CREATE TRIGGER update_instruments_updated_at
  BEFORE UPDATE ON public.instruments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
