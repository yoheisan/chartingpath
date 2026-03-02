-- Allow admins to view all copilot feedback
CREATE POLICY "Admins can view all feedback"
ON public.copilot_feedback
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to update copilot feedback (mark resolved, etc.)
CREATE POLICY "Admins can update feedback"
ON public.copilot_feedback
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));