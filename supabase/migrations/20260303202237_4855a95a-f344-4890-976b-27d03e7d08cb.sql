-- Reschedule X/Twitter API cron jobs for $100/mo Basic tier budget

-- 1. auto-follow-x: 5x/day instead of every 4 min (~150 follows/mo)
SELECT cron.unschedule('auto-follow-x-drip');
SELECT cron.schedule(
  'auto-follow-x-drip',
  '0 10,14,18,22,2 * * *',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/auto-follow-x',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"action":"follow_next"}'::jsonb
  ) AS request_id;$$
);

-- 2. discover-x-accounts: Mon + Thu only (~8 crawls/mo, ~800 reads)
SELECT cron.unschedule('discover-x-accounts-every-5min');
SELECT cron.schedule(
  'discover-x-accounts-twice-weekly',
  '0 2 * * 1,4',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/discover-x-accounts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"action":"crawl_next"}'::jsonb
  ) AS request_id;$$
);

-- 3. post-patterns-to-social: 3x/day covering Tokyo/London/NY (~90 posts/mo)
SELECT cron.unschedule('post-patterns-to-social');
SELECT cron.schedule(
  'post-patterns-to-social',
  '0 0,8,16 * * *',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/post-patterns-to-social',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);

-- 4. social-media-scheduler: 3x/day, 30 min before pattern posts
SELECT cron.unschedule('social-media-scheduler');
SELECT cron.schedule(
  'social-media-scheduler',
  '30 7,15,23 * * *',
  $$SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/social-media-scheduler',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;$$
);