CREATE INDEX IF NOT EXISTS idx_hist_patterns_val_status
ON public.historical_pattern_occurrences (validation_status, created_at);

CREATE INDEX IF NOT EXISTS idx_live_patterns_cache
ON public.live_pattern_detections (asset_type, timeframe, status, validation_status, last_confirmed_at DESC);