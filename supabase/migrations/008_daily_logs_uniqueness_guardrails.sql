-- Ensure one canonical row per user/day across daily tracking tables.
-- Existing deployments should already have these constraints, but this migration
-- backfills cleanup and re-applies constraints defensively where needed.

with ranked as (
  select
    ctid,
    row_number() over (
      partition by user_id, date
      order by date desc
    ) as rn
  from nutrition_logs
)
delete from nutrition_logs n
using ranked r
where n.ctid = r.ctid
  and r.rn > 1;

with ranked as (
  select
    ctid,
    row_number() over (
      partition by user_id, date
      order by date desc
    ) as rn
  from weight_log
)
delete from weight_log w
using ranked r
where w.ctid = r.ctid
  and r.rn > 1;

with ranked as (
  select
    ctid,
    row_number() over (
      partition by user_id, date
      order by date desc
    ) as rn
  from body_measurements
)
delete from body_measurements b
using ranked r
where b.ctid = r.ctid
  and r.rn > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'nutrition_logs_user_id_date_key'
  ) then
    alter table nutrition_logs
      add constraint nutrition_logs_user_id_date_key unique (user_id, date);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'weight_log_user_id_date_key'
  ) then
    alter table weight_log
      add constraint weight_log_user_id_date_key unique (user_id, date);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'body_measurements_user_id_date_key'
  ) then
    alter table body_measurements
      add constraint body_measurements_user_id_date_key unique (user_id, date);
  end if;
end $$;
