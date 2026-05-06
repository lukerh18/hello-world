-- Keep workout logs canonical: one row per user per date.
-- This prevents stale reads caused by duplicate daily rows.
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, date
      order by completed_at desc nulls last, id desc
    ) as rn
  from workout_logs
)
delete from workout_logs w
using ranked r
where w.id = r.id
  and r.rn > 1;

alter table workout_logs
  add constraint workout_logs_user_id_date_key unique (user_id, date);
