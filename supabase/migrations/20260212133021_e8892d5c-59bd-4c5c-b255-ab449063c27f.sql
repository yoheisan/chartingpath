-- Delete stale historical pattern occurrences for the 6 upgraded pattern types
-- These will be re-seeded by the daily cron jobs with the new Bulkowski-standard filters

DELETE FROM public.historical_pattern_occurrences 
WHERE pattern_name IN (
  'Head and Shoulders', 
  'Inverse Head and Shoulders', 
  'Triple Top', 
  'Triple Bottom', 
  'Rising Wedge', 
  'Falling Wedge'
);

-- Also clear any cached analytics for these patterns
DELETE FROM public.outcome_analytics_cache
WHERE pattern_name IN (
  'Head and Shoulders', 
  'Inverse Head and Shoulders', 
  'Triple Top', 
  'Triple Bottom', 
  'Rising Wedge', 
  'Falling Wedge'
);