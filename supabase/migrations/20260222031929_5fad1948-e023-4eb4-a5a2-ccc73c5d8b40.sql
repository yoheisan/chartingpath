
-- Table to store translated versions of learning articles
CREATE TABLE public.learning_article_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.learning_articles(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  source_hash TEXT, -- hash of English content to detect staleness
  status TEXT NOT NULL DEFAULT 'auto_translated' CHECK (status IN ('auto_translated', 'approved', 'needs_review')),
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  translated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, language_code)
);

-- Enable RLS
ALTER TABLE public.learning_article_translations ENABLE ROW LEVEL SECURITY;

-- Public read access (articles are public content)
CREATE POLICY "Article translations are publicly readable"
  ON public.learning_article_translations
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (edge functions)
CREATE POLICY "Service role can manage article translations"
  ON public.learning_article_translations
  FOR ALL
  USING (public.is_service_role());

-- Index for fast lookups
CREATE INDEX idx_article_translations_article_lang 
  ON public.learning_article_translations(article_id, language_code);

CREATE INDEX idx_article_translations_lang 
  ON public.learning_article_translations(language_code);

-- Trigger for updated_at
CREATE TRIGGER update_article_translations_updated_at
  BEFORE UPDATE ON public.learning_article_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
