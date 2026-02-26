
-- RPC to list all cron jobs with parsed metadata
CREATE OR REPLACE FUNCTION public.get_cron_jobs()
RETURNS TABLE(
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  edge_function text,
  partition text,
  timeframes text,
  command text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    j.jobid,
    j.jobname,
    j.schedule,
    j.active,
    substring(j.command from 'functions/v1/([^''\"]+)') as edge_function,
    substring(j.command from '"partition":"([^"]+)"') as partition,
    substring(j.command from '"timeframes":\[([^\]]+)\]') as timeframes,
    j.command
  FROM cron.job j
  ORDER BY j.schedule, j.jobname;
$$;

-- RPC to get recent run details
CREATE OR REPLACE FUNCTION public.get_cron_run_details()
RETURNS TABLE(
  jobid bigint,
  jobname text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    d.jobid,
    j.jobname,
    d.status,
    d.return_message,
    d.start_time,
    d.end_time
  FROM cron.job_run_details d
  JOIN cron.job j ON j.jobid = d.jobid
  ORDER BY d.start_time DESC
  LIMIT 200;
$$;

-- RPC to activate a cron job
CREATE OR REPLACE FUNCTION public.activate_cron_job(p_jobid bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE cron.job SET active = true WHERE jobid = p_jobid;
END;
$$;

-- RPC to deactivate a cron job
CREATE OR REPLACE FUNCTION public.deactivate_cron_job(p_jobid bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE cron.job SET active = false WHERE jobid = p_jobid;
END;
$$;

-- RPC to reschedule a cron job
CREATE OR REPLACE FUNCTION public.reschedule_cron_job(p_jobid bigint, p_schedule text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE cron.job SET schedule = p_schedule WHERE jobid = p_jobid;
END;
$$;

-- RPC to get a single job by id
CREATE OR REPLACE FUNCTION public.get_cron_job_by_id(p_jobid bigint)
RETURNS TABLE(
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  command text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT j.jobid, j.jobname, j.schedule, j.active, j.command
  FROM cron.job j
  WHERE j.jobid = p_jobid;
$$;

-- RPC to trigger a job immediately
CREATE OR REPLACE FUNCTION public.run_cron_job_now(p_jobid bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_command text;
BEGIN
  SELECT command INTO v_command FROM cron.job WHERE jobid = p_jobid;
  IF v_command IS NULL THEN
    RAISE EXCEPTION 'Job not found: %', p_jobid;
  END IF;
  EXECUTE v_command;
END;
$$;
