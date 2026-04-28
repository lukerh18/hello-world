-- major_task on habit_log (for Soul/Will daily named task)
alter table habit_log add column if not exists major_task text;

-- Daily journal entries (Spirit)
create table journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  date       date not null,
  content    text not null default '',
  updated_at timestamptz default now(),
  unique(user_id, date)
);
alter table journal_entries enable row level security;
create policy "journal_entries: own rows only"
  on journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reading log (Soul/Mind)
create table reading_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  date        date not null,
  book_title  text not null,
  pages_read  integer not null default 0,
  updated_at  timestamptz default now(),
  unique(user_id, date)
);
alter table reading_log enable row level security;
create policy "reading_log: own rows only"
  on reading_log for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Goals — append-only, latest per category = current
create table goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  category   text not null,
  text       text not null,
  created_at timestamptz default now()
);
alter table goals enable row level security;
create policy "goals: own rows only"
  on goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create index goals_user_category_idx on goals (user_id, category, created_at desc);
