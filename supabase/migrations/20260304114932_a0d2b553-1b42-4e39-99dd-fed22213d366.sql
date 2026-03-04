SELECT cron.schedule(
  'post-patterns-tokyo-open',
  '0 23 * * 1-5',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/post-patterns-to-social',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"session":"tokyo"}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'post-breadth-us-close',
  '30 21 * * 1-5',
  $$
  SELECT net.http_post(
    url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/post-breadth-to-x',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body:='{"region":"Americas","reportType":"post-market"}'::jsonb
  ) AS request_id;
  $$
);