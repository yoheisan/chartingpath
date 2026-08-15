DROP POLICY IF EXISTS "Public read copilot_platform_context" ON public.copilot_platform_context;

CREATE POLICY "Authenticated users can read copilot platform context"
ON public.copilot_platform_context
FOR SELECT
TO authenticated
USING (true);

REVOKE ALL ON public.copilot_platform_context FROM anon;
GRANT SELECT ON public.copilot_platform_context TO authenticated;
GRANT ALL ON public.copilot_platform_context TO service_role;