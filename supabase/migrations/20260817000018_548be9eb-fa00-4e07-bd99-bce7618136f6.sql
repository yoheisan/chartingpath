-- 1. Security definer views -> invoker
ALTER VIEW public.v_cell_validation_latest SET (security_invoker = true);
ALTER VIEW public.v_live_detections_with_edge SET (security_invoker = true);

-- 2. backtest_result_cache: no anonymous reads
DROP POLICY IF EXISTS "Cache is publicly readable" ON public.backtest_result_cache;
CREATE POLICY "Authenticated users can read cache"
  ON public.backtest_result_cache FOR SELECT TO authenticated USING (true);
REVOKE ALL ON public.backtest_result_cache FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.backtest_result_cache FROM authenticated;
GRANT SELECT ON public.backtest_result_cache TO authenticated;
GRANT ALL ON public.backtest_result_cache TO service_role;

-- 3. email_send_log: service-role writes only
REVOKE INSERT, UPDATE, DELETE ON public.email_send_log FROM anon, authenticated;
REVOKE ALL ON public.email_send_log FROM anon;
GRANT SELECT ON public.email_send_log TO authenticated;
GRANT ALL ON public.email_send_log TO service_role;
DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_send_log;
CREATE POLICY "Service role can manage email logs"
  ON public.email_send_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. live_pattern_detections: drop broken share-token policy
DROP POLICY IF EXISTS "Anyone can view patterns with share_token" ON public.live_pattern_detections;

-- 5. Event tables: constrain insert attribution
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;
CREATE POLICY "Authenticated users insert own analytics"
  ON public.analytics_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anonymous inserts analytics without user"
  ON public.analytics_events FOR INSERT TO anon WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert product events" ON public.product_events;
CREATE POLICY "Authenticated users insert own product events"
  ON public.product_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anonymous inserts product events without user"
  ON public.product_events FOR INSERT TO anon WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own article views" ON public.article_views;
CREATE POLICY "Authenticated users insert own article views"
  ON public.article_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anonymous inserts article views without user"
  ON public.article_views FOR INSERT TO anon WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert their own search analytics" ON public.instrument_search_analytics;
CREATE POLICY "Authenticated users insert own search analytics"
  ON public.instrument_search_analytics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anonymous inserts search analytics without user"
  ON public.instrument_search_analytics FOR INSERT TO anon WITH CHECK (user_id IS NULL);