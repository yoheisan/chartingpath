-- Remove existing single MTF cron job
SELECT cron.unschedule(14);

-- Create distributed cron jobs for each asset partition
-- Each partition runs at a different hour to avoid API rate limits

-- FX Partition: 2:00 AM UTC (includes all FX pairs)
SELECT cron.schedule(
  'seed-distributed-fx',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"partition": "fx", "timeframes": ["1h", "4h", "1d", "1wk"]}'::jsonb
  );
  $$
);

-- Crypto Partition: 4:00 AM UTC
SELECT cron.schedule(
  'seed-distributed-crypto',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"partition": "crypto", "timeframes": ["1h", "4h", "1d", "1wk"]}'::jsonb
  );
  $$
);

-- Stocks A-G Partition: 6:00 AM UTC
SELECT cron.schedule(
  'seed-distributed-stocks-ag',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"partition": "stocks_ag", "timeframes": ["1h", "4h", "1d", "1wk"]}'::jsonb
  );
  $$
);

-- Stocks H-O Partition: 8:00 AM UTC
SELECT cron.schedule(
  'seed-distributed-stocks-ho',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"partition": "stocks_ho", "timeframes": ["1h", "4h", "1d", "1wk"]}'::jsonb
  );
  $$
);

-- Stocks P-Z Partition: 10:00 AM UTC
SELECT cron.schedule(
  'seed-distributed-stocks-pz',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"partition": "stocks_pz", "timeframes": ["1h", "4h", "1d", "1wk"]}'::jsonb
  );
  $$
);

-- Commodities Partition: 12:00 PM UTC
SELECT cron.schedule(
  'seed-distributed-commodities',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"partition": "commodities", "timeframes": ["1h", "4h", "1d", "1wk"]}'::jsonb
  );
  $$
);

-- Indices Partition: 14:00 PM UTC
SELECT cron.schedule(
  'seed-distributed-indices',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"partition": "indices", "timeframes": ["1h", "4h", "1d", "1wk"]}'::jsonb
  );
  $$
);

-- ETFs Partition: 16:00 PM UTC
SELECT cron.schedule(
  'seed-distributed-etfs',
  '0 16 * * *',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"partition": "etfs", "timeframes": ["1h", "4h", "1d", "1wk"]}'::jsonb
  );
  $$
);

-- Premium 15m Partition (most traded instruments): 18:00 PM UTC
SELECT cron.schedule(
  'seed-distributed-premium-15m',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"partition": "premium_15m", "timeframes": ["15m", "1h", "4h"]}'::jsonb
  );
  $$
);