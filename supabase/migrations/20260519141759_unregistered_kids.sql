-- Allow drivers to register kids whose parents haven't joined the app yet.
-- These rows have parent_id=NULL and added_by_driver_id=auth.uid. RLS prevents
-- them from appearing in any parent's app while keeping them visible to the
-- driver across edit + check-in flows.

-- 1. Relax parent_id and add added_by_driver_id with a XOR ownership check.
alter table public.kids alter column parent_id drop not null;

alter table public.kids
  add column if not exists added_by_driver_id uuid references auth.users(id) on delete set null;

alter table public.kids drop constraint if exists kids_owner_check;
alter table public.kids
  add constraint kids_owner_check check (
    (parent_id is not null and added_by_driver_id is null)
    or (parent_id is null and added_by_driver_id is not null)
  );

-- 2. Extend SELECT policy to include driver-added kids; add UPDATE/DELETE for the adding driver.
drop policy if exists "kids_select_own_or_driver" on public.kids;
create policy "kids_select_own_or_driver" on public.kids
  for select to authenticated
  using (
    parent_id = auth.uid()
    or added_by_driver_id = auth.uid()
    or public.is_driver_of_kid(id)
  );

drop policy if exists "kids_modify_driver_added" on public.kids;
create policy "kids_modify_driver_added" on public.kids
  for update to authenticated
  using (added_by_driver_id = auth.uid())
  with check (added_by_driver_id = auth.uid());

drop policy if exists "kids_delete_driver_added" on public.kids;
create policy "kids_delete_driver_added" on public.kids
  for delete to authenticated
  using (added_by_driver_id = auth.uid());

-- 3. RPC: driver registers an unregistered kid + auto-attaches to all the van's routes.
create or replace function public.driver_add_unregistered_kid(
  p_van_id uuid,
  p_full_name text,
  p_pickup_address text,
  p_short_name text default null,
  p_dropoff_address text default null,
  p_grade int default null,
  p_color text default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := trim(p_full_name);
  v_pickup text := trim(p_pickup_address);
  v_kid_id uuid;
begin
  if not public.drives_van(p_van_id) then
    raise exception 'Você não é o motorista desta van.' using errcode = '42501';
  end if;
  if v_name = '' or v_name is null then
    raise exception 'Nome da criança não pode estar vazio.' using errcode = '22023';
  end if;
  if v_pickup = '' or v_pickup is null then
    raise exception 'Endereço de embarque é obrigatório.' using errcode = '22023';
  end if;

  insert into public.kids (
    parent_id, added_by_driver_id,
    full_name, short_name, grade, color,
    pickup_address, dropoff_address
  )
  values (
    null, auth.uid(),
    v_name,
    nullif(trim(coalesce(p_short_name, '')), ''),
    p_grade,
    nullif(trim(coalesce(p_color, '')), ''),
    v_pickup,
    nullif(trim(coalesce(p_dropoff_address, '')), '')
  )
  returning id into v_kid_id;

  -- Attach to every route of the van.
  insert into public.kid_route_assignments (kid_id, route_id)
  select v_kid_id, r.id from public.routes r where r.van_id = p_van_id
  on conflict (kid_id, route_id) do nothing;

  return v_kid_id;
end;
$$;

revoke execute on function public.driver_add_unregistered_kid(uuid, text, text, text, text, int, text) from public;
grant execute on function public.driver_add_unregistered_kid(uuid, text, text, text, text, int, text) to authenticated;

-- 4. RPC: driver removes an unregistered kid (cascades to assignments + trip events).
create or replace function public.driver_delete_unregistered_kid(p_kid_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.kids
  where id = p_kid_id
    and added_by_driver_id = auth.uid()
    and parent_id is null;
  if not found then
    raise exception 'Criança não encontrada ou não pertence a você.' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.driver_delete_unregistered_kid(uuid) from public;
grant execute on function public.driver_delete_unregistered_kid(uuid) to authenticated;
