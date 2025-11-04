-- Schedule send-scheduled-market-reports to run every hour
SELECT cron.schedule(
  'send-scheduled-market-reports',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/send-scheduled-market-reports',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);