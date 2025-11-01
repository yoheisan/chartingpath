-- Add unique constraint for upserting economic events
-- This allows us to update existing events or insert new ones without conflicts
ALTER TABLE public.economic_events 
ADD CONSTRAINT economic_events_unique_event 
UNIQUE (event_name, scheduled_time, region);

-- Add index for faster queries by scheduled_time
CREATE INDEX IF NOT EXISTS idx_economic_events_scheduled_time 
ON public.economic_events(scheduled_time DESC);

-- Add index for faster filtering by region
CREATE INDEX IF NOT EXISTS idx_economic_events_region 
ON public.economic_events(region);

-- Add index for faster filtering by impact_level
CREATE INDEX IF NOT EXISTS idx_economic_events_impact_level 
ON public.economic_events(impact_level);