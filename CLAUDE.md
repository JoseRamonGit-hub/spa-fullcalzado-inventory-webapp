# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (auto-configures Supabase env)
npm run build            # Production build (generates routes, type-checks, bundles)
npm run lint             # ESLint
npm run format           # Prettier (120 char width)
npm run test             # Vitest in watch mode
npm run test:run         # Vitest single run
npm run test:db          # Supabase SQL tests (supabase/tests/)
npm run test:all         # Frontend + database tests
npm run supabase:start   # Start local Supabase instance
npm run generate-routes  # Regenerate TanStack Router route tree
```

Run a single test file: `npx vitest run src/features/auth/login/hooks/useLogin.test.tsx`

## Architecture

React 19 + TypeScript SPA for shoe store inventory management. Spanish-language UI localized to Venezuela (es-VE locale, America/Caracas timezone). Supabase for auth, database, and real-time.

### Stack

- **Routing**: TanStack Router — file-based in `src/routes/`, auto-generates `src/routeTree.gen.ts`
- **Server state**: TanStack React Query (staleTime: 30s, retry: 5)
- **Client state**: Zustand (auth store persisted to localStorage as "auth-storage")
- **Forms**: TanStack React Form with custom `useAppForm` hook (`src/hooks/form.ts`)
- **Tables**: TanStack React Table with column definitions in `features/*/columns.tsx`
- **UI**: shadcn/ui + Radix + Tailwind CSS 4 + next-themes (light/dark)
- **Path alias**: `@/*` maps to `src/*`

### Route layout groups

- `_auth` — unauthenticated routes (login). Redirects to `/inventory` if already authenticated.
- `_app` — authenticated routes (inventory, transactions, movements, cash-closes, settings). Redirects to `/login` if not authenticated. Contains the sidebar, topbar, modals, and keyboard shortcuts.

Auth guard in `_app` is a synchronous Zustand check — the root route's `beforeLoad` handles the async Supabase session validation.

### Feature module pattern

Each feature in `src/features/` follows this structure:

- `page.tsx` — main page component (imported by the route file)
- `hooks/` — React Query hooks with query key factories (e.g., `productKeys.list(date)`)
- `components/` — feature-specific components (topbar, modals, etc.)
- `columns.tsx` — TanStack Table column definitions (where applicable)

Route files in `src/routes/` are thin wrappers that import from `src/features/*/page.tsx`.

### Service layer

`src/services/*Service.ts` files contain all Supabase database operations. Features never call Supabase directly — they go through services, which are consumed by React Query hooks in `features/*/hooks/`.

### Modal system

Two global modals managed by Zustand (`useModalStore`):

- **InModal** (Ctrl+I) — inventory entry: create new products or add stock to existing ones in batches
- **OutModal** (Ctrl+J) — record sales

### Types

- `src/types/supabase.ts` — auto-generated Supabase database types
- `src/types/index.ts` — app-level types using `Tables<T>`, `TablesInsert<T>`, `TablesUpdate<T>` helpers

### Database

Supabase PostgreSQL. Migrations in `supabase/migrations/`. SQL tests in `supabase/tests/`. Local Supabase must be running for dev (`npm run supabase:start`).

## Conventions

- Currency formatting uses `src/utils/formatters.ts` — always use `formatCurrencyUSD`/`formatCurrencyVES`/`formatDate` helpers, never raw `Intl` or `toLocaleString`
- Search params are validated with Zod schemas in route files for type-safe URL state
- React Query cache invalidation happens in mutation `onSuccess` callbacks within hooks
- Test files live next to source files (`*.test.ts` / `*.test.tsx`)
- Evitar en lo posible useCallback y useMemo, esta app ya usa el react compiler
