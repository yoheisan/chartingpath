
-- Add morning brief tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_brief_sent_at timestamptz;
