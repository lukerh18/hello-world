alter table staples
  add column if not exists meal_definition text default 'snack'
  check (meal_definition in ('breakfast', 'lunch', 'dinner', 'snack', 'dessert'));
