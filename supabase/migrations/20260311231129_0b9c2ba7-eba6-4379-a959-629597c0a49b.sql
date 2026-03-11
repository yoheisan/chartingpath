
-- Storage bucket for user captures (Elite permanent, temp for others)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-captures', 
  'user-captures', 
  true,
  52428800, -- 50MB max
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'video/webm', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- User captures metadata table
CREATE TABLE IF NOT EXISTS public.user_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  capture_type TEXT NOT NULL CHECK (capture_type IN ('screenshot', 'video')),
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  context_type TEXT, -- 'chart', 'screen', 'area'
  context_metadata JSONB DEFAULT '{}',
  is_temporary BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup job
CREATE INDEX idx_user_captures_expires ON public.user_captures (expires_at) WHERE is_temporary = true;
CREATE INDEX idx_user_captures_user ON public.user_captures (user_id);

-- RLS
ALTER TABLE public.user_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own captures"
  ON public.user_captures FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own captures"
  ON public.user_captures FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own captures"
  ON public.user_captures FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Storage RLS policies
CREATE POLICY "Users can upload captures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-captures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view captures"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-captures');

CREATE POLICY "Users can delete own captures"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'user-captures' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Cleanup function for expired temporary captures
CREATE OR REPLACE FUNCTION public.cleanup_expired_captures()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired_capture RECORD;
BEGIN
  FOR expired_capture IN
    SELECT id, file_path FROM public.user_captures
    WHERE is_temporary = true AND expires_at < now()
  LOOP
    DELETE FROM storage.objects WHERE name = expired_capture.file_path AND bucket_id = 'user-captures';
    DELETE FROM public.user_captures WHERE id = expired_capture.id;
  END LOOP;
END;
$$;
