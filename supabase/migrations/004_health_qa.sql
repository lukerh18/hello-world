-- Health Q&A history — saved by ask-health edge function
create table health_qa (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  question   text not null,
  answer     text not null,
  citations  jsonb not null default '[]',
  created_at timestamptz default now()
);
alter table health_qa enable row level security;
create policy "health_qa: own rows only"
  on health_qa for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index health_qa_user_idx on health_qa (user_id, created_at desc);
