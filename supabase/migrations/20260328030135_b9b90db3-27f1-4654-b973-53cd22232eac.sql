create table if not exists public.market_breadth_cache (
  id uuid primary key default gen_random_uuid(),
  advancing numeric not null,
  declining numeric not null,
  unchanged numeric not null,
  advance_decline_ratio numeric not null,
  advance_decline_line numeric not null,
  exchange text not null default 'NYSE',
  created_at timestamptz not null default now()
);

create index idx_market_breadth_cache_created_at on public.market_breadth_cache (created_at desc);

alter table public.market_breadth_cache enable row level security;

create policy "Service role full access on market_breadth_cache"
  on public.market_breadth_cache
  for all
  using (public.is_service_role())
  with check (public.is_service_role());