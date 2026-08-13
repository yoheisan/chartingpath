-- 1) Add WITH CHECK to ownership-based UPDATE/ALL policies missing it
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, qual, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd IN ('UPDATE','ALL')
      AND with_check IS NULL
      AND qual IS NOT NULL
      AND qual ILIKE '%user_id%'
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', r.policyname, r.schemaname, r.tablename, r.qual);
  END LOOP;
END $$;

-- 2) Explicitly constrain community_messages authorship on edit
ALTER POLICY "Users can update their own messages" ON public.community_messages
  WITH CHECK ((auth.uid() = user_id) OR is_admin(auth.uid()));

-- 3) Profiles: prevent self-service subscription upgrades
CREATE OR REPLACE FUNCTION public.prevent_self_subscription_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_service_role() OR auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
     OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'Subscription fields can only be changed by the billing system';
  END IF;

  NEW.user_id := OLD.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_subscription_change ON public.profiles;
CREATE TRIGGER prevent_self_subscription_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_subscription_change();

ALTER POLICY "Users can update own profile" ON public.profiles
  WITH CHECK (auth.uid() = user_id);