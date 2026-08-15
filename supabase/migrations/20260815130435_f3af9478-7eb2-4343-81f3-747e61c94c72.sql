CREATE OR REPLACE VIEW public.v_cell_validation_latest AS
SELECT DISTINCT ON (pattern_id, timeframe, asset_type, direction)
  pattern_id, timeframe, asset_type, direction,
  status, persisted, n_train, n_test,
  edge_points_train, edge_points_test,
  train_start, train_end, test_start, test_end,
  candidate_registered_at, validated_at
FROM public.cell_validation
-- Only windows that have actually closed. Pre-registered candidates for the
-- NEXT period carry a future test_end and no scores yet; treating one as the
-- latest verdict would blank out every cell.
WHERE test_end <= current_date
ORDER BY pattern_id, timeframe, asset_type, direction, test_end DESC, validated_at DESC;