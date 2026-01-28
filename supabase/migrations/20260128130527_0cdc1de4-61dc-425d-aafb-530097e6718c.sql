-- Historical pattern occurrences table for storing all detected patterns across time
-- This enables studying pattern history for any ticker

CREATE TABLE public.historical_pattern_occurrences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('bullish', 'bearish')),
  timeframe TEXT NOT NULL DEFAULT '1d',
  
  -- Pattern detection timing
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  pattern_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  pattern_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Price levels at detection
  entry_price NUMERIC NOT NULL,
  stop_loss_price NUMERIC NOT NULL,
  take_profit_price NUMERIC NOT NULL,
  risk_reward_ratio NUMERIC NOT NULL,
  
  -- Quality assessment
  quality_score TEXT DEFAULT 'B',
  quality_reasons TEXT[],
  
  -- Outcome tracking (filled after pattern resolves)
  outcome TEXT CHECK (outcome IN ('hit_tp', 'hit_sl', 'timeout', 'pending', 'invalidated')),
  outcome_price NUMERIC,
  outcome_date TIMESTAMP WITH TIME ZONE,
  outcome_pnl_percent NUMERIC,
  bars_to_outcome INTEGER,
  
  -- Visual data for chart rendering
  visual_spec JSONB NOT NULL DEFAULT '{}',
  bars JSONB NOT NULL DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_historical_patterns_symbol ON public.historical_pattern_occurrences(symbol);
CREATE INDEX idx_historical_patterns_asset_type ON public.historical_pattern_occurrences(asset_type);
CREATE INDEX idx_historical_patterns_pattern_id ON public.historical_pattern_occurrences(pattern_id);
CREATE INDEX idx_historical_patterns_detected_at ON public.historical_pattern_occurrences(detected_at DESC);
CREATE INDEX idx_historical_patterns_symbol_pattern ON public.historical_pattern_occurrences(symbol, pattern_id);
CREATE INDEX idx_historical_patterns_outcome ON public.historical_pattern_occurrences(outcome) WHERE outcome IS NOT NULL;

-- Composite index for ticker study page queries
CREATE INDEX idx_historical_patterns_symbol_timeframe ON public.historical_pattern_occurrences(symbol, timeframe, detected_at DESC);

-- Enable RLS
ALTER TABLE public.historical_pattern_occurrences ENABLE ROW LEVEL SECURITY;

-- Anyone can read historical patterns (public data for learning)
CREATE POLICY "Anyone can view historical patterns"
ON public.historical_pattern_occurrences
FOR SELECT
USING (true);

-- Service role can manage patterns (for edge functions)
CREATE POLICY "Service can manage historical patterns"
ON public.historical_pattern_occurrences
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_historical_patterns_updated_at
BEFORE UPDATE ON public.historical_pattern_occurrences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();