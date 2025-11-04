-- Create table to store pre-generated market reports
CREATE TABLE IF NOT EXISTS public.market_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone TEXT NOT NULL,
  report_content TEXT NOT NULL,
  markets TEXT[] NOT NULL DEFAULT ARRAY['stocks', 'forex', 'crypto', 'commodities'],
  time_span TEXT NOT NULL DEFAULT 'previous_day',
  tone TEXT NOT NULL DEFAULT 'professional',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_market_reports_timezone_generated 
ON public.market_reports(timezone, generated_at DESC);

-- Enable RLS
ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read reports (public data)
CREATE POLICY "Anyone can read market reports"
ON public.market_reports FOR SELECT
TO public
USING (true);

-- Only service role can insert/update reports (via edge function)
CREATE POLICY "Service role can manage reports"
ON public.market_reports FOR ALL
TO service_role
USING (true)
WITH CHECK (true);