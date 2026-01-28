-- Add trend confirmation columns to historical_pattern_occurrences
ALTER TABLE public.historical_pattern_occurrences
ADD COLUMN IF NOT EXISTS trend_alignment TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trend_indicators JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.historical_pattern_occurrences.trend_alignment IS 'with_trend, counter_trend, or neutral based on indicator analysis';
COMMENT ON COLUMN public.historical_pattern_occurrences.trend_indicators IS 'JSON object containing individual indicator readings: {macd_signal, ema_trend, rsi_zone, adx_strength}';

-- Also add to live_pattern_detections for real-time screener
ALTER TABLE public.live_pattern_detections
ADD COLUMN IF NOT EXISTS trend_alignment TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trend_indicators JSONB DEFAULT '{}';