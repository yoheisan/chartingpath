
-- ============================================================
-- DAY 1: FX full backfill — 1D + 1W, 20 years
-- Provider: Dukascopy (via existing fetchDukascopyData path)
-- Expected new records: ~50,000–150,000
-- ============================================================

-- FX 1D — 20 years (run immediately)
SELECT net.http_post(
  url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
  body := '{"partition":"fx","timeframes":["1d"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb
) AS request_id_fx_1d;

-- FX 1W — 20 years (stagger 30 min, self-destructs after one run)
SELECT cron.schedule(
  'backfill-fx-1wk-oneshot',
  '30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/seed-mtf-distributed',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
    body := '{"partition":"fx","timeframes":["1wk"],"forceFullBackfill":true,"incrementalMode":false}'::jsonb
  ) AS request_id;
  SELECT cron.unschedule('backfill-fx-1wk-oneshot');
  $$
);
