
-- platform_data_version: restrict to authenticated
DROP POLICY IF EXISTS "Public read platform version" ON public.platform_data_version;
CREATE POLICY "Authenticated read platform version"
  ON public.platform_data_version FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.platform_data_version FROM anon;
GRANT SELECT ON public.platform_data_version TO authenticated;
GRANT ALL ON public.platform_data_version TO service_role;

-- reseed_audit_log: admins only
DROP POLICY IF EXISTS "Public read reseed audit" ON public.reseed_audit_log;
CREATE POLICY "Admins read reseed audit"
  ON public.reseed_audit_log FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
REVOKE SELECT ON public.reseed_audit_log FROM anon;
GRANT SELECT ON public.reseed_audit_log TO authenticated;
GRANT ALL ON public.reseed_audit_log TO service_role;

-- email_leads: allow admin read, service_role full access
DROP POLICY IF EXISTS "Service role can read email leads" ON public.email_leads;
CREATE POLICY "Admins can read email leads"
  ON public.email_leads FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
GRANT SELECT ON public.email_leads TO authenticated;
GRANT ALL ON public.email_leads TO service_role;

-- article_views: prevent spoofed identity / oversized PII payloads on anonymous inserts
CREATE OR REPLACE FUNCTION public.sanitize_article_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Never trust a client-supplied user_id
  NEW.user_id := auth.uid();
  IF NEW.user_agent IS NOT NULL THEN
    NEW.user_agent := left(NEW.user_agent, 256);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_article_view_trigger ON public.article_views;
CREATE TRIGGER sanitize_article_view_trigger
  BEFORE INSERT ON public.article_views
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_article_view();
