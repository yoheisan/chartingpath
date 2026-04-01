ALTER TABLE public.paper_trades
  ADD COLUMN IF NOT EXISTS slippage_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS detection_latency_ms integer,
  ADD COLUMN IF NOT EXISTS ideal_exit_price numeric;