-- Community chat messages table
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.community_messages(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'message' CHECK (message_type IN ('message', 'question', 'feedback', 'urgent')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted', 'resolved')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  is_ai_response BOOLEAN NOT NULL DEFAULT false,
  ai_confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community message likes table
CREATE TABLE public.community_message_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Moderator reports table
CREATE TABLE public.moderator_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'feature_request', 'bug_report', 'inappropriate_content')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Community analytics table
CREATE TABLE public.community_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  ai_responses INTEGER NOT NULL DEFAULT 0,
  user_responses INTEGER NOT NULL DEFAULT 0,
  avg_response_time_minutes INTEGER,
  top_categories JSONB,
  sentiment_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date)
);

-- Enable RLS on all tables
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_message_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderator_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for community_messages
CREATE POLICY "Community messages are viewable by everyone" 
ON public.community_messages FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can create their own messages" 
ON public.community_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
ON public.community_messages FOR UPDATE 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- RLS policies for community_message_likes
CREATE POLICY "Message likes are viewable by everyone" 
ON public.community_message_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own likes" 
ON public.community_message_likes FOR ALL 
USING (auth.uid() = user_id);

-- RLS policies for moderator_reports
CREATE POLICY "Users can view their own reports" 
ON public.moderator_reports FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create reports" 
ON public.moderator_reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reports" 
ON public.moderator_reports FOR ALL 
USING (public.is_admin(auth.uid()));

-- RLS policies for community_analytics
CREATE POLICY "Analytics are viewable by admins only" 
ON public.community_analytics FOR ALL 
USING (public.is_admin(auth.uid()));

-- Triggers for updating counts
CREATE OR REPLACE FUNCTION public.update_message_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_TABLE_NAME = 'community_message_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.community_messages 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.message_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.community_messages 
      SET likes_count = GREATEST(0, likes_count - 1) 
      WHERE id = OLD.message_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_messages' AND TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.community_messages 
    SET replies_count = replies_count + 1 
    WHERE id = NEW.parent_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER update_message_likes_stats
  AFTER INSERT OR DELETE ON public.community_message_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_message_stats();

CREATE TRIGGER update_message_replies_stats
  AFTER INSERT ON public.community_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_message_stats();

-- Add updated_at trigger
CREATE TRIGGER update_community_messages_updated_at
  BEFORE UPDATE ON public.community_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_moderator_reports_updated_at
  BEFORE UPDATE ON public.moderator_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();