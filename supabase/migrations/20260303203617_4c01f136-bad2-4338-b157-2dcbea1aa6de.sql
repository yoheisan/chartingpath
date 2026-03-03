
-- Add missing live scan cron jobs for indices and ETFs (1h + 4h)

-- Indices 1h: every 30 min during active hours (offset to avoid collision)
SELECT cron.schedule(
  'scan-live-1h-indices',
  '5,35 12-23,0-4 * * *',
  $$SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/scan-live-patterns',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{"assetType":"indices","timeframe":"1h","forceRefresh":true,"maxTickers":32}'::jsonb
  ) AS request_id;$$
);

-- ETFs 1h: every 30 min during active hours
SELECT cron.schedule(
  'scan-live-1h-etfs',
  '10,40 12-23,0-4 * * *',
  $$SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/scan-live-patterns',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{"assetType":"etfs","timeframe":"1h","forceRefresh":true,"maxTickers":85}'::jsonb
  ) AS request_id;$$
);

-- Indices 4h: at standard 4h candle closes
SELECT cron.schedule(
  'scan-live-4h-indices',
  '30 0,4,12,16,20 * * *',
  $$SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/scan-live-patterns',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{"assetType":"indices","timeframe":"4h","forceRefresh":true,"maxTickers":32}'::jsonb
  ) AS request_id;$$
);

-- ETFs 4h: at standard 4h candle closes
SELECT cron.schedule(
  'scan-live-4h-etfs',
  '35 0,4,12,16,20 * * *',
  $$SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/scan-live-patterns',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{"assetType":"etfs","timeframe":"4h","forceRefresh":true,"maxTickers":85}'::jsonb
  ) AS request_id;$$
);
