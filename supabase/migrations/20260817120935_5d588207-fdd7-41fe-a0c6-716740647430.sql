CREATE INDEX IF NOT EXISTS idx_hpo_valid_resolved
  ON public.historical_pattern_occurrences (execution_status, outcome);

CREATE OR REPLACE FUNCTION public.get_metric_strip_stats()
RETURNS TABLE(
  instrument_count bigint,
  pattern_count bigint,
  valid_resolved_outcomes bigint,
  validated_cells bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT count(*) FROM public.instruments WHERE is_active),
    (SELECT count(*) FROM public.supported_patterns WHERE is_supported),
    (SELECT count(*) FROM public.historical_pattern_occurrences
      WHERE execution_status = 'valid' AND outcome IN ('hit_tp','hit_sl')),
    (SELECT count(*) FROM public.cell_validation
      WHERE is_current AND entry_mode = 'next_open' AND status = 'validated');
$$;

GRANT EXECUTE ON FUNCTION public.get_metric_strip_stats() TO anon, authenticated, service_role;