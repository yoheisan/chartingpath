DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;
CREATE POLICY "Anyone can insert analytics"
ON public.analytics_events
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

DROP POLICY IF EXISTS "Users can insert product events" ON public.product_events;
CREATE POLICY "Users can insert product events"
ON public.product_events
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

DROP POLICY IF EXISTS "Anyone can download strategy files" ON storage.objects;
CREATE POLICY "Users can read own strategy files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'strategy-downloads'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);