
-- Add source_hash column to translations table for stale detection
ALTER TABLE public.translations 
ADD COLUMN IF NOT EXISTS source_hash text;

-- Add comment explaining the column
COMMENT ON COLUMN public.translations.source_hash IS 'MD5 hash of the English source value, used to detect when source text changes';
