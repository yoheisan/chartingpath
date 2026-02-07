-- ================================================
-- FIX REMAINING FUNCTION SEARCH_PATH WARNINGS
-- ================================================

-- Fix handle_economic_updated_at function
CREATE OR REPLACE FUNCTION public.handle_economic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Fix update_historical_prices_updated_at function
CREATE OR REPLACE FUNCTION public.update_historical_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;