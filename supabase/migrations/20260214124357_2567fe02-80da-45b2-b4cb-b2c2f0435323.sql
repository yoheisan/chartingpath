
-- Add share_token to live_pattern_detections for shareable pattern links
ALTER TABLE public.live_pattern_detections
ADD COLUMN share_token TEXT UNIQUE;

-- Create index for fast lookup by share token
CREATE INDEX idx_live_pattern_detections_share_token 
ON public.live_pattern_detections(share_token) 
WHERE share_token IS NOT NULL;

-- Allow public (anon) read access to shared patterns via share_token
-- This is needed so non-authenticated users can view shared patterns
CREATE POLICY "Anyone can view patterns with share_token"
ON public.live_pattern_detections
FOR SELECT
USING (share_token IS NOT NULL);
