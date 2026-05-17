@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — Expo dev server (also `npm run ios` / `android` / `web`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` / `npm run lint:fix` — ESLint (flat config, `eslint-config-expo`)
- `npm run format` / `format:check` — Prettier (with `prettier-plugin-tailwindcss`)
- `supabase db push` — apply pending migrations to the linked remote project
- `supabase migration list` — see which migrations have been applied locally vs remote

No test runner is configured.

## Stack

Expo SDK 54 / React Native 0.81 / React 19 / TypeScript. Styling via **NativeWind v4** (Tailwind classes on RN components) — `global.css` is imported at the top of `App.tsx` to register the preflight. Reanimated v4 is installed; the Babel plugin is configured in `babel.config.js`.

Backend: **Supabase** (`src/lib/supabase.ts`) with **TanStack Query + AsyncStorage persistence** for cached reads (`src/lib/queryClient.ts`). Auth (`src/lib/auth.tsx`) supports email/password + Google OAuth (via `expo-web-browser` + `expo-linking`) + password reset deep link.

Expo 54 has breaking changes from earlier versions — consult https://docs.expo.dev/versions/v54.0.0/ before adding APIs (per `AGENTS.md`).

## Architecture

`App.tsx` is a hand-rolled router: a `flow` state machine (welcome → login/register/forgot/invite/addKid/pickKidForRoute → parent/driver) plus per-flow `tab` state drives which screen renders. **No navigation library.** Adding a new screen means wiring it into the switch in `App.tsx` and (if it's a tab) into `TabBar`/`DriverTabBar`.

Parent flow is wired to Supabase end-to-end. **Driver flow is still mocked** — `DriverRouteScreen`, `DriverCheckinScreen`, and `DriverProfileScreen` read static fixtures from `src/data.ts` (`STOPS`, `ROSTER`, `DRIVER`). See "Next iteration" below.

### Data model

- `profiles` (1:1 with `auth.users`, holds `full_name`, `phone`, `role: parent|driver|admin`)
- `schools`, `routes` (van/driver/school/period/times)
- `kids` (parent-owned: `parent_id`, `pickup_address`, `dropoff_address`)
- `kid_route_assignments` (m:m between kids and routes; `stop_order` optional)
- `invite_codes` (code → route, `max_redemptions`, `expires_at`); `invite_redemptions` audit log

RLS helpers in `is_parent_of_kid` / `drives_route` / `is_parent_on_route` / `is_driver_of_kid` (security definer, stable). Writes happen via SECURITY DEFINER RPCs: `validate_invite_code` (anon-callable), `link_kid_to_route` (authenticated, parent-only). Admin-only RPCs (`admin_create_school`, `admin_create_route`, `admin_generate_invite_code`) are revoked from `authenticated` — they're called manually in the SQL editor today.

Migrations live in `supabase/migrations/`; idempotent guards on every `create policy` / `create type`. `supabase/seed.sql` is **not** auto-applied — paste it into the dashboard SQL editor when starting from scratch.

### Client query layer

Hooks in `src/lib/`:
- `useProfile()` — own profile
- `useMyKids()` — flattened kid + route + driver + school per assignment
- `useRouteDetail(routeId)` — full route with synthesized school arrival entry
- `useCreateKid()` mutation
- `useValidateInviteCode()` (anon) / `useLinkKidToRoute()` (authed) mutations

All keyed on `user.id` and invalidated via `queryClient.invalidateQueries({ queryKey: ['my-kids', user?.id] })`.

### Design tokens

Duplicated in `tailwind.config.js` (NativeWind class names like `bg-canvas`) and `src/theme.ts` (raw hex for SVG fills in `MapView`). When changing a color, update both.

## Locale

User-facing strings are pt-BR; code identifiers, file names, and comments stay English.

## Next iteration: driver app

The parent flow is production-ready. The driver app still needs the same treatment. When picking this up:

1. **RPCs**: add `driver_create_route(school_id, van_label, period, ...)` and `driver_generate_invite_code(route_id, ...)`, callable by `authenticated` users with `role='driver'`. Drop the `admin_*` equivalents (or keep them as a fallback for the school admin).
2. **Role promotion**: today a driver is promoted manually via SQL (`update profiles set role='driver' where id=...`). Either keep that, or add a "request driver access" affordance.
3. **Schools**: the open question is whether the driver picks from a pre-registered list or creates schools themselves. Deferred — decide when building the screen. For now, schools are seeded via SQL.
4. **Screens to wire**:
   - `DriverRouteScreen` → reads `useRouteDetail(driverActiveRouteId)`
   - `DriverCheckinScreen` → reads `useMyKidsOnRoute(routeId)` (new hook, similar to `useMyKids` but driver-side; needs `kid_route_assignments + kids` filtered by `drives_route`)
   - `DriverProfileScreen` → reads `useProfile()` + driver's active routes
   - New `CreateRouteScreen` + `MyInviteCodesScreen`
5. **Mock data to retire**: `STOPS`, `ROSTER`, `DRIVER` in `src/data.ts` (still imported by the three driver screens above). `MAP_STOPS`/`ROUTE_PATH` stay — visual scaffold for the simulated map.
