-- Invert the data model: parents own their kid records; invite codes
-- identify a route (not a specific kid). Linking a kid to a route is a
-- separate step performed by the parent after redemption.
--
-- Destructive for kids/invite_codes/assignments: this is a dev iteration and
-- the test data is small. Truncate before altering structures.

-- 1. Drop policies that depend on the old schema or helpers.
drop policy if exists "pkl_select_own"        on public.parent_kid_links;
drop policy if exists "kids_select_member"    on public.kids;
drop policy if exists "routes_select_member"  on public.routes;
drop policy if exists "route_stops_select_member" on public.route_stops;
drop policy if exists "kra_select_member"     on public.kid_route_assignments;
drop policy if exists "profile_select_co_route" on public.profiles;

-- 2. Drop old helpers + RPCs.
drop function if exists public.is_parent_of_kid(uuid);
drop function if exists public.is_parent_on_route(uuid);
drop function if exists public.is_driver_of_kid(uuid);
drop function if exists public.drives_route(uuid);
drop function if exists public.redeem_invite_code(text);
drop function if exists public.validate_invite_code(text);
drop function if exists public.admin_create_kid(text, text, int, text);
drop function if exists public.admin_assign_kid_to_route(uuid, uuid, uuid);
drop function if exists public.admin_generate_invite_code(uuid, int, int);

-- 3. Drop parent_kid_links and clear dependent test data.
drop table if exists public.parent_kid_links cascade;
truncate table public.kid_route_assignments cascade;
truncate table public.invite_redemptions cascade;
truncate table public.invite_codes cascade;
truncate table public.kids cascade;

-- 4. Schema changes.
alter table public.invite_codes drop column if exists kid_id;
alter table public.invite_codes add column if not exists route_id uuid not null references public.routes(id) on delete cascade;

alter table public.kids add column if not exists parent_id uuid not null references auth.users(id) on delete cascade;

-- 5. Helper functions.
create or replace function public.is_parent_of_kid(p_kid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.kids
    where id = p_kid and parent_id = auth.uid()
  );
$$;

create or replace function public.drives_route(p_route uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.routes
    where id = p_route and driver_id = auth.uid()
  );
$$;

create or replace function public.is_parent_on_route(p_route uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.kid_route_assignments kra
    join public.kids k on k.id = kra.kid_id
    where kra.route_id = p_route and k.parent_id = auth.uid()
  );
$$;

create or replace function public.is_driver_of_kid(p_kid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from public.kid_route_assignments kra
    join public.routes r on r.id = kra.route_id
    where kra.kid_id = p_kid and r.driver_id = auth.uid()
  );
$$;

revoke execute on function public.is_parent_of_kid(uuid)    from public;
revoke execute on function public.drives_route(uuid)        from public;
revoke execute on function public.is_parent_on_route(uuid)  from public;
revoke execute on function public.is_driver_of_kid(uuid)    from public;
grant execute  on function public.is_parent_of_kid(uuid)    to authenticated;
grant execute  on function public.drives_route(uuid)        to authenticated;
grant execute  on function public.is_parent_on_route(uuid)  to authenticated;
grant execute  on function public.is_driver_of_kid(uuid)    to authenticated;

-- 6. RLS policies on kids: parent owns, driver can read kids on their route.
drop policy if exists "kids_select_own_or_driver" on public.kids;
drop policy if exists "kids_insert_own"           on public.kids;
drop policy if exists "kids_update_own"           on public.kids;
drop policy if exists "kids_delete_own"           on public.kids;

create policy "kids_select_own_or_driver" on public.kids
  for select to authenticated
  using (parent_id = auth.uid() or public.is_driver_of_kid(id));

create policy "kids_insert_own" on public.kids
  for insert to authenticated
  with check (parent_id = auth.uid());

create policy "kids_update_own" on public.kids
  for update to authenticated
  using (parent_id = auth.uid())
  with check (parent_id = auth.uid());

create policy "kids_delete_own" on public.kids
  for delete to authenticated
  using (parent_id = auth.uid());

-- 7. RLS on kid_route_assignments: parent can insert/select/delete for their kid; driver can select.
drop policy if exists "kra_select"        on public.kid_route_assignments;
drop policy if exists "kra_insert_parent" on public.kid_route_assignments;
drop policy if exists "kra_delete_parent" on public.kid_route_assignments;

create policy "kra_select" on public.kid_route_assignments
  for select to authenticated
  using (public.is_parent_of_kid(kid_id) or public.drives_route(route_id));

create policy "kra_insert_parent" on public.kid_route_assignments
  for insert to authenticated
  with check (public.is_parent_of_kid(kid_id));

create policy "kra_delete_parent" on public.kid_route_assignments
  for delete to authenticated
  using (public.is_parent_of_kid(kid_id));

