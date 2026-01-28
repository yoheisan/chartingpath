-- Add historical_performance JSONB column to live_pattern_detections for caching
-- This eliminates the need to re-query historical_pattern_occurrences on every screener load
ALTER TABLE public.live_pattern_detections 
ADD COLUMN IF NOT EXISTS historical_performance JSONB;

-- Add index for faster pattern stats queries
CREATE INDEX IF NOT EXISTS idx_historical_pattern_occurrences_stats
ON public.historical_pattern_occurrences(pattern_id, detected_at DESC)
WHERE outcome IS NOT NULL;

-- Add comment explaining the schema
COMMENT ON COLUMN public.live_pattern_detections.historical_performance IS 
'Cached historical stats from historical_pattern_occurrences: {winRate, avgRMultiple, sampleSize, avgDurationBars, accumulatedRoi: {threeMonth, sixMonth, oneYear, threeYear, fiveYear}}';