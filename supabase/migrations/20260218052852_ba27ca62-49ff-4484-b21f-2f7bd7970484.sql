
-- Drop and recreate both organization_members policies using a proper security definer function
-- to fully break the recursion chain

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS TABLE(org_id uuid, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.org_id, om.role
  FROM organization_members om
  WHERE om.user_id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_org_ids FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids TO authenticated;

-- Drop all existing policies on organization_members
DROP POLICY IF EXISTS "Users can view org members of their orgs" ON public.organization_members;
DROP POLICY IF EXISTS "Org admins can manage members" ON public.organization_members;

-- Simple non-recursive SELECT policy: user can see members of orgs they belong to
CREATE POLICY "Users can view org members of their orgs"
ON public.organization_members
FOR SELECT
USING (
  org_id IN (SELECT o.org_id FROM public.get_user_org_ids() o)
);

-- Admin policy: only owners/admins can manage, using the security definer function
CREATE POLICY "Org admins can manage members"
ON public.organization_members
FOR ALL
USING (
  org_id IN (
    SELECT o.org_id FROM public.get_user_org_ids() o
    WHERE o.role = ANY (ARRAY['owner', 'admin'])
  )
);

-- Also update is_org_member to use the new function
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_user_org_ids() o
    WHERE o.org_id = p_org_id
  );
$$;
