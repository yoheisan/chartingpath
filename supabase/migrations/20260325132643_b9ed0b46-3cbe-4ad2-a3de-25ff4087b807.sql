ALTER TABLE public.user_email_preferences
ADD COLUMN IF NOT EXISTS morning_briefing_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';