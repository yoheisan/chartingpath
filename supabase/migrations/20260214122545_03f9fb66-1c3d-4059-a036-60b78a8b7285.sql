-- Schedule backfill-validation to run every minute until all patterns are processed
-- This will automatically stop being useful once remaining = 0
select
cron.schedule(
  'backfill-validation-batch',
  '* * * * *',
  $$
  select
    net.http_post(
        url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/backfill-validation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
        body:='{"batch_size": 50}'::jsonb
    ) as request_id;
  $$
);