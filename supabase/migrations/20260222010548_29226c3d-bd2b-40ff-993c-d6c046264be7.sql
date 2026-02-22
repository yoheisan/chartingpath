
-- Drop the old status check constraint and add auto_translated
ALTER TABLE public.translations DROP CONSTRAINT IF EXISTS translations_status_check;
ALTER TABLE public.translations ADD CONSTRAINT translations_status_check CHECK (status IN ('pending', 'approved', 'auto_translated'));
