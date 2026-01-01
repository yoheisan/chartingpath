-- Pattern Hit Rates Table for Historical Performance Tracking
-- Stores aggregated statistics for pattern detection performance

CREATE TABLE IF NOT EXISTS public.pattern_hit_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  timeframe TEXT NOT NULL,
  instrument_category TEXT, -- 'stocks', 'forex', 'crypto', 'commodities'
  
  -- Core Statistics
  total_signals INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  avg_r_multiple NUMERIC(8,4) NOT NULL DEFAULT 0,
  expectancy NUMERIC(8,4) NOT NULL DEFAULT 0,
  profit_factor NUMERIC(8,4) NOT NULL DEFAULT 0,
  max_drawdown_r NUMERIC(8,4) DEFAULT 0,
  
  -- Time-based metrics
  avg_holding_bars INTEGER DEFAULT 0,
  avg_holding_hours NUMERIC(10,2) DEFAULT 0,
  
  -- Regime breakdown (JSONB for flexibility)
  regime_breakdown JSONB DEFAULT '[]'::jsonb,
  
  -- Quality metrics
  reliability_score INTEGER NOT NULL DEFAULT 0 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  sample_confidence TEXT CHECK (sample_confidence IN ('low', 'medium', 'high', 'very_high')),
  
  -- Metadata
  first_signal_date TIMESTAMP WITH TIME ZONE,
  last_signal_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint for pattern+timeframe+category
  CONSTRAINT unique_pattern_timeframe UNIQUE (pattern_id, timeframe, instrument_category)
);

-- Pattern Outcomes Table for individual trade tracking
CREATE TABLE IF NOT EXISTS public.pattern_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_hit_rate_id UUID REFERENCES public.pattern_hit_rates(id) ON DELETE CASCADE,
  
  -- Signal details
  instrument TEXT NOT NULL,
  signal_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  
  -- Entry/Exit
  entry_price NUMERIC(20,8) NOT NULL,
  exit_price NUMERIC(20,8),
  stop_loss NUMERIC(20,8) NOT NULL,
  take_profit NUMERIC(20,8) NOT NULL,
  
  -- Result
  is_win BOOLEAN,
  r_multiple NUMERIC(8,4),
  exit_reason TEXT CHECK (exit_reason IN ('tp_hit', 'sl_hit', 'time_stop', 'manual', 'pending')),
  holding_bars INTEGER,
  
  -- Context
  regime_key TEXT,
  quality_score NUMERIC(4,2),
  volume_confirmed BOOLEAN DEFAULT false,
  trend_aligned BOOLEAN DEFAULT false,
  
  -- Timestamps
  exit_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pattern_hit_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pattern_hit_rates (public read, service write)
CREATE POLICY "Anyone can read pattern hit rates"
  ON public.pattern_hit_rates
  FOR SELECT
  USING (true);

CREATE POLICY "Service can manage pattern hit rates"
  ON public.pattern_hit_rates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for pattern_outcomes
CREATE POLICY "Anyone can read pattern outcomes"
  ON public.pattern_outcomes
  FOR SELECT
  USING (true);

CREATE POLICY "Service can manage pattern outcomes"
  ON public.pattern_outcomes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pattern_hit_rates_lookup 
  ON public.pattern_hit_rates(pattern_id, timeframe);
  
CREATE INDEX IF NOT EXISTS idx_pattern_hit_rates_performance 
  ON public.pattern_hit_rates(win_rate DESC, expectancy DESC);

CREATE INDEX IF NOT EXISTS idx_pattern_outcomes_hit_rate 
  ON public.pattern_outcomes(pattern_hit_rate_id);

CREATE INDEX IF NOT EXISTS idx_pattern_outcomes_signal_time 
  ON public.pattern_outcomes(signal_timestamp DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_pattern_hit_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pattern_hit_rates_timestamp
  BEFORE UPDATE ON public.pattern_hit_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pattern_hit_rates_updated_at();

-- Function to recalculate hit rate stats from outcomes
CREATE OR REPLACE FUNCTION public.recalculate_pattern_stats(p_hit_rate_id UUID)
RETURNS VOID AS $$
DECLARE
  stats RECORD;
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_win = true) as wins,
    COUNT(*) FILTER (WHERE is_win = false) as losses,
    AVG(r_multiple) as avg_r,
    AVG(holding_bars) as avg_bars,
    MIN(signal_timestamp) as first_signal,
    MAX(signal_timestamp) as last_signal
  INTO stats
  FROM public.pattern_outcomes
  WHERE pattern_hit_rate_id = p_hit_rate_id
    AND is_win IS NOT NULL;
  
  UPDATE public.pattern_hit_rates
  SET
    total_signals = stats.total,
    wins = stats.wins,
    losses = stats.losses,
    win_rate = CASE WHEN stats.total > 0 THEN stats.wins::NUMERIC / stats.total ELSE 0 END,
    avg_r_multiple = COALESCE(stats.avg_r, 0),
    expectancy = COALESCE(stats.avg_r, 0),
    avg_holding_bars = COALESCE(stats.avg_bars::INTEGER, 0),
    first_signal_date = stats.first_signal,
    last_signal_date = stats.last_signal,
    reliability_score = LEAST(100, GREATEST(0, (stats.total * 2))),
    sample_confidence = CASE 
      WHEN stats.total >= 100 THEN 'very_high'
      WHEN stats.total >= 50 THEN 'high'
      WHEN stats.total >= 20 THEN 'medium'
      ELSE 'low'
    END,
    updated_at = now()
  WHERE id = p_hit_rate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;