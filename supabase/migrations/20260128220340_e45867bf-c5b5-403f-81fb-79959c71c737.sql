-- Create table for admin KPI email subscriptions
CREATE TABLE public.admin_kpi_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'daily', 'monthly')),
  last_sent_at TIMESTAMPTZ,
  include_journey_analytics BOOLEAN DEFAULT true,
  include_user_stats BOOLEAN DEFAULT true,
  include_revenue_metrics BOOLEAN DEFAULT true,
  include_broken_paths BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_kpi_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage their own subscriptions
CREATE POLICY "Admins can manage own KPI subscriptions"
ON public.admin_kpi_subscriptions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()) AND user_id = auth.uid())
WITH CHECK (public.is_admin(auth.uid()) AND user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_admin_kpi_subscriptions_updated_at
  BEFORE UPDATE ON public.admin_kpi_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();