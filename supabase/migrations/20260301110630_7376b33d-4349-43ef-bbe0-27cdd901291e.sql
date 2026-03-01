
-- Create table for discovered X accounts via snowball crawling
CREATE TABLE public.x_discovered_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  username TEXT,
  name TEXT,
  followers_count INT,
  following_count INT,
  discovered_via TEXT[] NOT NULL DEFAULT '{}',
  discovery_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'discovered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for filtering/sorting
CREATE INDEX idx_x_discovered_status ON public.x_discovered_accounts (status);
CREATE INDEX idx_x_discovered_score ON public.x_discovered_accounts (discovery_count DESC);

-- Track which seed accounts have been crawled
CREATE TABLE public.x_discovery_seeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seed_user_id TEXT NOT NULL UNIQUE,
  seed_username TEXT,
  crawled_at TIMESTAMPTZ,
  following_count INT,
  accounts_found INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  pagination_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_x_discovery_seeds_status ON public.x_discovery_seeds (status);

-- Enable RLS
ALTER TABLE public.x_discovered_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.x_discovery_seeds ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (service role for edge functions, admin for UI)
CREATE POLICY "Service role full access on x_discovered_accounts"
  ON public.x_discovered_accounts FOR ALL
  USING (public.is_service_role());

CREATE POLICY "Admin read access on x_discovered_accounts"
  ON public.x_discovered_accounts FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin update access on x_discovered_accounts"
  ON public.x_discovered_accounts FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role full access on x_discovery_seeds"
  ON public.x_discovery_seeds FOR ALL
  USING (public.is_service_role());

CREATE POLICY "Admin read access on x_discovery_seeds"
  ON public.x_discovery_seeds FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admin manage x_discovery_seeds"
  ON public.x_discovery_seeds FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admin update x_discovery_seeds"
  ON public.x_discovery_seeds FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_x_discovered_accounts_updated_at
  BEFORE UPDATE ON public.x_discovered_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
