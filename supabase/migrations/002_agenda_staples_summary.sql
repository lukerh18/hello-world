-- staples: user's saved food staples
create table staples (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  name         text not null,
  serving_size text,
  calories     integer,
  protein      numeric,
  carbs        numeric,
  fat          numeric,
  created_at   timestamptz default now()
);
alter table staples enable row level security;
create policy "staples: own rows only"
  on staples for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_agenda: per-day checklist state (checked items + cheat day flag)
create table daily_agenda (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  date         date not null,
  checked_ids  text[] default '{}',
  is_cheat_day boolean default false,
  updated_at   timestamptz default now(),
  unique(user_id, date)
);
alter table daily_agenda enable row level security;
create policy "daily_agenda: own rows only"
  on daily_agenda for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- daily_summary_cache: AI-generated morning briefing, one per user per day
create table daily_summary_cache (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  date       date not null,
  summary    text not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table daily_summary_cache enable row level security;
create policy "daily_summary_cache: own rows only"
  on daily_summary_cache for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
