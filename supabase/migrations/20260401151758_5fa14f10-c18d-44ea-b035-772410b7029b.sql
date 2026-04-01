
-- Add onboarding columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trading_plan_structured jsonb DEFAULT NULL;

-- Add flow_type to copilot_conversations
ALTER TABLE public.copilot_conversations
ADD COLUMN IF NOT EXISTS flow_type text NOT NULL DEFAULT 'general';
