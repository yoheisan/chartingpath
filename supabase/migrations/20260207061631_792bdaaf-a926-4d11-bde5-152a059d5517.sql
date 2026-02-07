-- ================================================
-- REMAINING SECURITY FIXES
-- ================================================

-- Check current state and apply remaining fixes
-- The views and several policies were fixed in previous migrations

-- Drop policies that might already exist before creating
DROP POLICY IF EXISTS "Users can view their own artifacts" ON public.artifacts;
DROP POLICY IF EXISTS "Users can create artifacts for their runs" ON public.artifacts;

-- Re-create with proper logic
CREATE POLICY "Users can view their own artifacts"
ON public.artifacts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_runs pr 
    JOIN public.projects p ON p.id = pr.project_id
    WHERE pr.id = artifacts.project_run_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create artifacts for their runs"
ON public.artifacts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_runs pr 
    JOIN public.projects p ON p.id = pr.project_id
    WHERE pr.id = project_run_id 
    AND p.user_id = auth.uid()
  )
);