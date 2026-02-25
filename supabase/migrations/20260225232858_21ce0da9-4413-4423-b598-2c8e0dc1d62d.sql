
-- Add share_image_url column to live_pattern_detections
ALTER TABLE public.live_pattern_detections 
ADD COLUMN IF NOT EXISTS share_image_url text;

-- Create social_post_budget table for daily rate limit tracking
CREATE TABLE IF NOT EXISTS public.social_post_budget (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  post_date date NOT NULL DEFAULT CURRENT_DATE,
  post_count integer NOT NULL DEFAULT 0,
  max_posts integer NOT NULL DEFAULT 15,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(platform, post_date)
);

-- Allow service role full access (no RLS needed - only edge functions use this)
ALTER TABLE public.social_post_budget ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on social_post_budget"
  ON public.social_post_budget
  FOR ALL
  USING (public.is_service_role())
  WITH CHECK (public.is_service_role());
