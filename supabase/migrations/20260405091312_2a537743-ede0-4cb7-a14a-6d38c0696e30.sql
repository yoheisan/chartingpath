-- Restart all 4 partitions from offset 0
-- The fixed orchestrator now calls seed-historical-patterns-mtf
-- directly with correct offset and skipDbCache:true

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