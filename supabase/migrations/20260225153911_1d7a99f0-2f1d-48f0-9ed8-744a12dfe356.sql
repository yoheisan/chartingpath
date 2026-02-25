
-- 1. Clean up old failed scheduled posts (before Feb 20)
DELETE FROM scheduled_posts WHERE status = 'failed' AND scheduled_time < '2026-02-20T00:00:00Z';

-- 2. Reschedule post-patterns-to-social from every 30min to every 60min
SELECT cron.unschedule(146);

SELECT cron.schedule(
  'post-patterns-to-social',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/post-patterns-to-social',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
