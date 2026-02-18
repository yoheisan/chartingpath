INSERT INTO public.pattern_validation_layers (name, description, layer_order, layer_type, edge_function_name, fallback_action, is_active, timeout_ms, config)
VALUES (
  'mtf_confluence',
  'Multi-timeframe confluence validation - checks for pattern confirmation across higher timeframes',
  3,
  'validator',
  'validate-mtf-confluence',
  'pass',
  true,
  15000,
  '{}'
)
ON CONFLICT (name) DO NOTHING;