ALTER TABLE public.historical_pattern_occurrences
  ADD COLUMN IF NOT EXISTS geometry_source text NOT NULL DEFAULT 'unknown';
ALTER TABLE public.live_pattern_detections
  ADD COLUMN IF NOT EXISTS geometry_source text NOT NULL DEFAULT 'unknown';

ALTER TABLE public.historical_pattern_occurrences
  DROP CONSTRAINT IF EXISTS historical_geometry_source_chk;
ALTER TABLE public.historical_pattern_occurrences
  ADD CONSTRAINT historical_geometry_source_chk
  CHECK (geometry_source IN ('pivot','atr_fallback','neckline_fallback','unknown'));

ALTER TABLE public.live_pattern_detections
  DROP CONSTRAINT IF EXISTS live_geometry_source_chk;
ALTER TABLE public.live_pattern_detections
  ADD CONSTRAINT live_geometry_source_chk
  CHECK (geometry_source IN ('pivot','atr_fallback','neckline_fallback','unknown'));

COMMENT ON COLUMN public.historical_pattern_occurrences.geometry_source IS
  'How stop/target were derived: pivot = pattern-specific pivot geometry; atr_fallback = generic 2:1 ATR rule fired because pivots were insufficient; neckline_fallback = target direction sanity override; unknown = pre-dates provenance tracking and not retroactively determinable.';
COMMENT ON COLUMN public.live_pattern_detections.geometry_source IS
  'How stop/target were derived: pivot / atr_fallback / neckline_fallback / unknown.';

CREATE INDEX IF NOT EXISTS idx_hpo_geometry_source
  ON public.historical_pattern_occurrences (geometry_source);
CREATE INDEX IF NOT EXISTS idx_hpo_cell_geometry
  ON public.historical_pattern_occurrences (pattern_id, timeframe, asset_type, geometry_source);
CREATE INDEX IF NOT EXISTS idx_lpd_geometry_source
  ON public.live_pattern_detections (geometry_source);