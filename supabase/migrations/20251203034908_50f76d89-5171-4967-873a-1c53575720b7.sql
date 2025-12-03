-- Clean up old cron jobs
SELECT cron.unschedule('send-market-reports-every-15min');
SELECT cron.unschedule('generate-market-reports-background');
SELECT cron.unschedule('send-scheduled-market-reports');

-- Create clean cron jobs
-- 1. Generate cached reports hourly for all timezones
SELECT cron.schedule(
  'schedule-market-reports-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/schedule-market-reports',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 2. Check and send scheduled reports every 15 minutes
SELECT cron.schedule(
  'send-scheduled-market-reports-15min',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/send-scheduled-market-reports',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);