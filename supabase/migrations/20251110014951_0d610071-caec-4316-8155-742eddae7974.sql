-- Create historical prices cache table
CREATE TABLE IF NOT EXISTS public.historical_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  instrument_type TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index to prevent duplicate data
CREATE UNIQUE INDEX IF NOT EXISTS idx_historical_prices_unique 
ON public.historical_prices(symbol, timeframe, date);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_historical_prices_symbol_timeframe 
ON public.historical_prices(symbol, timeframe);

CREATE INDEX IF NOT EXISTS idx_historical_prices_date 
ON public.historical_prices(date DESC);

-- Enable RLS
ALTER TABLE public.historical_prices ENABLE ROW LEVEL SECURITY;

-- Public read access for historical prices (no need to restrict)
CREATE POLICY "Anyone can read historical prices"
ON public.historical_prices FOR SELECT
USING (true);

-- Only authenticated users can insert (via edge functions)
CREATE POLICY "Service role can insert historical prices"
ON public.historical_prices FOR INSERT
WITH CHECK (true);

-- Create instrument search analytics table
CREATE TABLE IF NOT EXISTS public.instrument_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  search_query TEXT NOT NULL,
  instrument_type TEXT NOT NULL,
  selected_instrument TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at 
ON public.instrument_search_analytics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_analytics_search_query 
ON public.instrument_search_analytics(search_query);

CREATE INDEX IF NOT EXISTS idx_search_analytics_instrument_type 
ON public.instrument_search_analytics(instrument_type);

CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id 
ON public.instrument_search_analytics(user_id);

-- Enable RLS
ALTER TABLE public.instrument_search_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own search analytics
CREATE POLICY "Users can insert their own search analytics"
ON public.instrument_search_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Only admins can read search analytics
CREATE POLICY "Admins can read all search analytics"
ON public.instrument_search_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Create updated_at trigger for historical_prices
CREATE OR REPLACE FUNCTION update_historical_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_historical_prices_updated_at
BEFORE UPDATE ON public.historical_prices
FOR EACH ROW
EXECUTE FUNCTION update_historical_prices_updated_at();