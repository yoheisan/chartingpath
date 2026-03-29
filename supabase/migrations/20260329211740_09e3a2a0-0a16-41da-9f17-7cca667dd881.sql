CREATE POLICY "Service role only" ON public.reseed_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);