-- ─── Profiles ────────────────────────────────────────────────────────────────
create table profiles (
  id                    uuid references auth.users primary key,
  name                  text,
  height_in             numeric,
  starting_weight_lbs   numeric,
  goal_weight_lbs       numeric,
  goal_date             date,
  program_start_date    date,
  nutrition_targets     jsonb not null default '{"calories":2500,"protein":180,"carbs":250,"fat":80}',
  health_context        text,
  oura_token            text,
  google_client_id      text,
  anthropic_api_key     text,
  created_at            timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profiles: own row only"
  on profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Workout Logs ─────────────────────────────────────────────────────────────
create table workout_logs (
  id            uuid primary key,
  user_id       uuid references auth.users not null,
  date          date not null,
  day_of_week   text not null,
  phase         text not null,
  program_week  int not null,
  exercises     jsonb not null default '[]',
  started_at    timestamptz,
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz not null default now()
);

alter table workout_logs enable row level security;
create policy "workout_logs: own rows only"
  on workout_logs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index workout_logs_user_date on workout_logs (user_id, date);

-- ─── Nutrition Logs ───────────────────────────────────────────────────────────
create table nutrition_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  date        date not null,
  meals       jsonb not null default '[]',
  water_oz    numeric not null default 0,
  created_at  timestamptz not null default now(),
  unique (user_id, date)
);

alter table nutrition_logs enable row level security;
create policy "nutrition_logs: own rows only"
  on nutrition_logs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index nutrition_logs_user_date on nutrition_logs (user_id, date);

-- ─── Weight Log ───────────────────────────────────────────────────────────────
create table weight_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  date        date not null,
  weight      numeric not null,
  created_at  timestamptz not null default now(),
  unique (user_id, date)
);

alter table weight_log enable row level security;
create policy "weight_log: own rows only"
  on weight_log for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index weight_log_user_date on weight_log (user_id, date);

-- ─── Body Measurements ────────────────────────────────────────────────────────
create table body_measurements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  date        date not null,
  chest       numeric,
  waist       numeric,
  arms        numeric,
  thighs      numeric,
  body_fat    numeric,
  created_at  timestamptz not null default now(),
  unique (user_id, date)
);

alter table body_measurements enable row level security;
create policy "body_measurements: own rows only"
  on body_measurements for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Habit Config ─────────────────────────────────────────────────────────────
create table habit_config (
  user_id     uuid references auth.users primary key,
  habits      jsonb not null default '[]',
  north_star  text not null default '',
  week_focus  text not null default '',
  updated_at  timestamptz not null default now()
);

alter table habit_config enable row level security;
create policy "habit_config: own row only"
  on habit_config for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Habit Log ────────────────────────────────────────────────────────────────
create table habit_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users not null,
  date           date not null,
  completed_ids  text[] not null default '{}',
  chore_done     boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (user_id, date)
);

alter table habit_log enable row level security;
create policy "habit_log: own rows only"
  on habit_log for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index habit_log_user_date on habit_log (user_id, date);

-- ─── Weekly Review Cache ──────────────────────────────────────────────────────
create table weekly_review_cache (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  week_start    date not null,
  review_text   text not null,
  generated_at  timestamptz not null,
  created_at    timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table weekly_review_cache enable row level security;
create policy "weekly_review_cache: own rows only"
  on weekly_review_cache for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Health Q&A History ───────────────────────────────────────────────────────
create table health_qa (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  question      text not null,
  answer        text not null,
  citations     jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

alter table health_qa enable row level security;
create policy "health_qa: own rows only"
  on health_qa for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index health_qa_user_created on health_qa (user_id, created_at desc);
