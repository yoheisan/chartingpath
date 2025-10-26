-- Add indexes for ultra-fast economic calendar queries
CREATE INDEX IF NOT EXISTS idx_economic_events_scheduled_time ON public.economic_events(scheduled_time DESC);
CREATE INDEX IF NOT EXISTS idx_economic_events_impact_level ON public.economic_events(impact_level);
CREATE INDEX IF NOT EXISTS idx_economic_events_region ON public.economic_events(region);
CREATE INDEX IF NOT EXISTS idx_economic_events_composite ON public.economic_events(scheduled_time DESC, impact_level, region);

-- Enable realtime for instant updates (zero-latency display)
ALTER TABLE public.economic_events REPLICA IDENTITY FULL;