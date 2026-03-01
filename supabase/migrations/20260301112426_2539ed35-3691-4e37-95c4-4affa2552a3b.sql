
-- Add display alias to profiles
ALTER TABLE public.profiles
  ADD COLUMN display_alias TEXT,
  ADD COLUMN avatar_color TEXT;

-- Generate default aliases for existing users
UPDATE public.profiles
SET display_alias = 'Trader_' || substr(md5(user_id::text), 1, 6),
    avatar_color = '#' || substr(md5(user_id::text || 'color'), 1, 6)
WHERE display_alias IS NULL;

-- Auto-generate alias for new profiles via trigger
CREATE OR REPLACE FUNCTION public.set_default_display_alias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.display_alias IS NULL THEN
    NEW.display_alias := 'Trader_' || substr(md5(NEW.user_id::text), 1, 6);
  END IF;
  IF NEW.avatar_color IS NULL THEN
    NEW.avatar_color := '#' || substr(md5(NEW.user_id::text || 'color'), 1, 6);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profile_display_alias
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_display_alias();
