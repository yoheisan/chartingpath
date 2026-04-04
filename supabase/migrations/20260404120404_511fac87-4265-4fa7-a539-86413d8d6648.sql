
-- Schedule auto-sync-translations to run every 2 hours
-- Processes 1 language per invocation; 20 languages ≈ 40 hours full cycle
SELECT cron.schedule(
  'auto-sync-translations-cycle',
  '15 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/auto-sync-translations',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
