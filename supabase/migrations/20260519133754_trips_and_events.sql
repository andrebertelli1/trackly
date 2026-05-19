-- Trips: an instance of a route on a specific day. Driver starts → marks each
-- kid's events → finishes. Parent reads progress to drive the live UI.

-- 1. Enums.
do $$ begin
  create type public.trip_status as enum ('in_progress', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.trip_event_kind as enum ('boarded', 'dropped', 'noshow', 'undo');
exception when duplicate_object then null;
end $$;

-- 2. Tables.
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  status public.trip_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  started_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists trips_one_active_per_route
  on public.trips (route_id) where status = 'in_progress';

create table if not exists public.trip_kid_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  kid_id uuid not null references public.kids(id) on delete cascade,
  event public.trip_event_kind not null,
  created_at timestamptz not null default now()
);

create index if not exists trip_kid_events_trip_idx on public.trip_kid_events (trip_id);
create index if not exists trip_kid_events_kid_idx  on public.trip_kid_events (kid_id);

alter table public.trips           enable row level security;
alter table public.trip_kid_events enable row level security;

-- 3. RLS policies.

-- trips: driver of the route OR parent on the route can SELECT; driver can INSERT/UPDATE.
drop policy if exists "trips_select_member" on public.trips;
create policy "trips_select_member" on public.trips
  for select to authenticated
  using (public.drives_route(route_id) or public.is_parent_on_route(route_id));

drop policy if exists "trips_insert_driver" on public.trips;
create policy "trips_insert_driver" on public.trips
  for insert to authenticated
  with check (public.drives_route(route_id));

drop policy if exists "trips_update_driver" on public.trips;
create policy "trips_update_driver" on public.trips
  for update to authenticated
  using (public.drives_route(route_id))
  with check (public.drives_route(route_id));

-- trip_kid_events: driver of trip's route can SELECT/INSERT; parent of the kid can SELECT.
drop policy if exists "tke_select_member" on public.trip_kid_events;
create policy "tke_select_member" on public.trip_kid_events
  for select to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_kid_events.trip_id and public.drives_route(t.route_id)
    )
    or
    exists (
      select 1 from public.kids k
      where k.id = trip_kid_events.kid_id and k.parent_id = auth.uid()
    )
  );

drop policy if exists "tke_insert_driver" on public.trip_kid_events;
create policy "tke_insert_driver" on public.trip_kid_events
  for insert to authenticated
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_kid_events.trip_id and public.drives_route(t.route_id)
    )
  );

-- 4. RPCs.

create or replace function public.driver_start_trip(p_route_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not public.drives_route(p_route_id) then
    raise exception 'Você não é o motorista desta rota.' using errcode = '42501';
  end if;
  begin
    insert into public.trips (route_id, started_by)
    values (p_route_id, auth.uid())
    returning id into v_id;
  exception when unique_violation then
    raise exception 'Já existe uma viagem em andamento nessa rota.' using errcode = 'P0007';
  end;
  return v_id;
end;
$$;

revoke execute on function public.driver_start_trip(uuid) from public;
grant execute on function public.driver_start_trip(uuid) to authenticated;

create or replace function public.driver_finish_trip(p_trip_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_route_id uuid;
begin
  select route_id into v_route_id from public.trips where id = p_trip_id;
  if v_route_id is null then
    raise exception 'Viagem não encontrada.' using errcode = 'P0001';
  end if;
  if not public.drives_route(v_route_id) then
    raise exception 'Você não é o motorista desta rota.' using errcode = '42501';
  end if;

  update public.trips
  set status = 'completed', finished_at = now()
  where id = p_trip_id and status = 'in_progress';

  if not found then
    raise exception 'Viagem já foi finalizada.' using errcode = 'P0008';
  end if;
end;
$$;

revoke execute on function public.driver_finish_trip(uuid) from public;
grant execute on function public.driver_finish_trip(uuid) to authenticated;
