-- ================================================
-- FIX REMAINING PERMISSIVE POLICIES - Phase 3
-- Convert "service" policies to proper service role checks
-- ================================================

-- Helper: Create a function to check if request is from service role
-- Service role requests have the role claim set to 'service_role'
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role',
    false
  )
$$;

-- ================================================
-- 1. Fix backtest_result_cache - service role only for writes
-- ================================================

DROP POLICY IF EXISTS "Service role can manage cache" ON public.backtest_result_cache;

CREATE POLICY "Service role can manage cache"
ON public.backtest_result_cache
FOR ALL
USING (public.is_service_role());

-- ================================================
-- 2. Fix historical_pattern_occurrences - service role only for writes
-- ================================================

DROP POLICY IF EXISTS "Service can manage historical patterns" ON public.historical_pattern_occurrences;

CREATE POLICY "Service role can manage patterns"
ON public.historical_pattern_occurrences
FOR ALL
USING (public.is_service_role());

-- ================================================
-- 3. Fix historical_prices - service role only for writes
-- ================================================

DROP POLICY IF EXISTS "Service role can insert historical prices" ON public.historical_prices;

CREATE POLICY "Service role can manage prices"
ON public.historical_prices
FOR INSERT
WITH CHECK (public.is_service_role());

-- ================================================
-- 4. Fix outcome_analytics_cache - service role only
-- ================================================

DROP POLICY IF EXISTS "Service role can manage outcome analytics" ON public.outcome_analytics_cache;

CREATE POLICY "Service role can manage analytics cache"
ON public.outcome_analytics_cache
FOR ALL
USING (public.is_service_role());

-- ================================================
-- 5. Fix pattern_hit_rates - service role only for writes
-- ================================================

DROP POLICY IF EXISTS "Service can manage pattern hit rates" ON public.pattern_hit_rates;

CREATE POLICY "Service role can manage hit rates"
ON public.pattern_hit_rates
FOR ALL
USING (public.is_service_role());

-- ================================================
-- 6. Fix pattern_outcomes - service role only for writes
-- ================================================

DROP POLICY IF EXISTS "Service can manage pattern outcomes" ON public.pattern_outcomes;

CREATE POLICY "Service role can manage outcomes"
ON public.pattern_outcomes
FOR ALL
USING (public.is_service_role());

-- ================================================
-- 7. Fix project_runs - service role for updates + user owns project
-- ================================================

DROP POLICY IF EXISTS "Service can update project runs" ON public.project_runs;

CREATE POLICY "Service role can update project runs"
ON public.project_runs
FOR UPDATE
USING (public.is_service_role());

-- ================================================
-- 8. Fix strategy_executions - service role only
-- ================================================

DROP POLICY IF EXISTS "System can create strategy execution records" ON public.strategy_executions;

CREATE POLICY "Service role can create executions"
ON public.strategy_executions
FOR INSERT
WITH CHECK (public.is_service_role());

-- ================================================
-- 9. Fix strategy_performance - service role only
-- ================================================

DROP POLICY IF EXISTS "System can create strategy performance records" ON public.strategy_performance;

CREATE POLICY "Service role can create performance"
ON public.strategy_performance
FOR INSERT
WITH CHECK (public.is_service_role());

-- ================================================
-- 10. Fix trading_achievements - service role only
-- ================================================

DROP POLICY IF EXISTS "System can create achievements" ON public.trading_achievements;

CREATE POLICY "Service role can create achievements"
ON public.trading_achievements
FOR INSERT
WITH CHECK (public.is_service_role());

-- ================================================
-- 11. Fix usage_credits - service role only
-- ================================================

DROP POLICY IF EXISTS "Service can manage credits" ON public.usage_credits;

CREATE POLICY "Service role can manage credits"
ON public.usage_credits
FOR ALL
USING (public.is_service_role());

-- ================================================
-- 12. Fix usage_ledger - service role only
-- ================================================

DROP POLICY IF EXISTS "Service can manage ledger" ON public.usage_ledger;

CREATE POLICY "Service role can manage ledger"
ON public.usage_ledger
FOR ALL
USING (public.is_service_role());

-- ================================================
-- 13. Fix alerts_log - service role for edge function inserts
-- ================================================

DROP POLICY IF EXISTS "Edge functions can insert alert logs" ON public.alerts_log;

CREATE POLICY "Service role can insert alert logs"
ON public.alerts_log
FOR INSERT
WITH CHECK (public.is_service_role());