DROP POLICY IF EXISTS "Anyone can read bookmarks" ON public.community_bookmarks;

CREATE POLICY "Users can read own bookmarks" ON public.community_bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);