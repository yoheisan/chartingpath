CREATE OR REPLACE FUNCTION public.get_user_activity_summary()
RETURNS TABLE (
  user_id uuid,
  last_active_at timestamptz,
  active_days_7d integer,
  active_days_30d integer,
  total_page_views bigint,
  top_features jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_events AS (
    SELECT
      ae.user_id,
      MAX(ae.ts) AS last_active_at,
      COUNT(DISTINCT ae.ts::date) FILTER (WHERE ae.ts >= now() - interval '7 days') AS active_days_7d,
      COUNT(DISTINCT ae.ts::date) FILTER (WHERE ae.ts >= now() - interval '30 days') AS active_days_30d,
      COUNT(*) FILTER (WHERE ae.event_name = 'page.view') AS total_page_views
    FROM analytics_events ae
    WHERE ae.user_id IS NOT NULL
    GROUP BY ae.user_id
  ),
  feature_counts AS (
    SELECT
      ae.user_id,
      ae.event_name,
      COUNT(*) AS cnt
    FROM analytics_events ae
    WHERE ae.user_id IS NOT NULL
      AND ae.event_name NOT IN ('page.view', 'page.leave', 'landing.section_viewed', 'landing_view', 'auth_page.viewed', 'auth_page.abandoned', 'auth_page.form_start', 'auth_page.submitted')
    GROUP BY ae.user_id, ae.event_name
  ),
  top_features_agg AS (
    SELECT
      fc.user_id,
      jsonb_agg(jsonb_build_object('name', fc.event_name, 'count', fc.cnt) ORDER BY fc.cnt DESC) AS top_features
    FROM (
      SELECT fc2.*, ROW_NUMBER() OVER (PARTITION BY fc2.user_id ORDER BY fc2.cnt DESC) AS rn
      FROM feature_counts fc2
    ) fc
    WHERE fc.rn <= 5
    GROUP BY fc.user_id
  )
  SELECT
    ue.user_id,
    ue.last_active_at,
    ue.active_days_7d::integer,
    ue.active_days_30d::integer,
    ue.total_page_views,
    COALESCE(tfa.top_features, '[]'::jsonb)
  FROM user_events ue
  LEFT JOIN top_features_agg tfa ON tfa.user_id = ue.user_id;
$$;