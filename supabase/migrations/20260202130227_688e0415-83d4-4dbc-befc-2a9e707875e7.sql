-- Add outcome columns for different R:R tiers to historical_pattern_occurrences
-- Baseline R:R 2 outcomes already exist in 'outcome' and 'outcome_pnl_percent' columns

-- R:R 3 tier outcomes
ALTER TABLE public.historical_pattern_occurrences
ADD COLUMN IF NOT EXISTS outcome_rr3 TEXT,
ADD COLUMN IF NOT EXISTS outcome_pnl_percent_rr3 NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS bars_to_outcome_rr3 INTEGER;

-- R:R 4 tier outcomes  
ALTER TABLE public.historical_pattern_occurrences
ADD COLUMN IF NOT EXISTS outcome_rr4 TEXT,
ADD COLUMN IF NOT EXISTS outcome_pnl_percent_rr4 NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS bars_to_outcome_rr4 INTEGER;

-- R:R 5 tier outcomes
ALTER TABLE public.historical_pattern_occurrences
ADD COLUMN IF NOT EXISTS outcome_rr5 TEXT,
ADD COLUMN IF NOT EXISTS outcome_pnl_percent_rr5 NUMERIC(10,4),
ADD COLUMN IF NOT EXISTS bars_to_outcome_rr5 INTEGER;

-- Add index for efficient querying of outcomes by R:R tier
CREATE INDEX IF NOT EXISTS idx_hpo_outcome_rr3 ON public.historical_pattern_occurrences(outcome_rr3) WHERE outcome_rr3 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hpo_outcome_rr4 ON public.historical_pattern_occurrences(outcome_rr4) WHERE outcome_rr4 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hpo_outcome_rr5 ON public.historical_pattern_occurrences(outcome_rr5) WHERE outcome_rr5 IS NOT NULL;

-- Add computed_at timestamp to track when multi-RR outcomes were calculated
ALTER TABLE public.historical_pattern_occurrences
ADD COLUMN IF NOT EXISTS multi_rr_computed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.historical_pattern_occurrences.outcome_rr3 IS 'Outcome at R:R 3 tier (win/loss/timeout)';
COMMENT ON COLUMN public.historical_pattern_occurrences.outcome_rr4 IS 'Outcome at R:R 4 tier (win/loss/timeout)';
COMMENT ON COLUMN public.historical_pattern_occurrences.outcome_rr5 IS 'Outcome at R:R 5 tier (win/loss/timeout)';