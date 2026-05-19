-- Trackly seed data — run once in Supabase SQL editor after the migrations.
-- Creates Colégio Greenfield + a van + a pickup route + an invite code.
-- Set a driver_id below if you want to associate the van with a specific driver.

do $$
declare
  v_school uuid;
  v_van    uuid;
  v_route_pickup uuid;
  v_invite_code text;
  -- Set this to a driver's auth.users.id if you have one already;
  -- otherwise leave null and a real driver can claim ownership later.
  v_driver_id uuid := null;
begin
  v_school := public.admin_create_school('Colégio Greenfield', 'São Paulo');

  -- admin_create_van requires a driver_id; only seed the van when one is set.
  if v_driver_id is not null then
    v_van := public.admin_create_van(v_school, v_driver_id, 'VK-32', '#5B7A9F');
    v_route_pickup := public.admin_add_route_to_van(v_van, 'pickup', '07:54', '08:42');
    v_invite_code := public.admin_generate_invite_code(v_van, 30, 20);
    raise notice 'Invite code for VK-32: %', v_invite_code;
  else
    raise notice 'School % created. Set v_driver_id in seed.sql to also create a van + invite code.', v_school;
  end if;
end $$;
