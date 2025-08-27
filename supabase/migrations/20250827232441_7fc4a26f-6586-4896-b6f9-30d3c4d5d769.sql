-- Create community strategies table for public sharing
CREATE TABLE public.community_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_strategy_id UUID REFERENCES public.user_strategies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  strategy_code TEXT NOT NULL,
  strategy_type TEXT NOT NULL DEFAULT 'custom',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  performance_data JSONB DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create strategy likes table
CREATE TABLE public.strategy_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.community_strategies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, strategy_id)
);

-- Create strategy downloads table
CREATE TABLE public.strategy_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.community_strategies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create enhanced alerts outcomes table
CREATE TABLE public.alert_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_log_id UUID NOT NULL REFERENCES public.alerts_log(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN ('hit', 'missed', 'false_positive', 'manual_close')),
  entry_price NUMERIC,
  exit_price NUMERIC,
  pnl_percentage NUMERIC,
  trade_duration_hours INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create learning progress table
CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  quiz_attempts INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  accuracy_percentage NUMERIC DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  mastery_level TEXT DEFAULT 'beginner' CHECK (mastery_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, pattern_type)
);

-- Enable RLS on all new tables
ALTER TABLE public.community_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for community_strategies
CREATE POLICY "Anyone can view published strategies" ON public.community_strategies
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own strategies" ON public.community_strategies
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for strategy_likes
CREATE POLICY "Users can manage own likes" ON public.strategy_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes" ON public.strategy_likes
  FOR SELECT USING (true);

-- RLS policies for strategy_downloads
CREATE POLICY "Users can manage own downloads" ON public.strategy_downloads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Strategy owners can view downloads" ON public.strategy_downloads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_strategies cs 
      WHERE cs.id = strategy_id AND cs.user_id = auth.uid()
    )
  );

-- RLS policies for alert_outcomes
CREATE POLICY "Users can manage own alert outcomes" ON public.alert_outcomes
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for learning_progress
CREATE POLICY "Users can manage own learning progress" ON public.learning_progress
  FOR ALL USING (auth.uid() = user_id);

-- Create function to update strategy stats
CREATE OR REPLACE FUNCTION update_strategy_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'strategy_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.community_strategies 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.strategy_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.community_strategies 
      SET likes_count = GREATEST(0, likes_count - 1) 
      WHERE id = OLD.strategy_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'strategy_downloads' AND TG_OP = 'INSERT' THEN
    UPDATE public.community_strategies 
    SET downloads_count = downloads_count + 1 
    WHERE id = NEW.strategy_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic stats updates
CREATE TRIGGER update_likes_count
  AFTER INSERT OR DELETE ON public.strategy_likes
  FOR EACH ROW EXECUTE FUNCTION update_strategy_stats();

CREATE TRIGGER update_downloads_count
  AFTER INSERT ON public.strategy_downloads
  FOR EACH ROW EXECUTE FUNCTION update_strategy_stats();

-- Add indexes for performance
CREATE INDEX idx_community_strategies_user_id ON public.community_strategies(user_id);
CREATE INDEX idx_community_strategies_tags ON public.community_strategies USING GIN(tags);
CREATE INDEX idx_community_strategies_likes ON public.community_strategies(likes_count DESC);
CREATE INDEX idx_strategy_likes_strategy_id ON public.strategy_likes(strategy_id);
CREATE INDEX idx_alert_outcomes_user_id ON public.alert_outcomes(user_id);
CREATE INDEX idx_learning_progress_user_pattern ON public.learning_progress(user_id, pattern_type);