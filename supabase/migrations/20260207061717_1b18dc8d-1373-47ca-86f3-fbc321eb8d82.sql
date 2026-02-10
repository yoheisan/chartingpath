-- ================================================
-- COMPREHENSIVE SECURITY FIX - Phase 2
-- ================================================

-- ================================================
-- 1. Properly fix Security Definer Views with explicit security_invoker
-- ================================================

-- Recreate article_analytics with security_invoker explicitly true
DROP VIEW IF EXISTS public.article_analytics CASCADE;

CREATE OR REPLACE VIEW public.article_analytics
WITH (security_invoker = true) AS
SELECT 
  a.id,
  a.title,
  a.slug,
  a.category,
  a.content_type,
  a.status,
  a.view_count,
  a.like_count,
  count(DISTINCT av.user_id) AS unique_viewers,
  count(DISTINCT al.user_id) AS unique_likers,
  a.published_at,
  a.created_at
FROM public.learning_articles a
LEFT JOIN public.article_views av ON a.id = av.article_id
LEFT JOIN public.article_likes al ON a.id = al.article_id
GROUP BY a.id, a.title, a.slug, a.category, a.content_type, a.status, 
         a.view_count, a.like_count, a.published_at, a.created_at;

-- Recreate quiz_analytics with security_invoker explicitly true  
DROP VIEW IF EXISTS public.quiz_analytics CASCADE;

CREATE OR REPLACE VIEW public.quiz_analytics
WITH (security_invoker = true) AS
SELECT 
  q.id,
  q.question_code,
  q.category,
  q.difficulty,
  q.pattern_name,
  q.times_shown,
  q.times_correct,
  CASE
    WHEN q.times_shown > 0 
    THEN round(((q.times_correct::numeric / q.times_shown::numeric) * 100::numeric), 2)
    ELSE 0::numeric
  END AS success_rate_percentage,
  count(DISTINCT qa.user_id) AS unique_users_attempted,
  avg(qa.time_taken_seconds) AS avg_time_taken_seconds
FROM public.quiz_questions q
LEFT JOIN public.quiz_attempts qa ON q.id = qa.question_id
WHERE q.is_active = true
GROUP BY q.id, q.question_code, q.category, q.difficulty, q.pattern_name, 
         q.times_shown, q.times_correct;

-- ================================================
-- 2. Fix admin_sessions - remove the USING(true) policy completely
-- ================================================

DROP POLICY IF EXISTS "System can manage admin sessions" ON public.admin_sessions;

-- ================================================
-- 3. Fix social_media_accounts - remove USING(true)
-- ================================================

DROP POLICY IF EXISTS "Admin full access to social_media_accounts" ON public.social_media_accounts;
DROP POLICY IF EXISTS "Admins can manage social accounts" ON public.social_media_accounts;

CREATE POLICY "Admins can manage social accounts"
ON public.social_media_accounts
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- ================================================
-- 4. Fix content_library - remove USING(true)
-- ================================================

DROP POLICY IF EXISTS "Admin full access to content_library" ON public.content_library;
DROP POLICY IF EXISTS "Anyone can read active content" ON public.content_library;
DROP POLICY IF EXISTS "Admins can manage content_library" ON public.content_library;

CREATE POLICY "Anyone can read active content"
ON public.content_library
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage content_library"
ON public.content_library
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- ================================================
-- 5. Fix post_history - remove USING(true) 
-- ================================================

DROP POLICY IF EXISTS "Admin full access to post_history" ON public.post_history;

CREATE POLICY "Admins can manage post history"
ON public.post_history
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));

-- ================================================
-- 6. Fix billing_events - remove USING(true)
-- ================================================

DROP POLICY IF EXISTS "System can manage billing events" ON public.billing_events;
-- User policy already exists from previous migration

-- ================================================
-- 7. Fix artifacts - remove USING(true)
-- ================================================

DROP POLICY IF EXISTS "Service can manage artifacts" ON public.artifacts;
-- User policies already exist from previous migration

-- ================================================
-- 8. Fix subscriptions - make it user-scoped
-- ================================================

DROP POLICY IF EXISTS "System can manage subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()));