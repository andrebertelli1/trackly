-- Driver-side RPCs: create schools (free-text), create routes, generate codes.
-- Also: signup trigger now respects raw_user_meta_data.requested_role so the
-- Register screen can mark a new account as a driver via a toggle.

-- 1. signup trigger: honor requested_role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := 'parent';
begin
  if nullif(new.raw_user_meta_data->>'requested_role', '') = 'driver' then
    v_role := 'driver';
  end if;
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. is_driver() helper.
create or replace function public.is_driver()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'driver'
  );
$$;

revoke execute on function public.is_driver() from public;
grant execute on function public.is_driver() to authenticated;

-- 3. driver_upsert_school: case-insensitive lookup, creates if not found.
create or replace function public.driver_upsert_school(
  p_name text,
  p_city text default null
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_name text := trim(p_name);
begin
  if not public.is_driver() then
    raise exception 'Apenas motoristas podem cadastrar escolas.' using errcode = '42501';
  end if;
  if v_name = '' or v_name is null then
    raise exception 'Nome da escola não pode estar vazio.' using errcode = '22023';
  end if;

  select id into v_id
  from public.schools
  where lower(name) = lower(v_name)
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.schools (name, city)
  values (v_name, nullif(trim(p_city), ''))
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.driver_upsert_school(text, text) from public;
grant execute on function public.driver_upsert_school(text, text) to authenticated;

-- 4. driver_create_route: caller must be a driver; sets driver_id = auth.uid().
create or replace function public.driver_create_route(
  p_school_id uuid,
  p_van_label text,
  p_period public.route_period,
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
    school_id, driver_id, van_label, van_color, period, pickup_start, arrival_time
  ) values (
    p_school_id, auth.uid(), trim(p_van_label),
    nullif(trim(coalesce(p_van_color, '')), ''),
    p_period, p_pickup_start, p_arrival_time
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.driver_create_route(uuid, text, public.route_period, text, time, time) from public;
grant execute on function public.driver_create_route(uuid, text, public.route_period, text, time, time) to authenticated;

-- 5. driver_generate_invite_code: caller must own (drive) the route.
create or replace function public.driver_generate_invite_code(
  p_route_id uuid,
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
  if not exists (
    select 1 from public.routes
    where id = p_route_id and driver_id = auth.uid()
  ) then
    raise exception 'Você não é o motorista desta rota.' using errcode = '42501';
  end if;

  loop
    v_code := '';
    for v_i in 1..6 loop
      v_code := v_code || substr(v_chars, 1 + (floor(random() * length(v_chars))::int), 1);
    end loop;
    begin
      insert into public.invite_codes (code, route_id, created_by, expires_at, max_redemptions)
      values (v_code, p_route_id, auth.uid(),
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

-- 6. driver_revoke_invite_code: deactivates a code (sets expires_at = now()).
create or replace function public.driver_revoke_invite_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.invite_codes
  set expires_at = now()
  where code = upper(p_code)
    and exists (
      select 1 from public.routes
      where id = invite_codes.route_id and driver_id = auth.uid()
    );
  if not found then
    raise exception 'Código não encontrado ou não pertence a você.' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.driver_revoke_invite_code(text) from public;
grant execute on function public.driver_revoke_invite_code(text) to authenticated;

-- 7. RLS: drivers can SELECT their own invite codes (so MyRoutesScreen can list them).
drop policy if exists "invite_codes_select_driver" on public.invite_codes;
create policy "invite_codes_select_driver" on public.invite_codes
  for select to authenticated
  using (
    exists (
      select 1 from public.routes r
      where r.id = invite_codes.route_id and r.driver_id = auth.uid()
    )
  );

-- And drivers can see redemption counts on their codes.
drop policy if exists "invite_redemptions_select_driver" on public.invite_redemptions;
create policy "invite_redemptions_select_driver" on public.invite_redemptions
  for select to authenticated
  using (
    exists (
      select 1 from public.invite_codes ic
      join public.routes r on r.id = ic.route_id
      where ic.code = invite_redemptions.code and r.driver_id = auth.uid()
    )
  );
