
-- Quiz question translations table
CREATE TABLE public.quiz_question_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'auto_translated' CHECK (status IN ('auto_translated', 'approved', 'rejected')),
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  source_hash TEXT,
  translated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, language_code)
);

-- Index for fast lookups
CREATE INDEX idx_quiz_question_translations_lang ON public.quiz_question_translations(language_code, status);

-- RLS
ALTER TABLE public.quiz_question_translations ENABLE ROW LEVEL SECURITY;

-- Public read for approved/auto_translated
CREATE POLICY "Anyone can read quiz translations"
  ON public.quiz_question_translations
  FOR SELECT
  USING (status IN ('approved', 'auto_translated'));

-- Admin write
CREATE POLICY "Admins can manage quiz translations"
  ON public.quiz_question_translations
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access quiz translations"
  ON public.quiz_question_translations
  FOR ALL
  USING (public.is_service_role());
