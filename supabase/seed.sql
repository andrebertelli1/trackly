-- Trackly seed data — run once in Supabase SQL editor after the migrations.
-- Creates Colégio Greenfield + a morning route + an invite code.
-- Kids and pickup addresses are created by parents from the app.

do $$
declare
  v_school uuid;
  v_route  uuid;
  v_invite_code text;
begin
  v_school := public.admin_create_school('Colégio Greenfield', 'São Paulo');

  v_route := public.admin_create_route(
    p_school_id    => v_school,
    p_van_label    => 'VK-32',
    p_period       => 'morning',
    p_driver_id    => null,
    p_van_color    => '#5B7A9F',
    p_pickup_start => '07:54',
    p_arrival_time => '08:42'
  );

  v_invite_code := public.admin_generate_invite_code(v_route, 30, 20);
  raise notice 'Invite code for VK-32 morning route: %', v_invite_code;
end $$;

-- After running, fetch the code with:
--   select code, route_id, expires_at from public.invite_codes order by created_at desc limit 5;
