-- Add missing SEO metadata columns to learning_article_translations
ALTER TABLE public.learning_article_translations 
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text;

-- Add a comment for audit clarity
COMMENT ON TABLE public.learning_article_translations IS 'Stores translated versions of learning articles with full SEO metadata. DB is the single canonical source for all localized content.';