SELECT cron.unschedule('demote-loose-atr-fallback')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'demote-loose-atr-fallback');