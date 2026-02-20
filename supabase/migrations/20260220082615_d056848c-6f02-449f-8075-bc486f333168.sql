
-- Disable the old unsharded backfill-validation job (job 26)
-- The 5 parallel sharded jobs (129-133) replace it entirely
SELECT cron.unschedule('backfill-validation');
