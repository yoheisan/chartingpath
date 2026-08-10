CREATE OR REPLACE VIEW public.v_funnel_daily
WITH (security_invoker = true)
AS
WITH clean_sessions AS (
  -- A session is excluded entirely if ANY of its events was flagged bot-suspect.
  SELECT session_id
  FROM public.analytics_events
  WHERE session_id IS NOT NULL
  GROUP BY session_id
  HAVING bool_or(COALESCE(is_bot_suspect, false)) = false
),
clean_events AS (
  SELECT e.session_id,
         e.event_name,
         (e.ts AT TIME ZONE 'UTC')::date AS day
  FROM public.analytics_events e
  JOIN clean_sessions cs ON cs.session_id = e.session_id
)
SELECT
  day,
  COUNT(DISTINCT session_id) AS landed,
  COUNT(DISTINCT session_id) FILTER (
    WHERE event_name = 'session.engaged'
  ) AS engaged,
  COUNT(DISTINCT session_id) FILTER (
    WHERE event_name IN ('auth.page_viewed', 'auth_page.viewed')
  ) AS reached_auth,
  COUNT(DISTINCT session_id) FILTER (
    WHERE event_name IN ('auth.form_start', 'auth_page.form_start')
  ) AS form_start,
  COUNT(DISTINCT session_id) FILTER (
    WHERE event_name = 'auth.signup_completed'
  ) AS signup_completed
FROM clean_events
GROUP BY day
ORDER BY day DESC;

COMMENT ON VIEW public.v_funnel_daily IS
'Daily signup funnel over analytics_events, counting DISTINCT sessions per stage. Bot filtering is MANDATORY and is applied here: any session with is_bot_suspect = true on ANY of its events is dropped entirely, not just that event. Roughly 37% of raw page.view rows are bot traffic, so unfiltered funnel numbers are meaningless and will overstate the top of the funnel while leaving the bottom unchanged. Stages: landed (any event), engaged (session.engaged), reached_auth (auth.page_viewed, legacy auth_page.viewed), form_start (auth.form_start, legacy auth_page.form_start), signup_completed (auth.signup_completed).';

GRANT SELECT ON public.v_funnel_daily TO authenticated;
GRANT SELECT ON public.v_funnel_daily TO service_role;