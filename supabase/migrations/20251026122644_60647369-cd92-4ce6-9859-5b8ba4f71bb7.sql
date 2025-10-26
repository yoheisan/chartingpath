-- Economic Calendar: user preferences and event tracking
CREATE TABLE IF NOT EXISTS public.economic_calendar_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  regions TEXT[] DEFAULT ARRAY['US', 'EU', 'UK', 'JP', 'CN'],
  indicator_types TEXT[] DEFAULT ARRAY['inflation', 'employment', 'gdp', 'interest_rate', 'manufacturing'],
  impact_levels TEXT[] DEFAULT ARRAY['high'], -- 'low', 'medium', 'high'
  email_enabled BOOLEAN DEFAULT false,
  email_frequency TEXT DEFAULT 'instant', -- 'instant', 'daily', 'weekly'
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id TEXT,
  twitter_enabled BOOLEAN DEFAULT false,
  twitter_username TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Event history for tracking releases
CREATE TABLE IF NOT EXISTS public.economic_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  region TEXT NOT NULL,
  indicator_type TEXT NOT NULL,
  impact_level TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_value TEXT,
  forecast_value TEXT,
  previous_value TEXT,
  market_impact TEXT,
  released BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User alert history
CREATE TABLE IF NOT EXISTS public.economic_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.economic_events(id),
  delivery_method TEXT NOT NULL, -- 'email', 'telegram', 'twitter'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'sent' -- 'sent', 'failed', 'pending'
);

-- Enable RLS
ALTER TABLE public.economic_calendar_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for preferences
CREATE POLICY "Users can view their own preferences"
  ON public.economic_calendar_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.economic_calendar_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.economic_calendar_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.economic_calendar_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for events (public read)
CREATE POLICY "Anyone can view economic events"
  ON public.economic_events FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage events"
  ON public.economic_events FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for alerts
CREATE POLICY "Users can view their own alerts"
  ON public.economic_alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_economic_events_scheduled ON public.economic_events(scheduled_time);
CREATE INDEX idx_economic_events_released ON public.economic_events(released);
CREATE INDEX idx_economic_alerts_user ON public.economic_alerts(user_id);
CREATE INDEX idx_economic_alerts_event ON public.economic_alerts(event_id);

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.handle_economic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_economic_preferences_updated_at
  BEFORE UPDATE ON public.economic_calendar_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_economic_updated_at();

CREATE TRIGGER update_economic_events_updated_at
  BEFORE UPDATE ON public.economic_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_economic_updated_at();