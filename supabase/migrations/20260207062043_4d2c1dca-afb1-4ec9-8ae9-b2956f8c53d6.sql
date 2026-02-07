-- ================================================
-- CLEANUP DUPLICATE POLICIES
-- ================================================

-- Remove duplicate/conflicting policies on product_events
DROP POLICY IF EXISTS "Users can view own events" ON public.product_events;
-- Keep the properly scoped policies

-- ================================================
-- For historical_pattern_occurrences and live_pattern_detections:
-- These are INTENTIONALLY PUBLIC for the trading screener feature.
-- Users need to browse patterns without being logged in.
-- We'll add a note but not restrict them.
-- ================================================

-- Note: The following tables are intentionally publicly readable:
-- - historical_pattern_occurrences (public screener)
-- - live_pattern_detections (public screener) 
-- - historical_prices (public chart data)
-- - economic_events (public calendar)
-- - plan_pricing (public pricing page)
-- - learning_articles (public blog/education)
-- - quiz_questions (public learning)

-- These support the freemium business model where basic access is free
-- and premium features (alerts, backtesting, exports) require authentication.