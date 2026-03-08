create table if not exists public.user_email_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  welcome_sent boolean default false,
  getting_started_sent boolean default false,
  alert_emails boolean default true,
  weekly_digest boolean default true,
  unsubscribed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_email_preferences enable row level security;

create policy "Users can manage own email preferences"
  on public.user_email_preferences
  for all using (auth.uid() = user_id);

-- Allow service role (edge functions) to upsert email preferences
create policy "Service role full access to email preferences"
  on public.user_email_preferences
  for all using (public.is_service_role());