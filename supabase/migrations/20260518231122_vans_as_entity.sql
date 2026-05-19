-- Elevate "van" to a first-class entity. A van belongs to a driver + school
-- and has 1..N routes (typically pickup + dropoff). Invite codes now point to
-- the van, and redeeming a code links the kid to ALL the van's routes.

-- 1. Drop policies that reference the old shape (routes.driver_id, invite_codes.route_id).
drop policy if exists "invite_codes_select_driver"      on public.invite_codes;
drop policy if exists "invite_redemptions_select_driver" on public.invite_redemptions;
drop policy if exists "profile_select_co_route"          on public.profiles;

-- 2. Drop RPCs that reference old column/types.
drop function if exists public.validate_invite_code(text);
drop function if exists public.link_kid_to_route(text, uuid);
drop function if exists public.driver_create_route(uuid, text, public.route_direction, text, time, time);
drop function if exists public.admin_create_route(uuid, text, public.route_direction, uuid, text, time, time);
drop function if exists public.driver_generate_invite_code(uuid, int, int);
drop function if exists public.admin_generate_invite_code(uuid, int, int);

-- 3. Create vans table.
create table if not exists public.vans (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  van_label text not null,
  van_color text,
  created_at timestamptz not null default now(),
  unique (driver_id, school_id, van_label)
);

alter table public.vans enable row level security;

-- 4. Backfill vans from existing routes (one van per unique tuple).
insert into public.vans (driver_id, school_id, van_label, van_color)
select distinct r.driver_id, r.school_id, r.van_label, max(r.van_color)
from public.routes r
where r.driver_id is not null
group by r.driver_id, r.school_id, r.van_label
on conflict (driver_id, school_id, van_label) do nothing;

-- 5. Migrate routes: add van_id, backfill, drop the redundant columns.
alter table public.routes add column if not exists van_id uuid references public.vans(id) on delete cascade;

update public.routes r
set van_id = v.id
from public.vans v
where v.driver_id = r.driver_id
  and v.school_id = r.school_id
  and v.van_label = r.van_label
  and r.van_id is null;

-- Drop rows orphaned (routes with no driver_id can't be matched to a van).
delete from public.routes where van_id is null;

alter table public.routes alter column van_id set not null;

alter table public.routes drop column if exists driver_id;
alter table public.routes drop column if exists school_id;
alter table public.routes drop column if exists van_label;
alter table public.routes drop column if exists van_color;

-- One pickup + one dropoff per van.
alter table public.routes
  add constraint routes_van_direction_unique unique (van_id, direction);

-- 6. Migrate invite_codes: add van_id, backfill, drop route_id.
alter table public.invite_codes add column if not exists van_id uuid references public.vans(id) on delete cascade;

update public.invite_codes ic
set van_id = (select r.van_id from public.routes r where r.id = ic.route_id)
where ic.van_id is null and ic.route_id is not null;

-- Drop codes that couldn't be migrated (their route had no van, edge case).
delete from public.invite_codes where van_id is null;

alter table public.invite_codes alter column van_id set not null;
alter table public.invite_codes drop column if exists route_id;

-- 7. Update helper functions to traverse via vans.
create or replace function public.drives_route(p_route uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from public.routes r
    join public.vans v on v.id = r.van_id
    where r.id = p_route and v.driver_id = auth.uid()
  );
$$;

create or replace function public.is_driver_of_kid(p_kid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1
    from public.kid_route_assignments kra
    join public.routes r on r.id = kra.route_id
    join public.vans v on v.id = r.van_id
    where kra.kid_id = p_kid and v.driver_id = auth.uid()
  );
$$;

create or replace function public.drives_van(p_van uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.vans where id = p_van and driver_id = auth.uid()
  );
$$;

revoke execute on function public.drives_van(uuid) from public;
grant execute on function public.drives_van(uuid) to authenticated;

-- 8. RLS policies.

-- vans: driver of the van OR parent who has a kid on any route of this van.
drop policy if exists "vans_select_member" on public.vans;
create policy "vans_select_member" on public.vans
  for select to authenticated
  using (
    public.drives_van(id)
    or exists (
      select 1
      from public.routes r
      join public.kid_route_assignments kra on kra.route_id = r.id
      join public.kids k on k.id = kra.kid_id
      where r.van_id = vans.id and k.parent_id = auth.uid()
    )
  );

-- invite_codes: driver of the van can SELECT.
create policy "invite_codes_select_driver" on public.invite_codes
  for select to authenticated
  using (public.drives_van(van_id));

-- invite_redemptions: driver of the code's van can SELECT.
create policy "invite_redemptions_select_driver" on public.invite_redemptions
  for select to authenticated
  using (
    exists (
      select 1 from public.invite_codes ic
      where ic.code = invite_redemptions.code
        and public.drives_van(ic.van_id)
    )
  );

-- profiles: parent reads driver / driver reads parents — joined via vans now.
create policy "profile_select_co_route" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.vans v
      join public.routes r on r.van_id = v.id
      join public.kid_route_assignments kra on kra.route_id = r.id
      join public.kids k on k.id = kra.kid_id
      where v.driver_id = profiles.id and k.parent_id = auth.uid()
    )
    or
    exists (
      select 1
      from public.vans v
      join public.routes r on r.van_id = v.id
      join public.kid_route_assignments kra on kra.route_id = r.id
      join public.kids k on k.id = kra.kid_id
      where v.driver_id = auth.uid() and k.parent_id = profiles.id
    )
  );

