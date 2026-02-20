
-- Grant postgres role access to pg_cron tables
-- Required so cron.schedule() can be called from the SQL Editor
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA cron TO postgres;
