
SELECT
  cron.schedule(
    'check-alert-matches-scheduled',
    '5,20,35,50 0-4,12-23 * * *',
    $$
    SELECT net.http_post(
      url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/check-alert-matches',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
    $$
  );
