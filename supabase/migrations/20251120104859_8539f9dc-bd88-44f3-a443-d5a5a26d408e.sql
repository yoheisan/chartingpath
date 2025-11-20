
-- Add last_sent_at column to track when reports were last sent
ALTER TABLE market_report_subscriptions 
ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_market_report_subscriptions_last_sent 
ON market_report_subscriptions(user_id, last_sent_at);

-- Add comment
COMMENT ON COLUMN market_report_subscriptions.last_sent_at IS 'Timestamp of when the last report was sent to prevent duplicates';
