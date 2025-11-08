-- Create quiz categories enum
CREATE TYPE quiz_category AS ENUM (
  'visual_recognition',
  'characteristics',
  'statistics',
  'risk_management',
  'professional_practices'
);

-- Create quiz difficulty enum
CREATE TYPE quiz_difficulty AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_code TEXT UNIQUE NOT NULL,
  category quiz_category NOT NULL,
  difficulty quiz_difficulty NOT NULL DEFAULT 'intermediate',
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of answer options
  correct_answer INTEGER NOT NULL, -- Index of correct answer
  explanation TEXT NOT NULL,
  
  -- Image metadata for visual questions
  pattern_name TEXT,
  pattern_key TEXT, -- Reference to chart pattern image identifier
  image_url TEXT, -- Optional: direct URL to image
  image_metadata JSONB DEFAULT '{}', -- Additional image info (dimensions, alt text, etc.)
  
  -- Categorization and filtering
  tags TEXT[] DEFAULT '{}',
  related_patterns TEXT[] DEFAULT '{}',
  
  -- Statistics and engagement
  times_shown INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  
  -- Management
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Validation
  CONSTRAINT valid_correct_answer CHECK (correct_answer >= 0),
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2)
);

-- Create index for efficient queries
CREATE INDEX idx_quiz_questions_category ON public.quiz_questions(category);
CREATE INDEX idx_quiz_questions_difficulty ON public.quiz_questions(difficulty);
CREATE INDEX idx_quiz_questions_pattern_key ON public.quiz_questions(pattern_key);
CREATE INDEX idx_quiz_questions_active ON public.quiz_questions(is_active);
CREATE INDEX idx_quiz_questions_tags ON public.quiz_questions USING GIN(tags);

-- Create quiz attempts table to track user progress
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  question_id UUID REFERENCES public.quiz_questions(id) NOT NULL,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Context
  quiz_session_id UUID, -- Group attempts in same session
  device_type TEXT,
  
  CONSTRAINT valid_selected_answer CHECK (selected_answer >= 0)
);

-- Create indexes for quiz attempts
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_question ON public.quiz_attempts(question_id);
CREATE INDEX idx_quiz_attempts_session ON public.quiz_attempts(quiz_session_id);
CREATE INDEX idx_quiz_attempts_date ON public.quiz_attempts(attempted_at);

-- Create pattern images reference table
CREATE TABLE public.pattern_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_key TEXT UNIQUE NOT NULL,
  pattern_name TEXT NOT NULL,
  image_path TEXT NOT NULL, -- Path to image file
  image_url TEXT, -- Full URL if hosted externally
  thumbnail_url TEXT,
  
  -- Metadata
  alt_text TEXT NOT NULL,
  description TEXT,
  pattern_type TEXT, -- 'reversal', 'continuation', etc.
  is_bullish BOOLEAN,
  tags TEXT[] DEFAULT '{}',
  
  -- Technical details
  width INTEGER,
  height INTEGER,
  file_size_bytes INTEGER,
  mime_type TEXT DEFAULT 'image/png',
  
  -- Management
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for pattern images
CREATE INDEX idx_pattern_images_key ON public.pattern_images(pattern_key);
CREATE INDEX idx_pattern_images_active ON public.pattern_images(is_active);

-- Enable Row Level Security
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_questions
CREATE POLICY "Anyone can view active quiz questions"
  ON public.quiz_questions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage quiz questions"
  ON public.quiz_questions
  FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
  ON public.quiz_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts"
  ON public.quiz_attempts
  FOR SELECT
  USING (is_admin(auth.uid()));

-- RLS Policies for pattern_images
CREATE POLICY "Anyone can view active pattern images"
  ON public.pattern_images
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pattern images"
  ON public.pattern_images
  FOR ALL
  USING (is_admin(auth.uid()));

-- Create function to update quiz statistics
CREATE OR REPLACE FUNCTION update_quiz_question_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.quiz_questions
  SET 
    times_shown = times_shown + 1,
    times_correct = times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = NEW.question_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating stats
CREATE TRIGGER trigger_update_quiz_stats
  AFTER INSERT ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_quiz_question_stats();

-- Create function to get quiz questions by category
CREATE OR REPLACE FUNCTION get_quiz_questions(
  p_category quiz_category DEFAULT NULL,
  p_difficulty quiz_difficulty DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  question_code TEXT,
  category quiz_category,
  difficulty quiz_difficulty,
  question_text TEXT,
  options JSONB,
  correct_answer INTEGER,
  explanation TEXT,
  pattern_name TEXT,
  pattern_key TEXT,
  image_url TEXT,
  image_metadata JSONB,
  tags TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_code,
    q.category,
    q.difficulty,
    q.question_text,
    q.options,
    q.correct_answer,
    q.explanation,
    q.pattern_name,
    q.pattern_key,
    q.image_url,
    q.image_metadata,
    q.tags
  FROM public.quiz_questions q
  WHERE 
    q.is_active = true
    AND (p_category IS NULL OR q.category = p_category)
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for quiz analytics
CREATE OR REPLACE VIEW quiz_analytics AS
SELECT 
  q.id,
  q.question_code,
  q.category,
  q.difficulty,
  q.pattern_name,
  q.times_shown,
  q.times_correct,
  CASE 
    WHEN q.times_shown > 0 THEN ROUND((q.times_correct::NUMERIC / q.times_shown::NUMERIC) * 100, 2)
    ELSE 0 
  END as success_rate_percentage,
  COUNT(DISTINCT qa.user_id) as unique_users_attempted,
  AVG(qa.time_taken_seconds) as avg_time_taken_seconds
FROM public.quiz_questions q
LEFT JOIN public.quiz_attempts qa ON q.id = qa.question_id
WHERE q.is_active = true
GROUP BY q.id, q.question_code, q.category, q.difficulty, q.pattern_name, q.times_shown, q.times_correct;

-- Grant access to view
GRANT SELECT ON quiz_analytics TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.quiz_questions IS 'Stores all quiz questions with metadata for pattern recognition quizzes';
COMMENT ON TABLE public.quiz_attempts IS 'Tracks user attempts and answers for quiz questions';
COMMENT ON TABLE public.pattern_images IS 'Central repository for chart pattern images with metadata';
COMMENT ON COLUMN public.quiz_questions.pattern_key IS 'Key to look up associated pattern image (e.g., head-shoulders, double-top)';
COMMENT ON COLUMN public.quiz_questions.image_metadata IS 'JSON object containing image dimensions, alt text, caption, etc.';
COMMENT ON FUNCTION get_quiz_questions IS 'Retrieves random quiz questions filtered by category and difficulty';