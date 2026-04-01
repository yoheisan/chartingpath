ALTER TABLE public.paper_trades
  ADD COLUMN IF NOT EXISTS price_crossed_at timestamptz;