
CREATE TABLE public.pattern_verification_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  pattern_id TEXT NOT NULL,
  pattern_name TEXT,
  timeframe TEXT NOT NULL,
  direction TEXT,
  asset_type TEXT,
  failure_reason TEXT NOT NULL,
  detection_source TEXT NOT NULL,
  detection_data JSONB,
  detected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pattern_verification_failures ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pvf_symbol_pattern ON public.pattern_verification_failures (symbol, pattern_id);
CREATE INDEX idx_pvf_created_at ON public.pattern_verification_failures (created_at DESC);
CREATE INDEX idx_pvf_failure_reason ON public.pattern_verification_failures (failure_reason);
