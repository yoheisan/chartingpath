-- Enable realtime for cached_market_reports table
ALTER TABLE cached_market_reports REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE cached_market_reports;
