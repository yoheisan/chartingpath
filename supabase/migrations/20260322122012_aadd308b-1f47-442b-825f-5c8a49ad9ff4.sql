ALTER TABLE public.master_plans
  ADD COLUMN IF NOT EXISTS asset_classes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fx_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS crypto_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stock_exchanges text[] DEFAULT '{}';