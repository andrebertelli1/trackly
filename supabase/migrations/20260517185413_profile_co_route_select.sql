-- Allow parents to read the driver's profile (and vice versa) when they share
-- a route. Without this, a parent on Tracking can't read the driver's name
-- even after the school assigns a driver — the screen falls back to
-- "Motorista a ser atribuído".

drop policy if exists "profile_select_co_route" on public.profiles;
create policy "profile_select_co_route" on public.profiles
  for select
  to authenticated
  using (
    -- Parent reading a driver they share a route with.
    exists (
      select 1
      from public.routes r
      join public.kid_route_assignments kra on kra.route_id = r.id
      join public.parent_kid_links pkl on pkl.kid_id = kra.kid_id
      where r.driver_id = profiles.id
        and pkl.parent_id = auth.uid()
    )
    or
    -- Driver reading a parent on their route.
    exists (
      select 1
      from public.routes r
      join public.kid_route_assignments kra on kra.route_id = r.id
      join public.parent_kid_links pkl on pkl.kid_id = kra.kid_id
      where r.driver_id = auth.uid()
        and pkl.parent_id = profiles.id
    )
  );
