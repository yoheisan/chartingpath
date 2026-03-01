-- Fix records that passed all 3 layers but were never marked confirmed
-- due to Layer 3 not setting validation_status = 'confirmed'
UPDATE historical_pattern_occurrences
SET validation_status = 'confirmed'
WHERE validation_status = 'pending'
  AND validation_layers_passed @> ARRAY['mtf_confluence']
  AND validation_completed_at IS NOT NULL;