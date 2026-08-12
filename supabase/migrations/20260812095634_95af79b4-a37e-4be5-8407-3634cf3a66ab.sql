ALTER VIEW public.v_live_detections_with_edge SET (security_invoker = true);

DROP POLICY IF EXISTS "Service role can upload quiz images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload share images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update share images" ON storage.objects;

CREATE POLICY "Service role can upload quiz images"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'quiz-images');

CREATE POLICY "Service role can upload share images"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'share-images');

CREATE POLICY "Service role can update share images"
ON storage.objects FOR UPDATE TO service_role
USING (bucket_id = 'share-images')
WITH CHECK (bucket_id = 'share-images');