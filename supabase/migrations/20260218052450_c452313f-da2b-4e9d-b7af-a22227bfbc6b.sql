
-- Fix infinite recursion: create a security definer function to check org membership
-- without triggering RLS on organization_members
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$;

-- Fix organization_members policies to use the function instead of self-referencing
DROP POLICY IF EXISTS "Users can view org members of their orgs" ON public.organization_members;
DROP POLICY IF EXISTS "Org admins can manage members" ON public.organization_members;

CREATE POLICY "Users can view org members of their orgs"
ON public.organization_members
FOR SELECT
USING (public.is_org_member(org_id));

CREATE POLICY "Org admins can manage members"
ON public.organization_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.org_id = organization_members.org_id
      AND om.user_id = auth.uid()
      AND om.role = ANY (ARRAY['owner'::text, 'admin'::text])
  )
);
