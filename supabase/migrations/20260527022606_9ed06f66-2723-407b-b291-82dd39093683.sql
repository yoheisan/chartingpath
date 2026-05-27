
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.copilot_feedback;
CREATE POLICY "Anyone can submit feedback"
  ON public.copilot_feedback
  FOR INSERT
  TO public
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert model usage" ON public.copilot_model_usage;
CREATE POLICY "Service role can insert model usage"
  ON public.copilot_model_usage
  FOR INSERT
  TO public
  WITH CHECK (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

ALTER TABLE IF EXISTS public.reseed_snapshot_batch1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reseed_snapshot_batch1 FROM anon, authenticated;
GRANT ALL ON public.reseed_snapshot_batch1 TO service_role;
DROP POLICY IF EXISTS "Service role only access" ON public.reseed_snapshot_batch1;
CREATE POLICY "Service role only access"
  ON public.reseed_snapshot_batch1
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can view captures" ON storage.objects;
CREATE POLICY "Users can view own captures"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-captures'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
UPDATE storage.buckets SET public = false WHERE id = 'user-captures';

DROP POLICY IF EXISTS "Authenticated users can upload strategy files" ON storage.objects;
CREATE POLICY "Users can upload own strategy files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'strategy-downloads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated users can update their strategy files" ON storage.objects;
CREATE POLICY "Users can update own strategy files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'strategy-downloads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'strategy-downloads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own strategy files" ON storage.objects;
CREATE POLICY "Users can delete own strategy files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'strategy-downloads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
