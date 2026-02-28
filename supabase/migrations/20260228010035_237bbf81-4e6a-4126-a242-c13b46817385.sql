-- Create copilot_platform_context table
CREATE TABLE public.copilot_platform_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  context_type TEXT NOT NULL,
  context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 hours')
);

-- Create unique index on context_type for upsert
CREATE UNIQUE INDEX idx_copilot_platform_context_type ON public.copilot_platform_context (context_type);

-- Enable RLS
ALTER TABLE public.copilot_platform_context ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on copilot_platform_context" ON public.copilot_platform_context
  FOR ALL USING (public.is_service_role());

-- Allow public read for the copilot to consume
CREATE POLICY "Public read copilot_platform_context" ON public.copilot_platform_context
  FOR SELECT USING (true);

-- Add auto_expires_at column to copilot_learned_rules
ALTER TABLE public.copilot_learned_rules
  ADD COLUMN IF NOT EXISTS auto_expires_at TIMESTAMPTZ;

-- Update existing rows to have source='manual' where null
UPDATE public.copilot_learned_rules SET source = 'manual' WHERE source IS NULL;