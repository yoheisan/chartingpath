-- Fix security issues from previous migration

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS quiz_analytics;

-- Recreate view without security definer
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

-- Fix get_quiz_questions function to include SET search_path
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix update_quiz_question_stats function
CREATE OR REPLACE FUNCTION update_quiz_question_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.quiz_questions
  SET 
    times_shown = times_shown + 1,
    times_correct = times_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = NEW.question_id;
  
  RETURN NEW;
END;
$$;