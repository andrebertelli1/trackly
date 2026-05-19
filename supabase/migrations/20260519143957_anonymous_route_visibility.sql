-- Let parents on a route see (anonymously) other kids' assignments and trip
-- events. They get kid_ids back, but the kids table's RLS still hides each
-- row's PII unless the kid is their own. This gives the parent timing context
-- ("you're the 3rd of 5 stops") without leaking other families' data.

drop policy if exists "kra_select" on public.kid_route_assignments;
create policy "kra_select" on public.kid_route_assignments
  for select to authenticated
  using (
    public.is_parent_of_kid(kid_id)
    or public.drives_route(route_id)
    or public.is_parent_on_route(route_id)
  );

drop policy if exists "tke_select_member" on public.trip_kid_events;
create policy "tke_select_member" on public.trip_kid_events
  for select to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_kid_events.trip_id and public.drives_route(t.route_id)
    )
    or exists (
      select 1 from public.kids k
      where k.id = trip_kid_events.kid_id and k.parent_id = auth.uid()
    )
    or exists (
      select 1 from public.trips t
      where t.id = trip_kid_events.trip_id and public.is_parent_on_route(t.route_id)
    )
  );
