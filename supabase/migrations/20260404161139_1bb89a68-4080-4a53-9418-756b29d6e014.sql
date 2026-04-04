ALTER TABLE paper_trades 
  ADD COLUMN IF NOT EXISTS latest_price numeric,
  ADD COLUMN IF NOT EXISTS latest_price_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_paper_trades_open_status 
  ON paper_trades(status) WHERE status = 'open';