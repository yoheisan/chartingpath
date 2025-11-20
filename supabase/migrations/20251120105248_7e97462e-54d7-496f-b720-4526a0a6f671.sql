
-- Drop the redundant market_reports table (we use cached_market_reports instead)
DROP TABLE IF EXISTS market_reports CASCADE;

-- Ensure index exists on market_report_subscriptions for efficient lookup
CREATE INDEX IF NOT EXISTS idx_market_report_subscriptions_active_lookup 
ON market_report_subscriptions(is_active, timezone, send_time) 
WHERE is_active = true;

-- Add comment
COMMENT ON INDEX idx_market_report_subscriptions_active_lookup IS 
'Optimizes lookup of active subscriptions by timezone and send time';
