@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — Expo dev server (also `npm run ios` / `android` / `web`)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` / `npm run lint:fix` — ESLint (flat config, `eslint-config-expo`)
- `npm run format` / `format:check` — Prettier (with `prettier-plugin-tailwindcss`)

No test runner is configured.

## Stack

Expo SDK 54 / React Native 0.81 / React 19 / TypeScript. Styling via **NativeWind v4** (Tailwind classes on RN components) — `global.css` is imported at the top of `App.tsx` to register the preflight. Reanimated v4 is installed; the Babel plugin is configured in `babel.config.js`.

Expo 54 has breaking changes from earlier versions — consult https://docs.expo.dev/versions/v54.0.0/ before adding APIs (per `AGENTS.md`).

## Architecture

This is an MVP prototype, not a production app. There is **no navigation library, no backend, no state management**. All "data" is static fixtures in `src/data.ts`.

- `App.tsx` is the single router: a `flow` state (`welcome` → `role` → `parent` | `driver`) plus per-flow `tab` state drives which screen renders. Adding a new screen means wiring it into this switch and (if it's a tab) into `TabBar`/`DriverTabBar`.
- Two parallel screen sets live under `src/screens/` (parent flow) and `src/screens/driver/` (driver flow). They share components from `src/components/` (`MapView`, `Avatar`, `Icon`, the two tab bars).
- Design tokens are duplicated in two places that must stay in sync: `tailwind.config.js` (for NativeWind class names like `bg-canvas`, `text-ink`) and `src/theme.ts` (for code that needs the raw hex, e.g. SVG fills in `MapView`). When changing a color, update both.

## Locale

User-facing strings are pt-BR; code identifiers, file names, and comments stay English. See sample copy in `src/data.ts` (`"Ezra (você)"`, `"Escola Greenfield"`).
