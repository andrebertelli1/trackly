-- Anonymous validation of an invite code (pre-signup flow).
-- Returns school + route info if the code exists, isn't expired, and has
-- redemptions remaining. Raises the same SQLSTATE codes as redeem_invite_code
-- so the client can reuse error mapping.

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
  select * into v_code
    from public.invite_codes
    where code = upper(p_code);
  if not found then
    raise exception 'Código inválido.' using errcode = 'P0001';
  end if;
  if v_code.expires_at <= now() then
    raise exception 'Código expirado.' using errcode = 'P0002';
  end if;

  select count(*) into v_used
    from public.invite_redemptions
    where code = v_code.code;
  if v_used >= v_code.max_redemptions then
    raise exception 'Código já foi resgatado o máximo de vezes.' using errcode = 'P0003';
  end if;

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
    'kid_id', v_code.kid_id,
    'school', case when v_school.id is not null then to_jsonb(v_school) else null end,
    'route',  case when v_route.id is not null  then to_jsonb(v_route)  else null end
  );
end;
$$;

revoke execute on function public.validate_invite_code(text) from public;
grant execute on function public.validate_invite_code(text) to anon, authenticated;
