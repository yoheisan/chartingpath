CREATE TABLE IF NOT EXISTS public.user_data_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('eodhd', 'alpaca')),
  api_key_encrypted text NOT NULL,
  api_secret_encrypted text,
  is_active boolean DEFAULT true,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_data_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own data providers"
  ON public.user_data_providers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);