
-- ============================================
-- Pattern Detection Pipeline Schema
-- ============================================

-- Table: Registered validation layers (extensible)
CREATE TABLE public.pattern_validation_layers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  layer_order INTEGER NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  layer_type TEXT NOT NULL DEFAULT 'validator', -- 'detector', 'validator', 'enricher'
  edge_function_name TEXT, -- which edge function implements this layer
  is_active BOOLEAN NOT NULL DEFAULT true,
  timeout_ms INTEGER NOT NULL DEFAULT 15000,
  fallback_action TEXT NOT NULL DEFAULT 'pass', -- 'pass', 'reject', 'skip'
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the two initial layers
INSERT INTO public.pattern_validation_layers (layer_order, name, description, layer_type, edge_function_name)
VALUES 
  (1, 'bulkowski_engine', 'Deterministic structural pattern detection using Bulkowski methodology', 'detector', NULL),
  (2, 'ai_context_validator', 'AI-based contextual validation using trend, volume, and volatility analysis', 'validator', 'validate-pattern-context');

-- Table: Pipeline results per detection per layer
CREATE TABLE public.pattern_pipeline_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  detection_id UUID NOT NULL, -- references the pattern occurrence (historical or live)
  detection_source TEXT NOT NULL DEFAULT 'historical', -- 'historical', 'live'
  layer_name TEXT NOT NULL REFERENCES public.pattern_validation_layers(name),
  verdict TEXT NOT NULL, -- 'confirmed', 'rejected', 'skipped', 'timeout', 'error'
  confidence NUMERIC(5,4), -- 0.0000 to 1.0000
  reasoning TEXT, -- human-readable explanation
  layer_output JSONB DEFAULT '{}', -- full model output for debugging
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by detection
CREATE INDEX idx_pipeline_results_detection ON public.pattern_pipeline_results(detection_id, detection_source);
CREATE INDEX idx_pipeline_results_layer ON public.pattern_pipeline_results(layer_name, verdict);
CREATE INDEX idx_pipeline_results_created ON public.pattern_pipeline_results(created_at DESC);

-- Add validation_status column to live_pattern_detections
ALTER TABLE public.live_pattern_detections 
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS validation_layers_passed TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS validation_completed_at TIMESTAMPTZ;

-- Add validation_status column to historical_pattern_occurrences
ALTER TABLE public.historical_pattern_occurrences
  ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS validation_layers_passed TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS validation_completed_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.pattern_validation_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_pipeline_results ENABLE ROW LEVEL SECURITY;

-- Validation layers: readable by all authenticated users, writable only by service role
CREATE POLICY "Anyone can read validation layers"
  ON public.pattern_validation_layers FOR SELECT
  USING (true);

CREATE POLICY "Only service role can modify validation layers"
  ON public.pattern_validation_layers FOR ALL
  USING (public.is_service_role());

-- Pipeline results: readable by all authenticated, writable by service role
CREATE POLICY "Authenticated users can read pipeline results"
  ON public.pattern_pipeline_results FOR SELECT
  USING (true);

CREATE POLICY "Only service role can insert pipeline results"
  ON public.pattern_pipeline_results FOR INSERT
  WITH CHECK (public.is_service_role());

-- Trigger for updated_at on validation_layers
CREATE TRIGGER update_validation_layers_updated_at
  BEFORE UPDATE ON public.pattern_validation_layers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
