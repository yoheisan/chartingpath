
-- ============================================================
-- DAY 2: Crypto full backfill — all timeframes
-- Provider: Binance (free, 2017-present)
-- Expected new records: ~100,000–300,000
-- ============================================================

-- 1H immediately
SELECT net.http_post(
  url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
  body := '{"partition":"crypto","timeframes":["1h"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb
) AS request_id_crypto_1h;

-- 4H at +20min (self-destructs)
SELECT cron.schedule('backfill-crypto-4h', '20 * * * *', $$
  SELECT net.http_post(url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,body:='{"partition":"crypto","timeframes":["4h"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb) AS r;
  SELECT cron.unschedule('backfill-crypto-4h');
$$);

-- 8H at +40min (self-destructs)
SELECT cron.schedule('backfill-crypto-8h', '40 * * * *', $$
  SELECT net.http_post(url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,body:='{"partition":"crypto","timeframes":["8h"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb) AS r;
  SELECT cron.unschedule('backfill-crypto-8h');
$$);

-- 1D at next hour +0min (self-destructs)
SELECT cron.schedule('backfill-crypto-1d', '0 * * * *', $$
  SELECT net.http_post(url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,body:='{"partition":"crypto","timeframes":["1d"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb) AS r;
  SELECT cron.unschedule('backfill-crypto-1d');
$$);

-- 1W at next hour +20min (self-destructs)
SELECT cron.schedule('backfill-crypto-1wk', '20 * * * *', $$
  SELECT net.http_post(url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,body:='{"partition":"crypto","timeframes":["1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb) AS r;
  SELECT cron.unschedule('backfill-crypto-1wk');
$$);
