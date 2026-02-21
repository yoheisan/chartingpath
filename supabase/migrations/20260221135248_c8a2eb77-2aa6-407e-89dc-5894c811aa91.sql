
-- Educational micro-posts generated from learning articles
CREATE TABLE public.educational_content_pieces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES public.learning_articles(id) ON DELETE CASCADE,
  article_title TEXT NOT NULL,
  sequence_number INT NOT NULL, -- 1-5 within the article series
  total_in_series INT NOT NULL, -- 3-5
  content TEXT NOT NULL, -- tweet text (max ~270 chars)
  piece_type TEXT NOT NULL, -- 'glossary', 'key_learning', 'definition', 'technique', 'insight'
  link_back_url TEXT,
  hashtags TEXT[] DEFAULT '{}',
  global_order INT, -- position in the rotation queue (assigned after generation)
  posted_count INT NOT NULL DEFAULT 0,
  last_posted_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track rotation state per market region
CREATE TABLE public.educational_schedule_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_region TEXT NOT NULL UNIQUE, -- 'us', 'eu', 'asia_tokyo', 'asia_shanghai'
  current_position INT NOT NULL DEFAULT 0, -- index into global_order
  optimal_post_time_utc TIME NOT NULL, -- e.g. '14:00' for US
  timezone TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.educational_content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_schedule_state ENABLE ROW LEVEL SECURITY;

-- Admin-only access for both tables
CREATE POLICY "Admins can manage educational content pieces"
  ON public.educational_content_pieces FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage educational schedule state"
  ON public.educational_schedule_state FOR ALL
  USING (public.is_admin(auth.uid()));

-- Service role access for edge functions
CREATE POLICY "Service role full access on educational_content_pieces"
  ON public.educational_content_pieces FOR ALL
  USING (public.is_service_role());

CREATE POLICY "Service role full access on educational_schedule_state"
  ON public.educational_schedule_state FOR ALL
  USING (public.is_service_role());

-- Index for rotation queries
CREATE INDEX idx_educational_pieces_global_order ON public.educational_content_pieces(global_order) WHERE is_active = true;
CREATE INDEX idx_educational_pieces_article ON public.educational_content_pieces(article_id);

-- Seed the 4 market regions with optimal posting times
-- Times chosen for peak trading engagement per market:
-- US: 9:00 AM EST = 14:00 UTC (market open)
-- EU: 8:30 AM GMT = 08:30 UTC (pre-market)
-- Tokyo: 9:00 AM JST = 00:00 UTC (morning)
-- Shanghai/HK: 9:00 AM HKT = 01:00 UTC (morning)
INSERT INTO public.educational_schedule_state (market_region, current_position, optimal_post_time_utc, timezone) VALUES
  ('us', 0, '14:00', 'America/New_York'),
  ('eu', 1, '08:30', 'Europe/London'),
  ('asia_tokyo', 2, '00:00', 'Asia/Tokyo'),
  ('asia_shanghai', 3, '01:00', 'Asia/Shanghai');

-- Updated_at trigger
CREATE TRIGGER update_educational_pieces_updated_at
  BEFORE UPDATE ON public.educational_content_pieces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_educational_state_updated_at
  BEFORE UPDATE ON public.educational_schedule_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
