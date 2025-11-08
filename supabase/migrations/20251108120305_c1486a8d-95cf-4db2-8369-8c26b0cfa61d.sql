-- Create content types enum
CREATE TYPE content_type AS ENUM (
  'article',
  'tutorial',
  'guide',
  'blog_post',
  'pattern_analysis',
  'strategy_guide'
);

-- Create content status enum
CREATE TYPE content_status AS ENUM (
  'draft',
  'published',
  'archived',
  'scheduled'
);

-- Create learning articles table
CREATE TABLE public.learning_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  
  -- Content Type & Organization
  content_type content_type NOT NULL DEFAULT 'article',
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  related_patterns TEXT[] DEFAULT '{}',
  related_articles UUID[] DEFAULT '{}',
  
  -- SEO Metadata
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[] DEFAULT '{}',
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  canonical_url TEXT,
  
  -- Reading & Engagement
  reading_time_minutes INTEGER,
  difficulty_level TEXT DEFAULT 'beginner',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- Publishing
  status content_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_publish_at TIMESTAMP WITH TIME ZONE,
  
  -- Author & Management
  author_id UUID REFERENCES auth.users(id),
  last_edited_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Display Order
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  
  -- Validation
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT valid_reading_time CHECK (reading_time_minutes > 0)
);

-- Add SEO and management fields to existing quiz_questions table
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES auth.users(id);

-- Create indexes for learning articles
CREATE INDEX idx_learning_articles_slug ON public.learning_articles(slug);
CREATE INDEX idx_learning_articles_category ON public.learning_articles(category);
CREATE INDEX idx_learning_articles_status ON public.learning_articles(status);
CREATE INDEX idx_learning_articles_published_at ON public.learning_articles(published_at);
CREATE INDEX idx_learning_articles_tags ON public.learning_articles USING GIN(tags);
CREATE INDEX idx_learning_articles_author ON public.learning_articles(author_id);
CREATE INDEX idx_learning_articles_content_type ON public.learning_articles(content_type);

-- Create article views tracking table
CREATE TABLE public.article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.learning_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_article_views_article ON public.article_views(article_id);
CREATE INDEX idx_article_views_user ON public.article_views(user_id);
CREATE INDEX idx_article_views_date ON public.article_views(viewed_at);

-- Create article likes table
CREATE TABLE public.article_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.learning_articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(article_id, user_id)
);

CREATE INDEX idx_article_likes_article ON public.article_likes(article_id);
CREATE INDEX idx_article_likes_user ON public.article_likes(user_id);

-- Enable RLS
ALTER TABLE public.learning_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_articles
CREATE POLICY "Anyone can view published articles"
  ON public.learning_articles
  FOR SELECT
  USING (status = 'published' OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all articles"
  ON public.learning_articles
  FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for article_views
CREATE POLICY "Users can insert their own article views"
  ON public.article_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all article views"
  ON public.article_views
  FOR SELECT
  USING (is_admin(auth.uid()));

-- RLS Policies for article_likes
CREATE POLICY "Users can manage their own likes"
  ON public.article_likes
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view article likes"
  ON public.article_likes
  FOR SELECT
  USING (true);

-- Create function to update article view count
CREATE OR REPLACE FUNCTION update_article_view_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.learning_articles
  SET view_count = view_count + 1
  WHERE id = NEW.article_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for view count
CREATE TRIGGER trigger_update_article_views
  AFTER INSERT ON public.article_views
  FOR EACH ROW
  EXECUTE FUNCTION update_article_view_count();

-- Create function to update article like count
CREATE OR REPLACE FUNCTION update_article_like_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.learning_articles
    SET like_count = like_count + 1
    WHERE id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.learning_articles
    SET like_count = GREATEST(0, like_count - 1)
    WHERE id = OLD.article_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for like count
CREATE TRIGGER trigger_update_article_likes
  AFTER INSERT OR DELETE ON public.article_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_article_like_count();

-- Create function to auto-publish scheduled articles
CREATE OR REPLACE FUNCTION publish_scheduled_articles()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  published_count INTEGER;
BEGIN
  UPDATE public.learning_articles
  SET 
    status = 'published',
    published_at = now()
  WHERE 
    status = 'scheduled'
    AND scheduled_publish_at <= now()
    AND scheduled_publish_at IS NOT NULL;
  
  GET DIAGNOSTICS published_count = ROW_COUNT;
  RETURN published_count;
END;
$$;

-- Create function to get article by slug
CREATE OR REPLACE FUNCTION get_article_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  content_type content_type,
  category TEXT,
  subcategory TEXT,
  tags TEXT[],
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  reading_time_minutes INTEGER,
  difficulty_level TEXT,
  view_count INTEGER,
  like_count INTEGER,
  published_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.content,
    a.featured_image_url,
    a.content_type,
    a.category,
    a.subcategory,
    a.tags,
    a.seo_title,
    a.seo_description,
    a.seo_keywords,
    a.og_title,
    a.og_description,
    a.og_image_url,
    a.reading_time_minutes,
    a.difficulty_level,
    a.view_count,
    a.like_count,
    a.published_at
  FROM public.learning_articles a
  WHERE a.slug = p_slug
    AND (a.status = 'published' OR is_admin(auth.uid()));
END;
$$;

-- Create analytics view for articles
CREATE OR REPLACE VIEW article_analytics AS
SELECT 
  a.id,
  a.title,
  a.slug,
  a.category,
  a.content_type,
  a.status,
  a.view_count,
  a.like_count,
  COUNT(DISTINCT av.user_id) as unique_viewers,
  COUNT(DISTINCT al.user_id) as unique_likers,
  a.published_at,
  a.created_at
FROM public.learning_articles a
LEFT JOIN public.article_views av ON a.id = av.article_id
LEFT JOIN public.article_likes al ON a.id = al.article_id
GROUP BY a.id, a.title, a.slug, a.category, a.content_type, a.status, 
         a.view_count, a.like_count, a.published_at, a.created_at;

-- Grant access to views
GRANT SELECT ON article_analytics TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.learning_articles IS 'Stores all learning center articles with full SEO metadata';
COMMENT ON TABLE public.article_views IS 'Tracks article views for analytics';
COMMENT ON TABLE public.article_likes IS 'Tracks user likes on articles';
COMMENT ON COLUMN public.learning_articles.slug IS 'URL-friendly unique identifier (e.g., head-and-shoulders-pattern)';
COMMENT ON COLUMN public.learning_articles.canonical_url IS 'Canonical URL for SEO to prevent duplicate content issues';
COMMENT ON FUNCTION get_article_by_slug IS 'Retrieves a single article by its slug with all metadata';
COMMENT ON FUNCTION publish_scheduled_articles IS 'Auto-publishes articles that are scheduled for the current time';