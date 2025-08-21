-- Create enum for chart patterns
CREATE TYPE public.chart_pattern AS ENUM (
  'hammer',
  'inverted_hammer', 
  'bullish_engulfing',
  'bearish_engulfing',
  'doji',
  'morning_star',
  'evening_star',
  'ema_cross_bullish',
  'ema_cross_bearish',
  'rsi_divergence_bullish',
  'rsi_divergence_bearish'
);

-- Create enum for timeframes
CREATE TYPE public.timeframe AS ENUM (
  '15m',
  '1h', 
  '4h',
  '1d'
);

-- Create enum for alert status
CREATE TYPE public.alert_status AS ENUM (
  'active',
  'paused',
  'deleted'
);

-- Create enum for subscription plans
CREATE TYPE public.subscription_plan AS ENUM (
  'starter',
  'pro', 
  'elite'
);

-- Create profiles table for user subscription info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan subscription_plan DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'active',
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  timeframe timeframe NOT NULL,
  pattern chart_pattern NOT NULL,
  status alert_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on alerts table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Policies for alerts table
CREATE POLICY "Users can read own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts" ON public.alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Create alerts_log table for tracking sent alerts
CREATE TABLE public.alerts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  pattern_data JSONB,
  price_data JSONB
);

-- Enable RLS on alerts_log table
ALTER TABLE public.alerts_log ENABLE ROW LEVEL SECURITY;

-- Policy for alerts_log (users can read logs for their alerts)
CREATE POLICY "Users can read own alert logs" ON public.alerts_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.alerts 
      WHERE alerts.id = alerts_log.alert_id 
      AND alerts.user_id = auth.uid()
    )
  );

-- Allow edge functions to insert into alerts_log
CREATE POLICY "Edge functions can insert alert logs" ON public.alerts_log
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check alert limits based on subscription plan
CREATE OR REPLACE FUNCTION public.check_alert_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan subscription_plan;
  current_alert_count INTEGER;
  max_alerts INTEGER;
BEGIN
  -- Get user's subscription plan
  SELECT subscription_plan INTO user_plan
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- If no profile exists, default to starter
  IF user_plan IS NULL THEN
    user_plan := 'starter';
  END IF;
  
  -- Set alert limits based on plan
  CASE user_plan
    WHEN 'starter' THEN max_alerts := 0; -- No alerts for starter
    WHEN 'pro' THEN max_alerts := 3;
    WHEN 'elite' THEN max_alerts := 999999; -- Unlimited
  END CASE;
  
  -- Count current active alerts
  SELECT COUNT(*) INTO current_alert_count
  FROM public.alerts
  WHERE user_id = NEW.user_id AND status = 'active';
  
  -- Check if limit would be exceeded
  IF current_alert_count >= max_alerts THEN
    RAISE EXCEPTION 'Alert limit exceeded for your subscription plan. Upgrade to create more alerts.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce alert limits
CREATE TRIGGER check_alert_limit_trigger
  BEFORE INSERT ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_alert_limit();