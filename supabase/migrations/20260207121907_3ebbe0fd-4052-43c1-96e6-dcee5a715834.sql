-- Create table to store copilot feedback and question analytics
CREATE TABLE public.copilot_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  question TEXT NOT NULL,
  response TEXT,
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  topics TEXT[],
  intent_category TEXT,
  response_helpful BOOLEAN,
  content_gap_identified BOOLEAN DEFAULT false,
  content_gap_description TEXT,
  priority_score INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copilot_feedback ENABLE ROW LEVEL SECURITY;

-- Allow inserting for all (anonymous users can submit feedback)
CREATE POLICY "Anyone can submit feedback"
ON public.copilot_feedback
FOR INSERT
WITH CHECK (true);

-- Only authenticated users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.copilot_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for priority queries
CREATE INDEX idx_copilot_feedback_priority ON public.copilot_feedback(priority_score DESC, created_at DESC);
CREATE INDEX idx_copilot_feedback_gaps ON public.copilot_feedback(content_gap_identified, resolved);

-- Add updated_at trigger
CREATE TRIGGER update_copilot_feedback_updated_at
BEFORE UPDATE ON public.copilot_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();