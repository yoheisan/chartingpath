-- ============================================================
-- DAY 6: ETFs + Indices + Commodities full backfill
-- Provider: Yahoo Finance (free, 1970-present)
-- These are small universes, safe to run same day
-- Expected new records: ~200,000–400,000 combined
-- Safe: upsert with ignoreDuplicates=true
-- ============================================================

-- ETFs 1D + 1W immediately
SELECT net.http_post(
  url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
  body := '{"partition":"etfs","timeframes":["1d","1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb
) AS request_id_etfs;

-- Indices at +20min
SELECT cron.schedule('backfill-indices', '20 * * * *', $$
  SELECT net.http_post(url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,body:='{"partition":"indices","timeframes":["1d","1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb) AS r;
  SELECT cron.unschedule('backfill-indices');
$$);

-- Commodities at +40min
SELECT cron.schedule('backfill-commodities', '40 * * * *', $$
  SELECT net.http_post(url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,body:='{"partition":"commodities","timeframes":["1d","1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb) AS r;
  SELECT cron.unschedule('backfill-commodities');
$$);