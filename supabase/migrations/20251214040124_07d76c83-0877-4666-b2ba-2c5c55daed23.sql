-- Schedule daily cache job for popular instruments (runs at 4 AM UTC)
SELECT cron.schedule(
  'cache-popular-instruments-daily',
  '0 4 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/cache-popular-instruments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Schedule cache cleanup every 6 hours
SELECT cron.schedule(
  'cleanup-backtest-cache-6h',
  '0 */6 * * *',
  $$
  SELECT public.cleanup_expired_backtest_cache();
  $$
);