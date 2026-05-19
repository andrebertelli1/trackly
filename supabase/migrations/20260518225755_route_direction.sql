-- Replace `routes.period` (morning/afternoon) with `routes.direction` (pickup/dropoff).
-- Time-of-day is already captured by pickup_start/arrival_time — the period
-- enum conflated "time of day" with "direction of travel", which breaks for
-- kids who attend afternoon schools.

-- 1. Drop RPCs that reference public.route_period as a parameter type.
drop function if exists public.driver_create_route(uuid, text, public.route_period, text, time, time);
drop function if exists public.admin_create_route(uuid, text, public.route_period, uuid, text, time, time);

-- 2. New enum.
do $$ begin
  create type public.route_direction as enum ('pickup', 'dropoff');
exception when duplicate_object then null;
end $$;

-- 3. Add direction column and migrate existing rows.
alter table public.routes add column if not exists direction public.route_direction;

update public.routes
set direction =
  case period::text
    when 'morning' then 'pickup'::public.route_direction
    when 'afternoon' then 'dropoff'::public.route_direction
  end
where direction is null;

alter table public.routes alter column direction set not null;

-- 4. Drop the old period column + type.
alter table public.routes drop column if exists period;
drop type if exists public.route_period;

-- 5. Recreate driver_create_route with the new param.
create or replace function public.driver_create_route(
  p_school_id uuid,
  p_van_label text,
  p_direction public.route_direction,
  p_van_color text default null,
  p_pickup_start time default null,
  p_arrival_time time default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not public.is_driver() then
    raise exception 'Apenas motoristas podem criar rotas.' using errcode = '42501';
  end if;
  if trim(coalesce(p_van_label, '')) = '' then
    raise exception 'Informe a placa/etiqueta da van.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'Escola não encontrada.' using errcode = 'P0006';
  end if;

  insert into public.routes (
    school_id, driver_id, van_label, van_color, direction, pickup_start, arrival_time
  ) values (
    p_school_id, auth.uid(), trim(p_van_label),
    nullif(trim(coalesce(p_van_color, '')), ''),
    p_direction, p_pickup_start, p_arrival_time
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.driver_create_route(uuid, text, public.route_direction, text, time, time) from public;
grant execute on function public.driver_create_route(uuid, text, public.route_direction, text, time, time) to authenticated;

-- 6. Recreate admin_create_route with the new param.
create or replace function public.admin_create_route(
  p_school_id uuid,
  p_van_label text,
  p_direction public.route_direction,
  p_driver_id uuid default null,
  p_van_color text default null,
  p_pickup_start time default null,
  p_arrival_time time default null
) returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.routes (school_id, driver_id, van_label, van_color, direction, pickup_start, arrival_time)
  values (p_school_id, p_driver_id, p_van_label, p_van_color, p_direction, p_pickup_start, p_arrival_time)
  returning id;
$$;

revoke execute on function public.admin_create_route(uuid, text, public.route_direction, uuid, text, time, time) from public;
revoke execute on function public.admin_create_route(uuid, text, public.route_direction, uuid, text, time, time) from authenticated;
