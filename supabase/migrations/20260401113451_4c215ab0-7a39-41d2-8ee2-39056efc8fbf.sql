CREATE OR REPLACE FUNCTION public.invoke_manage_trades_if_needed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  open_count integer;
BEGIN
  SELECT COUNT(*) INTO open_count
  FROM public.paper_trades
  WHERE status = 'open'
  LIMIT 1;

  IF open_count > 0 THEN
    PERFORM net.http_post(
      url := 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/manage-trades',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb,
      body := '{}'::jsonb
    );
  END IF;
END;
$$;