-- 8. RLS on routes + route_stops.
create policy "routes_select_member" on public.routes
  for select to authenticated
  using (public.is_parent_on_route(id) or public.drives_route(id));

create policy "route_stops_select_member" on public.route_stops
  for select to authenticated
  using (public.is_parent_on_route(route_id) or public.drives_route(route_id));

-- 9. Co-route profile reads (so parents see the driver's name).
create policy "profile_select_co_route" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.routes r
      join public.kid_route_assignments kra on kra.route_id = r.id
      join public.kids k on k.id = kra.kid_id
      where r.driver_id = profiles.id and k.parent_id = auth.uid()
    )
    or
    exists (
      select 1
      from public.routes r
      join public.kid_route_assignments kra on kra.route_id = r.id
      join public.kids k on k.id = kra.kid_id
      where r.driver_id = auth.uid() and k.parent_id = profiles.id
    )
  );

-- 10. validate_invite_code — anon-callable, returns school + route + stops.
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
  v_school public.schools%rowtype;
  v_route public.routes%rowtype;
  v_stops jsonb;
begin
  select * into v_code from public.invite_codes where code = upper(p_code);
  if not found then raise exception 'Código inválido.' using errcode = 'P0001'; end if;
  if v_code.expires_at <= now() then raise exception 'Código expirado.' using errcode = 'P0002'; end if;

  select count(*) into v_used from public.invite_redemptions where code = v_code.code;
  if v_used >= v_code.max_redemptions then
    raise exception 'Código já foi resgatado o máximo de vezes.' using errcode = 'P0003';
  end if;

  select r.* into v_route from public.routes r where r.id = v_code.route_id;
  select s.* into v_school from public.schools s where s.id = v_route.school_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', rs.id,
      'stop_order', rs.stop_order,
      'address', rs.address,
      'scheduled_time', rs.scheduled_time,
      'label', rs.label
    ) order by rs.stop_order
  ), '[]'::jsonb)
  into v_stops
  from public.route_stops rs
  where rs.route_id = v_route.id;

  return jsonb_build_object(
    'school', to_jsonb(v_school),
    'route',  to_jsonb(v_route),
    'stops',  v_stops
  );
end;
$$;

revoke execute on function public.validate_invite_code(text) from public;
grant execute  on function public.validate_invite_code(text) to anon, authenticated;

-- 11. link_kid_to_route — authenticated parent links their own kid to a route via a valid code.
create or replace function public.link_kid_to_route(
  p_code text,
  p_kid_id uuid,
  p_stop_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code public.invite_codes%rowtype;
  v_used int;
begin
  if auth.uid() is null then
    raise exception 'Faça login antes de vincular.' using errcode = '28000';
  end if;

  -- Kid ownership.
  if not exists (
    select 1 from public.kids where id = p_kid_id and parent_id = auth.uid()
  ) then
    raise exception 'Criança não encontrada na sua conta.' using errcode = 'P0004';
  end if;

  -- Lock the code row for atomic redemption count.
  select * into v_code from public.invite_codes where code = upper(p_code) for update;
  if not found then raise exception 'Código inválido.' using errcode = 'P0001'; end if;
  if v_code.expires_at <= now() then raise exception 'Código expirado.' using errcode = 'P0002'; end if;

  -- If this parent already redeemed this code, don't count a new redemption.
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

  -- Validate stop belongs to the route (if provided).
  if p_stop_id is not null then
    if not exists (
      select 1 from public.route_stops where id = p_stop_id and route_id = v_code.route_id
    ) then
      raise exception 'Parada não pertence à rota do código.' using errcode = 'P0005';
    end if;
  end if;

  -- Link (idempotent — re-linking the same kid+route just updates the stop).
  insert into public.kid_route_assignments (kid_id, route_id, stop_id)
  values (p_kid_id, v_code.route_id, p_stop_id)
  on conflict (kid_id, route_id) do update set stop_id = excluded.stop_id;

  return jsonb_build_object(
    'kid_id', p_kid_id,
    'route_id', v_code.route_id,
    'stop_id', p_stop_id
  );
end;
$$;

revoke execute on function public.link_kid_to_route(text, uuid, uuid) from public;
grant execute  on function public.link_kid_to_route(text, uuid, uuid) to authenticated;

-- 12. admin_generate_invite_code now takes a route_id (not a kid_id).
create or replace function public.admin_generate_invite_code(
  p_route_id uuid,
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
      insert into public.invite_codes (code, route_id, created_by, expires_at, max_redemptions)
      values (v_code, p_route_id, auth.uid(), now() + (p_expires_in_days || ' days')::interval, p_max_redemptions);
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

revoke execute on function public.admin_generate_invite_code(uuid, int, int) from public;
revoke execute on function public.admin_generate_invite_code(uuid, int, int) from authenticated;
