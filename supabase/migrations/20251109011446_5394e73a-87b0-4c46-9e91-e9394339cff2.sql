-- Add new market-specific quiz categories
ALTER TYPE quiz_category ADD VALUE IF NOT EXISTS 'stock_market';
ALTER TYPE quiz_category ADD VALUE IF NOT EXISTS 'forex';
ALTER TYPE quiz_category ADD VALUE IF NOT EXISTS 'cryptocurrency';
ALTER TYPE quiz_category ADD VALUE IF NOT EXISTS 'commodities';

-- Add comment explaining the new categories
COMMENT ON TYPE quiz_category IS 'Quiz question categories including pattern recognition, trading knowledge, and market-specific topics (stocks, forex, crypto, commodities)';