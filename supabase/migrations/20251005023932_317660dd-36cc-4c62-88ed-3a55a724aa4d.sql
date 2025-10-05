-- Create table for market report email subscriptions
CREATE TABLE IF NOT EXISTS public.market_report_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  markets TEXT[] NOT NULL DEFAULT ARRAY['stocks', 'forex', 'crypto', 'commodities'],
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  send_time TIME NOT NULL DEFAULT '09:00:00',
  tone TEXT NOT NULL DEFAULT 'professional' CHECK (tone IN ('concise', 'narrative', 'professional')),
  time_span TEXT NOT NULL DEFAULT 'previous_day' CHECK (time_span IN ('previous_day', 'past_5_sessions')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.market_report_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.market_report_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
  ON public.market_report_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.market_report_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.market_report_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_market_report_subscriptions_updated_at
  BEFORE UPDATE ON public.market_report_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();