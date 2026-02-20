-- Reset circuit breaker so force=true test can proceed
UPDATE public.worker_runs 
SET status = 'idle', 
    consecutive_failures = 0, 
    circuit_open_until = NULL
WHERE worker_name = 'backfill-validation';
