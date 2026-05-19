-- Rename user-facing "criança" → "estudante" in SQL error messages that surface
-- raw to the UI (the InviteError mapper-based ones are fine; their friendly
-- strings live in src/lib/invite.ts).

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
    raise exception 'Nome do estudante não pode estar vazio.' using errcode = '22023';
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

  insert into public.kid_route_assignments (kid_id, route_id)
  select v_kid_id, r.id from public.routes r where r.van_id = p_van_id
  on conflict (kid_id, route_id) do nothing;

  return v_kid_id;
end;
$$;

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
    raise exception 'Estudante não encontrado ou não pertence a você.' using errcode = 'P0001';
  end if;
end;
$$;
