-- Trackly · schools, routes, kids, invite codes
-- Idempotent: safe to re-run.

-- ─────────────────────────────────────────────
-- 1. Enums + tables
-- ─────────────────────────────────────────────

do $$ begin
  create type public.route_period as enum ('morning', 'afternoon');
exception when duplicate_object then null;
end $$;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  driver_id uuid references auth.users(id) on delete set null,
  van_label text not null,
  van_color text,
  period public.route_period not null,
  pickup_start time,
  arrival_time time,
  created_at timestamptz not null default now()
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  stop_order int not null,
  address text not null,
  scheduled_time time,
  label text,
  created_at timestamptz not null default now(),
  unique (route_id, stop_order)
);

create table if not exists public.kids (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  short_name text,
  grade int,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.kid_route_assignments (
  kid_id uuid not null references public.kids(id) on delete cascade,
  route_id uuid not null references public.routes(id) on delete cascade,
  stop_id uuid references public.route_stops(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (kid_id, route_id)
);

create table if not exists public.parent_kid_links (
  parent_id uuid not null references auth.users(id) on delete cascade,
  kid_id uuid not null references public.kids(id) on delete cascade,
  relationship text not null default 'guardian',
  created_at timestamptz not null default now(),
  primary key (parent_id, kid_id)
);

create table if not exists public.invite_codes (
  code text primary key,
  kid_id uuid not null references public.kids(id) on delete cascade,
  created_by uuid references auth.users(id),
  expires_at timestamptz not null,
  max_redemptions int not null default 2,
  created_at timestamptz not null default now()
);

create table if not exists public.invite_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.invite_codes(code) on delete cascade,
  parent_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. RLS helper functions (security definer, stable)
-- ─────────────────────────────────────────────

create or replace function public.is_parent_of_kid(p_kid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.parent_kid_links
    where parent_id = auth.uid() and kid_id = p_kid
  );
$$;

create or replace function public.drives_route(p_route uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.routes
    where id = p_route and driver_id = auth.uid()
  );
$$;

create or replace function public.is_parent_on_route(p_route uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.kid_route_assignments kra
    join public.parent_kid_links pkl on pkl.kid_id = kra.kid_id
    where kra.route_id = p_route and pkl.parent_id = auth.uid()
  );
$$;

create or replace function public.is_driver_of_kid(p_kid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.kid_route_assignments kra
    join public.routes r on r.id = kra.route_id
    where kra.kid_id = p_kid and r.driver_id = auth.uid()
  );
$$;

revoke execute on function public.is_parent_of_kid(uuid) from public;
revoke execute on function public.drives_route(uuid) from public;
revoke execute on function public.is_parent_on_route(uuid) from public;
revoke execute on function public.is_driver_of_kid(uuid) from public;
grant execute on function public.is_parent_of_kid(uuid) to authenticated;
grant execute on function public.drives_route(uuid) to authenticated;
grant execute on function public.is_parent_on_route(uuid) to authenticated;
grant execute on function public.is_driver_of_kid(uuid) to authenticated;

-- ─────────────────────────────────────────────
-- 3. RLS policies (SELECT only; writes go through RPCs)
-- ─────────────────────────────────────────────

alter table public.schools                enable row level security;
alter table public.routes                 enable row level security;
alter table public.route_stops            enable row level security;
alter table public.kids                   enable row level security;
alter table public.kid_route_assignments  enable row level security;
alter table public.parent_kid_links       enable row level security;
alter table public.invite_codes           enable row level security;
alter table public.invite_redemptions     enable row level security;

drop policy if exists "schools_select_all" on public.schools;
create policy "schools_select_all" on public.schools
  for select to authenticated using (true);

drop policy if exists "routes_select_member" on public.routes;
create policy "routes_select_member" on public.routes
  for select to authenticated
  using (public.is_parent_on_route(id) or public.drives_route(id));

drop policy if exists "route_stops_select_member" on public.route_stops;
create policy "route_stops_select_member" on public.route_stops
  for select to authenticated
  using (public.is_parent_on_route(route_id) or public.drives_route(route_id));

drop policy if exists "kids_select_member" on public.kids;
create policy "kids_select_member" on public.kids
  for select to authenticated
  using (public.is_parent_of_kid(id) or public.is_driver_of_kid(id));

drop policy if exists "kra_select_member" on public.kid_route_assignments;
create policy "kra_select_member" on public.kid_route_assignments
  for select to authenticated
  using (public.is_parent_on_route(route_id) or public.drives_route(route_id));

drop policy if exists "pkl_select_own" on public.parent_kid_links;
create policy "pkl_select_own" on public.parent_kid_links
  for select to authenticated
  using (parent_id = auth.uid());

-- invite_codes and invite_redemptions: no client access (RLS enabled, no policies → all denied).

-- ─────────────────────────────────────────────
-- 4. Redemption RPC (parent-callable)
-- ─────────────────────────────────────────────

create or replace function public.redeem_invite_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code public.invite_codes%rowtype;
  v_used int;
  v_school public.schools%rowtype;
  v_route public.routes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Faça login antes de redimir um código.' using errcode = '28000';
  end if;

  -- Lock the code row to make the redemption count atomic.
  select * into v_code
    from public.invite_codes
    where code = upper(p_code)
    for update;
  if not found then
    raise exception 'Código inválido.' using errcode = 'P0001';
  end if;
  if v_code.expires_at <= now() then
    raise exception 'Código expirado.' using errcode = 'P0002';
  end if;

  select count(*) into v_used
    from public.invite_redemptions
    where code = v_code.code;

  -- If the caller has already redeemed this code, it's a no-op success.
  if exists (
    select 1 from public.invite_redemptions
    where code = v_code.code and parent_id = auth.uid()
  ) then
    -- fall through and return current info without re-incrementing.
    null;
  else
    if v_used >= v_code.max_redemptions then
      raise exception 'Código já foi resgatado o máximo de vezes.' using errcode = 'P0003';
    end if;

    insert into public.parent_kid_links (parent_id, kid_id)
      values (auth.uid(), v_code.kid_id)
      on conflict (parent_id, kid_id) do nothing;

    insert into public.invite_redemptions (code, parent_id)
      values (v_code.code, auth.uid());
  end if;

  -- Pull the kid's current school + route (first assignment found).
  select s.* into v_school
    from public.kid_route_assignments kra
    join public.routes r on r.id = kra.route_id
    join public.schools s on s.id = r.school_id
    where kra.kid_id = v_code.kid_id
    limit 1;

  select r.* into v_route
    from public.kid_route_assignments kra
    join public.routes r on r.id = kra.route_id
    where kra.kid_id = v_code.kid_id
    limit 1;

  return jsonb_build_object(
    'kid_id',  v_code.kid_id,
    'school',  case when v_school.id is not null then to_jsonb(v_school) else null end,
    'route',   case when v_route.id is not null  then to_jsonb(v_route)  else null end
  );
end;
$$;

revoke execute on function public.redeem_invite_code(text) from public;
grant execute on function public.redeem_invite_code(text) to authenticated;

-- ─────────────────────────────────────────────
-- 5. Admin RPCs (service-role only)
-- ─────────────────────────────────────────────

create or replace function public.admin_create_school(p_name text, p_city text default null)
returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.schools (name, city) values (p_name, p_city) returning id;
$$;

create or replace function public.admin_create_route(
  p_school_id uuid,
  p_van_label text,
  p_period public.route_period,
  p_driver_id uuid default null,
  p_van_color text default null,
  p_pickup_start time default null,
  p_arrival_time time default null
) returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.routes (school_id, driver_id, van_label, van_color, period, pickup_start, arrival_time)
  values (p_school_id, p_driver_id, p_van_label, p_van_color, p_period, p_pickup_start, p_arrival_time)
  returning id;
$$;

create or replace function public.admin_add_route_stop(
  p_route_id uuid,
  p_stop_order int,
  p_address text,
  p_scheduled_time time default null,
  p_label text default null
) returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.route_stops (route_id, stop_order, address, scheduled_time, label)
  values (p_route_id, p_stop_order, p_address, p_scheduled_time, p_label)
  returning id;
$$;

create or replace function public.admin_create_kid(
  p_full_name text,
  p_short_name text default null,
  p_grade int default null,
  p_color text default null
) returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.kids (full_name, short_name, grade, color)
  values (p_full_name, p_short_name, p_grade, p_color)
  returning id;
$$;

create or replace function public.admin_assign_kid_to_route(
  p_kid_id uuid,
  p_route_id uuid,
  p_stop_id uuid default null
) returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.kid_route_assignments (kid_id, route_id, stop_id)
  values (p_kid_id, p_route_id, p_stop_id)
  on conflict (kid_id, route_id) do update set stop_id = excluded.stop_id;
$$;

create or replace function public.admin_generate_invite_code(
  p_kid_id uuid,
  p_expires_in_days int default 14,
  p_max_redemptions int default 2
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- avoid I, O, 0, 1
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
      insert into public.invite_codes (code, kid_id, created_by, expires_at, max_redemptions)
      values (v_code, p_kid_id, auth.uid(), now() + (p_expires_in_days || ' days')::interval, p_max_redemptions);
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

revoke execute on function public.admin_create_school(text, text) from public;
revoke execute on function public.admin_create_school(text, text) from authenticated;
revoke execute on function public.admin_create_route(uuid, text, public.route_period, uuid, text, time, time) from public;
revoke execute on function public.admin_create_route(uuid, text, public.route_period, uuid, text, time, time) from authenticated;
revoke execute on function public.admin_add_route_stop(uuid, int, text, time, text) from public;
revoke execute on function public.admin_add_route_stop(uuid, int, text, time, text) from authenticated;
revoke execute on function public.admin_create_kid(text, text, int, text) from public;
revoke execute on function public.admin_create_kid(text, text, int, text) from authenticated;
revoke execute on function public.admin_assign_kid_to_route(uuid, uuid, uuid) from public;
revoke execute on function public.admin_assign_kid_to_route(uuid, uuid, uuid) from authenticated;
revoke execute on function public.admin_generate_invite_code(uuid, int, int) from public;
revoke execute on function public.admin_generate_invite_code(uuid, int, int) from authenticated;
