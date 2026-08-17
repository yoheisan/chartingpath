-- Exclude non-tradable occurrences (gapped through stop / past target, no next bar,
-- invalid risk distance) from every expectancy, edge and validation calculation.
-- Rows stay in the table; only the statistics ignore them.
DO $$
DECLARE
  r record;
  v_def text;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND p.proname IN (
        'get_pattern_edge','get_edge_atlas_rankings','get_edge_atlas_rankings_filtered',
        'get_edge_atlas_rankings_fx','get_grade_counts_for_selection','get_pattern_outcome_cells',
        'get_validated_edge_pool','get_validated_pool_instruments','get_validated_pool_summary',
        'refresh_grade_outcome_stats','run_cell_validation')
  LOOP
    v_def := pg_get_functiondef(r.oid);
    IF position('execution_status' in v_def) > 0 THEN
      CONTINUE;
    END IF;
    v_def := replace(v_def,
      'public.historical_pattern_occurrences h',
      '(SELECT * FROM public.historical_pattern_occurrences WHERE execution_status = ''valid'') h');
    EXECUTE v_def;
  END LOOP;
END $$;