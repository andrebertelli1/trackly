-- Allow drivers to edit their own van's label + color.
-- Route times keep using driver_add_route_to_van (idempotent on van+direction).

create or replace function public.driver_update_van(
  p_van_id uuid,
  p_van_label text default null,
  p_van_color text default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.drives_van(p_van_id) then
    raise exception 'Você não é o motorista desta van.' using errcode = '42501';
  end if;

  update public.vans
  set
    van_label = coalesce(nullif(trim(p_van_label), ''), van_label),
    van_color = coalesce(nullif(trim(p_van_color), ''), van_color)
  where id = p_van_id;
end;
$$;

revoke execute on function public.driver_update_van(uuid, text, text) from public;
grant execute on function public.driver_update_van(uuid, text, text) to authenticated;
