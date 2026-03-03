
-- Reschedule for optimal market-open engagement times

-- 1. Signal posts at exact market opens (peak trader attention)
--    Tokyo 9:00 JST = 00:00 UTC
--    London 8:00 GMT = 08:00 UTC  
--    NY 9:30 EST = 14:30 UTC
SELECT cron.unschedule('post-patterns-to-social');
SELECT cron.schedule(
  'post-patterns-to-social',
  '0 0 * * *',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/post-patterns-to-social',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"session":"tokyo"}'::jsonb
  ) AS request_id;$$
);

-- Separate jobs for London and NY opens for precise timing
SELECT cron.schedule(
  'post-patterns-london-open',
  '0 8 * * 1-5',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/post-patterns-to-social',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"session":"london"}'::jsonb
  ) AS request_id;$$
);

SELECT cron.schedule(
  'post-patterns-ny-open',
  '30 14 * * 1-5',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/post-patterns-to-social',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"session":"newyork"}'::jsonb
  ) AS request_id;$$
);

-- 2. Auto-follows: spread across trading hours (Mon-Fri only)
SELECT cron.unschedule('auto-follow-x-drip');
SELECT cron.schedule(
  'auto-follow-x-drip',
  '0 1,9,13,17,21 * * 1-5',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/auto-follow-x',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"action":"follow_next"}'::jsonb
  ) AS request_id;$$
);

-- 3. Social scheduler: 30 min before each market-open post
SELECT cron.unschedule('social-media-scheduler');
SELECT cron.schedule(
  'social-media-scheduler',
  '30 7,14,23 * * 1-5',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/social-media-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);
