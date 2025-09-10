-- Create table for guided strategies
CREATE TABLE public.guided_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  backtest_results JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guided_strategies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own guided strategies" 
ON public.guided_strategies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own guided strategies" 
ON public.guided_strategies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guided strategies" 
ON public.guided_strategies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guided strategies" 
ON public.guided_strategies 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public guided strategies" 
ON public.guided_strategies 
FOR SELECT 
USING (is_public = true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_guided_strategies_updated_at
BEFORE UPDATE ON public.guided_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();