CREATE TABLE public.email_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.email_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (guest email capture)
CREATE POLICY "Anyone can submit email leads"
  ON public.email_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only service role can read
CREATE POLICY "Service role can read email leads"
  ON public.email_leads
  FOR SELECT
  TO authenticated
  USING (false);