-- Add bot suspect flag to analytics_events
ALTER TABLE public.analytics_events
ADD COLUMN IF NOT EXISTS is_bot_suspect BOOLEAN NOT NULL DEFAULT false;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_analytics_events_bot_suspect
ON public.analytics_events (is_bot_suspect) WHERE is_bot_suspect = true;

-- Trigger function: flag CN + Direct (no referrer) as bot suspect
CREATE OR REPLACE FUNCTION public.flag_bot_suspect_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (
    (NEW.properties->>'country') = 'CN'
    AND (
      (NEW.properties->>'referrer') IS NULL
      OR (NEW.properties->>'referrer') = ''
      OR (NEW.properties->>'referrer') = 'null'
    )
  ) THEN
    NEW.is_bot_suspect := true;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger on every INSERT
DROP TRIGGER IF EXISTS trg_flag_bot_suspect ON public.analytics_events;
CREATE TRIGGER trg_flag_bot_suspect
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.flag_bot_suspect_analytics();