-- Update default value for profiles to use 'free' instead of 'starter'
ALTER TABLE profiles ALTER COLUMN subscription_plan SET DEFAULT 'free'::subscription_plan;

-- Update plan_pricing table to include new pricing tiers
INSERT INTO plan_pricing (plan, monthly_price_cents, yearly_price_cents, max_alerts, features, is_active)
VALUES 
  ('free'::subscription_plan, 0, 0, 1, 
   '{"chart_patterns": 5, "backtesting": "demo_only", "algo_builder": "sandbox_only", "community_sharing": false}'::jsonb, 
   true)
ON CONFLICT (plan) DO UPDATE SET
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  yearly_price_cents = EXCLUDED.yearly_price_cents,
  max_alerts = EXCLUDED.max_alerts,
  features = EXCLUDED.features,
  updated_at = now();

-- Update existing pricing tiers with new competitive prices
UPDATE plan_pricing SET 
  monthly_price_cents = CASE 
    WHEN plan = 'starter' THEN 1900  -- $19/month
    WHEN plan = 'pro' THEN 3900      -- $39/month
    WHEN plan = 'pro_plus' THEN 7900 -- $79/month
    WHEN plan = 'elite' THEN 14900   -- $149/month
  END,
  yearly_price_cents = CASE
    WHEN plan = 'starter' THEN 20500  -- ~$205/year (save ~10%)
    WHEN plan = 'pro' THEN 42100      -- ~$421/year (save ~10%)
    WHEN plan = 'pro_plus' THEN 85300 -- ~$853/year (save ~10%)
    WHEN plan = 'elite' THEN 160900   -- ~$1609/year (save ~10%)
  END,
  max_alerts = CASE
    WHEN plan = 'starter' THEN 10
    WHEN plan = 'pro' THEN 50
    WHEN plan = 'pro_plus' THEN 100
    WHEN plan = 'elite' THEN -1  -- unlimited
  END,
  features = CASE
    WHEN plan = 'starter' THEN '{"chart_patterns": "full", "strategies": 5, "alerts": 10, "paper_trading": true, "backtesting": {"runs_per_month": 20, "history": "1_year"}}'::jsonb
    WHEN plan = 'pro' THEN '{"chart_patterns": "full", "strategies": "unlimited", "alerts": 50, "script_export": true, "backtesting": "unlimited", "forward_testing": true}'::jsonb
    WHEN plan = 'pro_plus' THEN '{"chart_patterns": "full", "strategies": "unlimited", "alerts": 100, "script_export": true, "backtesting": "unlimited", "community_sharing": true, "advanced_analytics": true}'::jsonb
    WHEN plan = 'elite' THEN '{"chart_patterns": "full", "strategies": "unlimited", "alerts": "unlimited", "script_export": "all_platforms", "backtesting": "priority", "community_sharing": true, "advanced_analytics": true, "vip_support": true}'::jsonb
  END,
  updated_at = now()
WHERE plan IN ('starter', 'pro', 'pro_plus', 'elite');