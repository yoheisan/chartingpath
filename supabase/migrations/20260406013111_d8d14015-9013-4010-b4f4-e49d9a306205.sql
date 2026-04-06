-- Nightly intraday backfill cron — runs at 2am Tokyo time (17:00 UTC)
-- Rotates through symbol batches using day of month to avoid re-seeding same symbols
-- Covers full instrument universe over ~30 days

SELECT cron.schedule(
  'nightly-intraday-backfill',
  '0 17 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/seed-historical-patterns-mtf',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'timeframe', '1h',
      'assetTypes', jsonb_build_array('stocks', 'fx'),
      'maxInstrumentsPerType', 3,
      'offset', ((EXTRACT(DAY FROM NOW())::int - 1) * 3),
      'forceFullBackfill', false,
      'incrementalMode', true
    )
  );
  $$
);

-- Also run 4h backfill at 3am Tokyo time (18:00 UTC)
SELECT cron.schedule(
  'nightly-4h-backfill',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/seed-historical-patterns-mtf',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'timeframe', '4h',
      'assetTypes', jsonb_build_array('stocks', 'fx'),
      'maxInstrumentsPerType', 3,
      'offset', ((EXTRACT(DAY FROM NOW())::int - 1) * 3),
      'forceFullBackfill', false,
      'incrementalMode', true
    )
  );
  $$
);
