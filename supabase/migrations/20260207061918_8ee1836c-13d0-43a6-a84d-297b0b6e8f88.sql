-- ================================================
-- FIX REMAINING CRITICAL SECURITY ISSUES
-- ================================================

-- ================================================
-- 1. Fix product_events - restrict to user's own data or anonymous
-- ================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert product events" ON public.product_events;

-- Allow inserts (for tracking) but restrict reads to user's own data
CREATE POLICY "Users can insert product events"
ON public.product_events
FOR INSERT
WITH CHECK (true); -- Intentional: anonymous tracking allowed

-- Restrict SELECT to own data only
CREATE POLICY "Users can view their own events"
ON public.product_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all for analytics
CREATE POLICY "Admins can view all product events"
ON public.product_events
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- ================================================
-- 2. Fix analytics_events similarly
-- ================================================

DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;

CREATE POLICY "Anyone can insert analytics"
ON public.analytics_events
FOR INSERT
WITH CHECK (true); -- Intentional: anonymous tracking allowed

-- Restrict SELECT to own data
CREATE POLICY "Users can view their own analytics"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- ================================================
-- 3. Fix function search_path warnings
-- These are for trigger functions that don't have search_path set
-- ================================================

-- Find and fix the update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;