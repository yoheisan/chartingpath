INSERT INTO service_registry (service_name, display_name, category, health_endpoint, is_active, description)
VALUES 
  ('scan-live-patterns', 'Live Pattern Scanner', 'core', 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/scan-live-patterns', true, 'Scans all asset classes for active chart patterns every 15 minutes'),
  ('check-alert-outcomes', 'Alert Outcome Checker', 'core', 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/check-alert-outcomes', true, 'Verifies SL/TP hits for active alerts and patterns'),
  ('trading-copilot', 'Trading Copilot (⌘K)', 'core', 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/trading-copilot', true, 'AI-powered command center with tool-calling loop'),
  ('generate-market-report', 'Market Report Generator', 'analytics', 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/generate-market-report', true, 'Generates daily market overview reports')
ON CONFLICT (service_name) DO NOTHING;