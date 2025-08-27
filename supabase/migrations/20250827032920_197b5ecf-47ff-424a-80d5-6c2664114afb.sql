-- Fix the relationship between translations and translation_keys tables
-- Add foreign key constraint to link translations.key to translation_keys.key
ALTER TABLE public.translations 
ADD CONSTRAINT fk_translations_key 
FOREIGN KEY (key) REFERENCES public.translation_keys(key) 
ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_language_status ON public.translations(language_code, status);
CREATE INDEX IF NOT EXISTS idx_translations_manual_override ON public.translations(key, language_code, status);

-- Add columns to track manual overrides and automation source
ALTER TABLE public.translations 
ADD COLUMN IF NOT EXISTS is_manual_override boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS automation_source text DEFAULT null,
ADD COLUMN IF NOT EXISTS original_automated_value text DEFAULT null,
ADD COLUMN IF NOT EXISTS context_page text DEFAULT null,
ADD COLUMN IF NOT EXISTS context_element text DEFAULT null;

-- Add column to translation_keys for better categorization
ALTER TABLE public.translation_keys
ADD COLUMN IF NOT EXISTS page_context text DEFAULT null,
ADD COLUMN IF NOT EXISTS element_context text DEFAULT null;