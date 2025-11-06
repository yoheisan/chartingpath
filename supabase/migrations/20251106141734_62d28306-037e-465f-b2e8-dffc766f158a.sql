-- Create daily AI usage tracking table
CREATE TABLE IF NOT EXISTS public.daily_ai_usage (
  date TEXT PRIMARY KEY,
  usd_spent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all records
CREATE POLICY "Service role can manage daily AI usage"
  ON public.daily_ai_usage
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Admins can view usage
CREATE POLICY "Admins can view daily AI usage"
  ON public.daily_ai_usage
  FOR SELECT
  USING (is_admin(auth.uid()));