-- Helper function for the orchestrator to schedule delayed self-calls via pg_net
CREATE OR REPLACE FUNCTION public.schedule_backfill_page(
  p_url text,
  p_headers text,
  p_body text,
  p_delay_minutes int DEFAULT 2
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use pg_cron to schedule a one-shot job that fires after the delay
  PERFORM cron.schedule(
    'backfill-page-' || md5(p_body || now()::text),
    now() + (p_delay_minutes || ' minutes')::interval,
    format(
      $fmt$SELECT net.http_post(url:=%L, headers:=%L::jsonb, body:=%L::jsonb) AS r; SELECT cron.unschedule('backfill-page-%s');$fmt$,
      p_url, p_headers, p_body, md5(p_body || now()::text)
    )
  );
END;
$$;

-- Fire initial pages for all partitions
SELECT net.http_post(
  url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/backfill-orchestrator',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
  body := '{"partition":"stocks_ag","offset":0,"timeframes":["1d","1wk"],"maxOffset":300}'::jsonb
) AS r_ag;

SELECT net.http_post(
  url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/backfill-orchestrator',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
  body := '{"partition":"stocks_ho","offset":0,"timeframes":["1d","1wk"],"maxOffset":300}'::jsonb
) AS r_ho;

SELECT net.http_post(
  url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/backfill-orchestrator',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
  body := '{"partition":"stocks_pz","offset":0,"timeframes":["1d","1wk"],"maxOffset":300}'::jsonb
) AS r_pz;

SELECT net.http_post(
  url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/backfill-orchestrator',
  headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
  body := '{"partition":"etfs","offset":0,"timeframes":["1d","1wk"],"maxOffset":100}'::jsonb
) AS r_etfs;