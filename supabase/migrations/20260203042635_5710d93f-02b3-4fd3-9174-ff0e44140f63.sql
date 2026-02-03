-- First, delete duplicate rows keeping only the newest one based on created_at
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY pattern_id, symbol, timeframe, pattern_end_date 
           ORDER BY created_at DESC
         ) as rn
  FROM public.historical_pattern_occurrences
)
DELETE FROM public.historical_pattern_occurrences
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now create the unique index
CREATE UNIQUE INDEX idx_hpo_unique_pattern 
ON public.historical_pattern_occurrences (pattern_id, symbol, timeframe, pattern_end_date);

-- Add the additional lookup index
CREATE INDEX IF NOT EXISTS idx_hpo_symbol_timeframe_pattern 
ON public.historical_pattern_occurrences (symbol, timeframe, pattern_id, detected_at DESC);