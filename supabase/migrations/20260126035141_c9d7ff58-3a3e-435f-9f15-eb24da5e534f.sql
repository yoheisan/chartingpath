-- Table to persist detected patterns and track their lifecycle
CREATE TABLE public.live_pattern_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instrument TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  timeframe TEXT NOT NULL DEFAULT '1d',
  asset_type TEXT NOT NULL,
  
  -- When the pattern was first detected
  first_detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Last time the scanner confirmed this pattern is still valid
  last_confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Pattern status lifecycle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invalidated', 'triggered', 'expired')),
  
  -- Trade plan at detection time
  entry_price NUMERIC NOT NULL,
  stop_loss_price NUMERIC NOT NULL,
  take_profit_price NUMERIC NOT NULL,
  risk_reward_ratio NUMERIC NOT NULL,
  
  -- Visual spec and bar data for rendering
  visual_spec JSONB NOT NULL,
  bars JSONB NOT NULL,
  
  -- Price tracking
  current_price NUMERIC,
  prev_close NUMERIC,
  change_percent NUMERIC,
  
  -- Quality scoring
  quality_score TEXT DEFAULT 'B',
  quality_reasons TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one active pattern per instrument+pattern combo
  CONSTRAINT unique_active_pattern UNIQUE (instrument, pattern_id, timeframe, status)
);

-- Index for efficient querying
CREATE INDEX idx_live_patterns_status ON public.live_pattern_detections(status);
CREATE INDEX idx_live_patterns_asset_type ON public.live_pattern_detections(asset_type);
CREATE INDEX idx_live_patterns_first_detected ON public.live_pattern_detections(first_detected_at DESC);
CREATE INDEX idx_live_patterns_instrument ON public.live_pattern_detections(instrument);

-- Enable RLS (public read for the screener, no write from client)
ALTER TABLE public.live_pattern_detections ENABLE ROW LEVEL SECURITY;

-- Anyone can read active patterns (public screener)
CREATE POLICY "Anyone can view active patterns"
  ON public.live_pattern_detections
  FOR SELECT
  USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_live_pattern_detections_updated_at
  BEFORE UPDATE ON public.live_pattern_detections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to mark stale patterns as expired (not seen in 3 days)
CREATE OR REPLACE FUNCTION public.expire_stale_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.live_pattern_detections
  SET status = 'expired'
  WHERE status = 'active'
    AND last_confirmed_at < now() - interval '3 days';
END;
$$;