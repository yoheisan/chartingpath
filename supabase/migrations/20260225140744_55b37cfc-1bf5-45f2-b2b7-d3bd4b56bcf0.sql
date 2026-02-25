INSERT INTO service_registry (service_name, display_name, health_endpoint, is_active, category)
VALUES ('check-alert-matches', 'Alert Matcher', 'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/check-alert-matches', true, 'core')
ON CONFLICT (service_name) DO NOTHING;