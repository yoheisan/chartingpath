select cron.schedule(
  'send-getting-started-email',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/send-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
      body := '{"template": "getting_started", "batch": true}'::jsonb
    ) as request_id;
  $$
);