-- Fix records that passed multiple layers (including mtf_confluence) but lack validation_completed_at
UPDATE historical_pattern_occurrences
SET validation_status = 'confirmed',
    validation_completed_at = COALESCE(validation_completed_at, now())
WHERE validation_status = 'pending'
  AND validation_layers_passed @> ARRAY['mtf_confluence'];