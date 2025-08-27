-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION update_strategy_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'strategy_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.community_strategies 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.strategy_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.community_strategies 
      SET likes_count = GREATEST(0, likes_count - 1) 
      WHERE id = OLD.strategy_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'strategy_downloads' AND TG_OP = 'INSERT' THEN
    UPDATE public.community_strategies 
    SET downloads_count = downloads_count + 1 
    WHERE id = NEW.strategy_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;