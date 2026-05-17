-- Drop the predefined route_stops model in favor of per-kid addresses.
-- Parents now provide pickup_address (and optional dropoff_address) when
-- creating a kid; linking a kid to a route no longer asks for a stop.

-- 1. Drop policies that reference route_stops.
drop policy if exists "route_stops_select_member" on public.route_stops;

-- 2. Drop dependent RPCs.
drop function if exists public.admin_add_route_stop(uuid, int, text, time, text);
drop function if exists public.link_kid_to_route(text, uuid, uuid);
drop function if exists public.validate_invite_code(text);

-- 3. Clear assignment rows (test data) before altering the column.
truncate table public.kid_route_assignments cascade;

-- 4. Schema changes.
alter table public.kid_route_assignments
  drop column if exists stop_id,
  add column if not exists stop_order int;

drop table if exists public.route_stops cascade;

alter table public.kids
  add column if not exists pickup_address text,
  add column if not exists dropoff_address text;

-- 5. validate_invite_code — no stops in payload.
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

  return jsonb_build_object(
    'school', to_jsonb(v_school),
    'route',  to_jsonb(v_route)
  );
end;
$$;

revoke execute on function public.validate_invite_code(text) from public;
grant execute  on function public.validate_invite_code(text) to anon, authenticated;

-- 6. link_kid_to_route — no stop_id parameter.
create or replace function public.link_kid_to_route(
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

  insert into public.kid_route_assignments (kid_id, route_id)
  values (p_kid_id, v_code.route_id)
  on conflict (kid_id, route_id) do nothing;

  return jsonb_build_object(
    'kid_id', p_kid_id,
    'route_id', v_code.route_id
  );
end;
$$;

revoke execute on function public.link_kid_to_route(text, uuid) from public;
grant execute  on function public.link_kid_to_route(text, uuid) to authenticated;
