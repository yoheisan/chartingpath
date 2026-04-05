-- ============================================================
-- DAY 5: Stocks P–Z full backfill — 1D + 1W only
-- Provider: Yahoo Finance (free, 1970-present)
-- 1H/4H/8H excluded: Yahoo 730-day cap = no improvement
-- Expected new records: ~500,000–800,000
-- ============================================================

-- 1D immediately
SELECT net.http_post(
  url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
  body := '{"partition":"stocks_pz","timeframes":["1d"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb
) AS request_id_stocks_pz_1d;

-- 1W at +30min (self-destructs)
SELECT cron.schedule('backfill-stocks-pz-1wk', '30 * * * *', $$
  SELECT net.http_post(url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,body:='{"partition":"stocks_pz","timeframes":["1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb) AS r;
  SELECT cron.unschedule('backfill-stocks-pz-1wk');
$$);