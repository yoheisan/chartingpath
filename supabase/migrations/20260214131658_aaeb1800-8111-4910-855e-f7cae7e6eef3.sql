
-- Create storage bucket for shared pattern chart images
INSERT INTO storage.buckets (id, name, public)
VALUES ('share-images', 'share-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Share images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'share-images');

-- Allow service role to upload (edge functions use service role)
CREATE POLICY "Service role can upload share images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'share-images');

CREATE POLICY "Service role can update share images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'share-images');
