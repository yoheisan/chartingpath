
-- Rebalance for $100/mo: 2 signals/day + 1 educational/day = ~74/mo of 100

-- Remove the Tokyo midnight signal post (keep London 08:00 + NY 14:30 = 2/day weekdays)
SELECT cron.unschedule('post-patterns-to-social');

-- Ensure educational scheduler runs daily at 21:00 UTC (schedules 1 post for next day)
-- Already exists but confirm it's active
SELECT cron.unschedule('schedule-educational-posts');
SELECT cron.schedule(
  'schedule-educational-posts',
  '0 21 * * *',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/schedule-educational-posts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);

-- Social media scheduler needs to run more frequently to catch educational posts at various times
-- Run 6x/day to cover all market regions (00:00, 01:00, 08:30, 14:00 + buffer)
SELECT cron.unschedule('social-media-scheduler');
SELECT cron.schedule(
  'social-media-scheduler',
  '0 0,1,7,8,14,23 * * *',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/social-media-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);
