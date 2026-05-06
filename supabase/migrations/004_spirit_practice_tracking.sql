-- Spirit practice tracking fields on daily habit log
alter table habit_log add column if not exists meditation_minutes integer not null default 0;
alter table habit_log add column if not exists bible_minutes integer not null default 0;
alter table habit_log add column if not exists read_proverbs boolean not null default false;
alter table habit_log add column if not exists faster_scale_level integer;

-- Keep FASTer scale values bounded to 1-7 when set
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'habit_log_faster_scale_level_check'
  ) then
    alter table habit_log
      add constraint habit_log_faster_scale_level_check
      check (faster_scale_level is null or (faster_scale_level >= 1 and faster_scale_level <= 7));
  end if;
end $$;
