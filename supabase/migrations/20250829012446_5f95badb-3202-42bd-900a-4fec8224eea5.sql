-- Update default value for profiles to use 'free' instead of 'starter'
ALTER TABLE profiles ALTER COLUMN subscription_plan SET DEFAULT 'free'::subscription_plan;

-- Insert the free plan with all required values
INSERT INTO plan_pricing (plan, monthly_price_cents, yearly_price_cents, max_alerts, features, is_active)
VALUES 
  ('free'::subscription_plan, 0, 0, 1, 
   '{"chart_patterns": 5, "backtesting": "demo_only", "algo_builder": "sandbox_only", "community_sharing": false}'::jsonb, 
   true)
ON CONFLICT (plan) DO UPDATE SET
  monthly_price_cents = 0,
  yearly_price_cents = 0,
  max_alerts = 1,
  features = '{"chart_patterns": 5, "backtesting": "demo_only", "algo_builder": "sandbox_only", "community_sharing": false}'::jsonb,
  updated_at = now();

-- Insert the pro_plus plan with all required values
INSERT INTO plan_pricing (plan, monthly_price_cents, yearly_price_cents, max_alerts, features, is_active)
VALUES 
  ('pro_plus'::subscription_plan, 7900, 85300, 100, 
   '{"chart_patterns": "full", "strategies": "unlimited", "alerts": 100, "script_export": true, "backtesting": "unlimited", "community_sharing": true, "advanced_analytics": true}'::jsonb, 
   true)
ON CONFLICT (plan) DO UPDATE SET
  monthly_price_cents = 7900,
  yearly_price_cents = 85300,
  max_alerts = 100,
  features = '{"chart_patterns": "full", "strategies": "unlimited", "alerts": 100, "script_export": true, "backtesting": "unlimited", "community_sharing": true, "advanced_analytics": true}'::jsonb,
  updated_at = now();

-- Update existing pricing tiers with new competitive prices
UPDATE plan_pricing SET 
  monthly_price_cents = 1900,  -- $19/month
  yearly_price_cents = 20500,  -- ~$205/year (save ~10%)
  max_alerts = 10,
  features = '{"chart_patterns": "full", "strategies": 5, "alerts": 10, "paper_trading": true, "backtesting": {"runs_per_month": 20, "history": "1_year"}}'::jsonb,
  updated_at = now()
WHERE plan = 'starter';

UPDATE plan_pricing SET 
  monthly_price_cents = 3900,  -- $39/month
  yearly_price_cents = 42100,  -- ~$421/year (save ~10%)
  max_alerts = 50,
  features = '{"chart_patterns": "full", "strategies": "unlimited", "alerts": 50, "script_export": true, "backtesting": "unlimited", "forward_testing": true}'::jsonb,
  updated_at = now()
WHERE plan = 'pro';

UPDATE plan_pricing SET 
  monthly_price_cents = 14900,  -- $149/month
  yearly_price_cents = 160900,  -- ~$1609/year (save ~10%)
  max_alerts = -1,  -- unlimited
  features = '{"chart_patterns": "full", "strategies": "unlimited", "alerts": "unlimited", "script_export": "all_platforms", "backtesting": "priority", "community_sharing": true, "advanced_analytics": true, "vip_support": true}'::jsonb,
  updated_at = now()
WHERE plan = 'elite';