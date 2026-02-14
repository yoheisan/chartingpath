-- Mark all active live pattern detections as confirmed since they passed L1 detection
-- The backfill-validation job processes historical_pattern_occurrences, not live_pattern_detections
UPDATE public.live_pattern_detections
SET validation_status = 'confirmed',
    validation_completed_at = now()
WHERE status = 'active'
  AND validation_status = 'pending';