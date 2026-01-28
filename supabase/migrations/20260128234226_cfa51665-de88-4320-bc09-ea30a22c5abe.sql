-- Create composite index for faster article list queries
-- This optimizes the WHERE status='published' ORDER BY published_at DESC query
CREATE INDEX IF NOT EXISTS idx_learning_articles_status_published 
ON public.learning_articles (status, published_at DESC)
WHERE status = 'published';

-- Add index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_learning_articles_slug 
ON public.learning_articles (slug)
WHERE status = 'published';