-- 9. New RPCs.

-- driver_upsert_van: find by (driver, school, label) case-insensitive; create otherwise.
create or replace function public.driver_upsert_van(
  p_school_id uuid,
  p_van_label text,
  p_van_color text default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_label text := trim(p_van_label);
  v_color text := nullif(trim(coalesce(p_van_color, '')), '');
begin
  if not public.is_driver() then
    raise exception 'Apenas motoristas podem cadastrar vans.' using errcode = '42501';
  end if;
  if v_label = '' or v_label is null then
    raise exception 'Informe a placa/etiqueta da van.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.schools where id = p_school_id) then
    raise exception 'Escola não encontrada.' using errcode = 'P0006';
  end if;

  select id into v_id
  from public.vans
  where driver_id = auth.uid()
    and school_id = p_school_id
    and lower(van_label) = lower(v_label)
  limit 1;

  if v_id is not null then
    if v_color is not null then
      update public.vans set van_color = v_color where id = v_id;
    end if;
    return v_id;
  end if;

  insert into public.vans (driver_id, school_id, van_label, van_color)
  values (auth.uid(), p_school_id, v_label, v_color)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.driver_upsert_van(uuid, text, text) from public;
grant execute on function public.driver_upsert_van(uuid, text, text) to authenticated;

-- driver_add_route_to_van: idempotent on (van_id, direction). Auto-links kids
-- already on the van's other routes so existing parents don't need to redeem
-- a new code when a direction is added later.
create or replace function public.driver_add_route_to_van(
  p_van_id uuid,
  p_direction public.route_direction,
  p_pickup_start time default null,
  p_arrival_time time default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_route_id uuid;
begin
  if not public.drives_van(p_van_id) then
    raise exception 'Você não é o motorista desta van.' using errcode = '42501';
  end if;

  insert into public.routes (van_id, direction, pickup_start, arrival_time)
  values (p_van_id, p_direction, p_pickup_start, p_arrival_time)
  on conflict (van_id, direction) do update set
    pickup_start = excluded.pickup_start,
    arrival_time = excluded.arrival_time
  returning id into v_route_id;

  -- Auto-attach kids already on other routes of this van.
  insert into public.kid_route_assignments (kid_id, route_id)
  select distinct kra.kid_id, v_route_id
  from public.kid_route_assignments kra
  join public.routes r on r.id = kra.route_id
  where r.van_id = p_van_id and r.id <> v_route_id
  on conflict (kid_id, route_id) do nothing;

  return v_route_id;
end;
$$;

revoke execute on function public.driver_add_route_to_van(uuid, public.route_direction, time, time) from public;
grant execute on function public.driver_add_route_to_van(uuid, public.route_direction, time, time) to authenticated;

-- driver_generate_invite_code: now takes van_id.
create or replace function public.driver_generate_invite_code(
  p_van_id uuid,
  p_expires_in_days int default 30,
  p_max_redemptions int default 20
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_i int;
  v_attempt int := 0;
begin
  if not public.drives_van(p_van_id) then
    raise exception 'Você não é o motorista desta van.' using errcode = '42501';
  end if;

  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + (floor(random() * length(v_chars))::int), 1);
    end loop;
    begin
      insert into public.invite_codes (code, van_id, created_by, expires_at, max_redemptions)
      values (v_code, p_van_id, auth.uid(),
              now() + (p_expires_in_days || ' days')::interval,
              p_max_redemptions);
      return v_code;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt >= 10 then
        raise exception 'Não foi possível gerar um código único após 10 tentativas.';
      end if;
    end;
  end loop;
end;
$$;

revoke execute on function public.driver_generate_invite_code(uuid, int, int) from public;
grant execute on function public.driver_generate_invite_code(uuid, int, int) to authenticated;

-- validate_invite_code: returns school + van + routes array.
create or replace function public.validate_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  v_code public.invite_codes%rowtype;
  v_used int;
  v_van public.vans%rowtype;
  v_school public.schools%rowtype;
  v_routes jsonb;
begin
  select * into v_code from public.invite_codes where code = upper(p_code);
  if not found then raise exception 'Código inválido.' using errcode = 'P0001'; end if;
  if v_code.expires_at <= now() then raise exception 'Código expirado.' using errcode = 'P0002'; end if;

  select count(*) into v_used from public.invite_redemptions where code = v_code.code;
  if v_used >= v_code.max_redemptions then
    raise exception 'Código já foi resgatado o máximo de vezes.' using errcode = 'P0003';
  end if;

  select v.* into v_van from public.vans v where v.id = v_code.van_id;
  select s.* into v_school from public.schools s where s.id = v_van.school_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', r.id,
      'direction', r.direction,
      'pickup_start', r.pickup_start,
      'arrival_time', r.arrival_time
    ) order by case r.direction when 'pickup' then 0 else 1 end
  ), '[]'::jsonb)
  into v_routes
  from public.routes r
  where r.van_id = v_van.id;

  return jsonb_build_object(
    'school', to_jsonb(v_school),
    'van', jsonb_build_object(
      'id', v_van.id,
      'label', v_van.van_label,
      'color', v_van.van_color
    ),
    'routes', v_routes
  );
