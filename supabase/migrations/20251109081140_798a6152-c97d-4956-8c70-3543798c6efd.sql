-- Social Media Accounts Configuration
CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram')),
  account_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  credentials JSONB NOT NULL, -- Store encrypted API keys/tokens
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(platform, account_name)
);

-- Content Library (Q&A and other evergreen content)
CREATE TABLE IF NOT EXISTS public.content_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('qa', 'educational', 'tip', 'pattern', 'strategy')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_back_url TEXT,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_posted_at TIMESTAMP WITH TIME ZONE,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scheduled Posts
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_type TEXT NOT NULL CHECK (post_type IN ('market_report', 'content_library', 'custom')),
  content_library_id UUID REFERENCES public.content_library(id),
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'instagram', 'both')),
  account_id UUID REFERENCES public.social_media_accounts(id),
  
  -- Scheduling
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT, -- cron-like: 'daily', 'weekdays', 'custom'
  
  -- Content
  title TEXT,
  content TEXT,
  image_url TEXT,
  link_back_url TEXT,
  
  -- Market Report specific
  report_config JSONB, -- {markets: [], timeSpan: 'pre_market', tone: 'professional'}
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'posted', 'failed', 'cancelled')),
  posted_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Post History and Analytics
CREATE TABLE IF NOT EXISTS public.post_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_post_id UUID REFERENCES public.scheduled_posts(id),
  platform TEXT NOT NULL,
  account_id UUID REFERENCES public.social_media_accounts(id),
  
  -- Post details
  post_type TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_back_url TEXT,
  
  -- Platform response
  platform_post_id TEXT, -- Twitter tweet ID or Instagram post ID
  platform_response JSONB,
  
  -- Metrics (can be updated later via API)
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_scheduled_posts_time ON public.scheduled_posts(scheduled_time) WHERE status = 'scheduled';
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX idx_content_library_type ON public.content_library(content_type) WHERE is_active = true;
CREATE INDEX idx_content_library_last_posted ON public.content_library(last_posted_at) WHERE is_active = true;
CREATE INDEX idx_post_history_posted_at ON public.post_history(posted_at);

-- Enable Row Level Security
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only access for now - adjust based on your auth)
CREATE POLICY "Admin full access to social_media_accounts"
  ON public.social_media_accounts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to content_library"
  ON public.content_library
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to scheduled_posts"
  ON public.scheduled_posts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to post_history"
  ON public.post_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_media_accounts_updated_at
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_library_updated_at
  BEFORE UPDATE ON public.content_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();