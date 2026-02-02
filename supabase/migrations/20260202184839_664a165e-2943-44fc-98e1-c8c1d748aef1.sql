-- Schedule daily compute-multi-rr-outcomes batch job (runs at 6 AM UTC, after historical seeding)
SELECT cron.schedule(
  'compute-multi-rr-outcomes-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/compute-multi-rr-outcomes',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3Njk3OTAsImV4cCI6MjA0NDM0NTc5MH0.PCJZ8oDMvg3hq7X5Beo-Xa_akZgv3HJMbVMz2iMngHk"}'::jsonb,
    body := '{"batchSize": 500}'::jsonb
  ) AS request_id;
  $$
);