end;
$$;

revoke execute on function public.validate_invite_code(text) from public;
grant execute on function public.validate_invite_code(text) to anon, authenticated;

-- link_kid_to_van: validates, consumes a redemption once (per parent per code),
-- and inserts kid_route_assignments for every route of the van.
create or replace function public.link_kid_to_van(
  p_code text,
  p_kid_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code public.invite_codes%rowtype;
  v_used int;
  v_van_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Faça login antes de vincular.' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.kids where id = p_kid_id and parent_id = auth.uid()
  ) then
    raise exception 'Criança não encontrada na sua conta.' using errcode = 'P0004';
  end if;

  select * into v_code from public.invite_codes where code = upper(p_code) for update;
  if not found then raise exception 'Código inválido.' using errcode = 'P0001'; end if;
  if v_code.expires_at <= now() then raise exception 'Código expirado.' using errcode = 'P0002'; end if;

  if not exists (
    select 1 from public.invite_redemptions
    where code = v_code.code and parent_id = auth.uid()
  ) then
    select count(*) into v_used
    from public.invite_redemptions
    where code = v_code.code;
    if v_used >= v_code.max_redemptions then
      raise exception 'Código já foi resgatado o máximo de vezes.' using errcode = 'P0003';
    end if;
    insert into public.invite_redemptions (code, parent_id)
    values (v_code.code, auth.uid());
  end if;

  v_van_id := v_code.van_id;

  -- Link the kid to every route of the van.
  insert into public.kid_route_assignments (kid_id, route_id)
  select p_kid_id, r.id
  from public.routes r
  where r.van_id = v_van_id
  on conflict (kid_id, route_id) do nothing;

  return jsonb_build_object(
    'kid_id', p_kid_id,
    'van_id', v_van_id
  );
end;
$$;

revoke execute on function public.link_kid_to_van(text, uuid) from public;
grant execute on function public.link_kid_to_van(text, uuid) to authenticated;

-- Admin RPCs (service-role only).
create or replace function public.admin_create_van(
  p_school_id uuid,
  p_driver_id uuid,
  p_van_label text,
  p_van_color text default null
) returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.vans (driver_id, school_id, van_label, van_color)
  values (p_driver_id, p_school_id, p_van_label, p_van_color)
  on conflict (driver_id, school_id, van_label) do update set van_color = excluded.van_color
  returning id;
$$;

create or replace function public.admin_add_route_to_van(
  p_van_id uuid,
  p_direction public.route_direction,
  p_pickup_start time default null,
  p_arrival_time time default null
) returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.routes (van_id, direction, pickup_start, arrival_time)
  values (p_van_id, p_direction, p_pickup_start, p_arrival_time)
  on conflict (van_id, direction) do update set
    pickup_start = excluded.pickup_start,
    arrival_time = excluded.arrival_time
  returning id;
$$;

create or replace function public.admin_generate_invite_code(
  p_van_id uuid,
  p_expires_in_days int default 14,
  p_max_redemptions int default 2
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_i int;
  v_attempt int := 0;
begin
  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + (floor(random() * length(v_chars))::int), 1);
    end loop;
    begin
      insert into public.invite_codes (code, van_id, created_by, expires_at, max_redemptions)
      values (v_code, p_van_id, auth.uid(),
              now() + (p_expires_in_days || ' days')::interval,
              p_max_redemptions);
      return v_code;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt >= 10 then
        raise exception 'Não foi possível gerar um código único após 10 tentativas.';
      end if;
    end;
  end loop;
end;
$$;

revoke execute on function public.admin_create_van(uuid, uuid, text, text) from public;
revoke execute on function public.admin_create_van(uuid, uuid, text, text) from authenticated;
revoke execute on function public.admin_add_route_to_van(uuid, public.route_direction, time, time) from public;
revoke execute on function public.admin_add_route_to_van(uuid, public.route_direction, time, time) from authenticated;
revoke execute on function public.admin_generate_invite_code(uuid, int, int) from public;
revoke execute on function public.admin_generate_invite_code(uuid, int, int) from authenticated;
