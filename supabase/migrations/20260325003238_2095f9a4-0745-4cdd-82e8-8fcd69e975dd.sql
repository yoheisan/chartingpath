DROP POLICY IF EXISTS "Users can read approved translations" ON public.translations;
CREATE POLICY "Users can read approved or auto_translated translations"
  ON public.translations
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('approved', 'auto_translated'));