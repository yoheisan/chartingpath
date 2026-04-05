-- ============================================================
-- RE-BACKFILL: Stocks + ETFs 1D/1W with updated Yahoo 25yr limit
-- Previous runs only reached 2018 (stocks) / 2015 (ETFs)
-- Safe: upsert with ignoreDuplicates=true
-- ============================================================

-- Stocks A-G 1D/1W — immediately
SELECT net.http_post(
  url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
  body := '{"partition":"stocks_ag","timeframes":["1d","1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb
) AS r_ag;

-- Stocks H-O at :15
SELECT cron.schedule('rebackfill-stocks-ho','15 * * * *',$$
  SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{"partition":"stocks_ho","timeframes":["1d","1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb
  ) AS r;
  SELECT cron.unschedule('rebackfill-stocks-ho');
$$);

-- Stocks P-Z at :30
SELECT cron.schedule('rebackfill-stocks-pz','30 * * * *',$$
  SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{"partition":"stocks_pz","timeframes":["1d","1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb
  ) AS r;
  SELECT cron.unschedule('rebackfill-stocks-pz');
$$);

-- ETFs at :45
SELECT cron.schedule('rebackfill-etfs','45 * * * *',$$
  SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{"partition":"etfs","timeframes":["1d","1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb
  ) AS r;
  SELECT cron.unschedule('rebackfill-etfs');
$$);