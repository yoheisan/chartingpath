
-- Add pattern_id to post_history so we can track which patterns have been auto-posted
ALTER TABLE public.post_history 
ADD COLUMN IF NOT EXISTS pattern_id text,
ADD COLUMN IF NOT EXISTS session_window text;

-- Index for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_post_history_pattern_id ON public.post_history(pattern_id) WHERE pattern_id IS NOT NULL;
