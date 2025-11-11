-- Fix RLS policies for scheduled_posts to allow admins to manage posts
DROP POLICY IF EXISTS "Admin full access to scheduled_posts" ON public.scheduled_posts;

-- Create proper admin policy
CREATE POLICY "Admins can manage scheduled posts"
  ON public.scheduled_posts
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));