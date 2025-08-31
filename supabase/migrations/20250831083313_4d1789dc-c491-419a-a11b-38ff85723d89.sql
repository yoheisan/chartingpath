-- Create table to track Backtester V2 usage
CREATE TABLE public.backtester_v2_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  runs_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, run_date)
);

-- Enable Row Level Security
ALTER TABLE public.backtester_v2_usage ENABLE ROW LEVEL SECURITY;

-- Create policies for backtester V2 usage tracking
CREATE POLICY "Users can view their own V2 usage" 
ON public.backtester_v2_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own V2 usage" 
ON public.backtester_v2_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own V2 usage" 
ON public.backtester_v2_usage 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to increment V2 usage
CREATE OR REPLACE FUNCTION public.increment_backtester_v2_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_usage INTEGER;
BEGIN
  -- Insert or update usage for today
  INSERT INTO public.backtester_v2_usage (user_id, run_date, runs_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, run_date)
  DO UPDATE SET 
    runs_count = backtester_v2_usage.runs_count + 1,
    updated_at = now()
  RETURNING runs_count INTO current_usage;
  
  RETURN current_usage;
END;
$$;

-- Create function to get current V2 usage
CREATE OR REPLACE FUNCTION public.get_backtester_v2_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_usage INTEGER := 0;
BEGIN
  SELECT runs_count INTO current_usage
  FROM public.backtester_v2_usage
  WHERE user_id = p_user_id AND run_date = CURRENT_DATE;
  
  RETURN COALESCE(current_usage, 0);
END;
$$;