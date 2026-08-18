# Development Guide

## Prerequisites

Node.js ≥ 20 (developed on 24) and npm ≥ 10.

## Setup

```bash
npm install
```

```bash
cp .env.example .env.development
```

`.env.development` is already committed as a working mock-mode configuration, so
in practice `npm install && npm run dev` is enough.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (includes the architecture boundary rules) |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest, watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run build` | Typecheck then production build to `dist/` |
| `npm run preview` | Serve the production build on :4173 |
| `npm run verify` | typecheck → lint → test → build |

## Signing in (mock mode)

Password for every account is `password`.

| Role | Email | Lands on |
| --- | --- | --- |
| Admin | `admin@mavenart.test` | `/management` |
| Accounts | `accounts@mavenart.test` | `/management` |
| Faculty | `faculty@mavenart.test` | `/management` |
| Student | `student@mavenart.test` | `/portal` |
| Parent | `parent@mavenart.test` | `/portal` |

Each role receives a different permission set from the mock API, so the sidebar,
the route guards and the action buttons all change. The Management dashboard
lists the granted permissions, which is the quickest way to see why a menu item
is or is not present.

## Seeing every data state

`/portal/notifications` (sign in as Student or Parent) has a **Demo state**
selector that forces the mock API to return empty / server error / forbidden /
not found. It is mock-only and disappears under a real backend.

## Environment variables

| Variable | Values | Notes |
| --- | --- | --- |
| `VITE_API_MODE` | `mock` \| `http` | `mock` routes everything to `src/mocks`. |
| `VITE_API_BASE_URL` | URL | Required when mode is `http`. Startup fails otherwise. |
| `VITE_API_TIMEOUT_MS` | number | Default 15000. |
| `VITE_MOCK_LATENCY_MS` | number | Artificial mock latency; default 300. |
| `VITE_APP_NAME` | string | Shown in the header and on login. |
| `VITE_APP_ENV` | string | Free-form environment label. |

Never commit a populated `.env`. Only `.env.example` is tracked.

---

## How the pieces fit

### Authentication

`features/auth/`. `auth.store.ts` holds the session; `session-storage.ts`
persists **only** the credential. On startup `AuthProviders` → `restore()`
revalidates it against `/auth/me`. A 401 anywhere ends the session centrally.

### Permissions

`features/auth/permissions.ts` — pure functions. Use `usePermissions()` in
components, `<PermissionGuard>` for UI, `<RequirePermission>` for routes. Never
branch on the role.

### Navigation

`config/navigation/*.nav.ts` declare the trees with `anyOf` / `allOf`
permissions; `filter.ts` prunes them per user. One config serves all roles.

### API

* Contract: `features/<domain>/api/<domain>.contract.ts` — path, method, auth,
  expected permission.
* Service: `<domain>.service.ts` — calls `apiClient`, maps to domain types.
* Hook: `hooks/use<Domain>.ts` — React Query, cache keys, cancellation.
* Mocks: `src/mocks/mock-router.ts`.

### State

Server → React Query. Session → `auth.store`. Chrome/selections → `ui.store`.
Do not mix.

---

## Adding a new module (worked example: Students)

1. **Types** — `src/features/students/types.ts`.
2. **Contract** — `api/students.contract.ts`:

   ```ts
   export const studentsContract = {
     list: endpoint<void, Paginated<Student>, ListQuery>({
       method: 'GET', path: '/students', auth: true, permission: 'students.view',
     }),
   } as const;
   ```

3. **Service** — `api/students.service.ts`, using `toListParams()` for lists.
4. **Mock handler** — add a route to `src/mocks/mock-router.ts` (skip once the
   real backend exists).
5. **Hook** — `hooks/useStudents.ts` with a `studentKeys` cache-key object.
6. **Page** — copy `features/notifications/components/NotificationsPage.tsx`.
   It already wires `useListQueryState` → hook → `QueryBoundary` → `DataTable` →
   `Pagination`, including the empty/no-results distinction.
7. **Route** — replace the `students` placeholder in
   `portals/management/routes.tsx` with the real element. The guard and the
   navigation entry already exist.
8. **Permissions** — if a new permission is needed, add it to
   `shared/types/permission.ts` and tell the backend team; it must exist in the
   RBAC tables to have any effect.
9. **Tests** — service mapping, permission-dependent rendering, and the states
   the page can reach.

Nothing in `app/`, `lib/` or `shared/` should need to change. If it does, that
is an architectural gap worth recording in `ARCHITECTURE_REVIEW.md` rather than
working around.

---

## Connecting the real backend

1. Set `VITE_API_MODE=http` and `VITE_API_BASE_URL`.
2. Reconcile each `*.contract.ts` with the backend API document — every
   provisional path is marked `TBD — BACKEND CONTRACT`.
3. Adjust `parseErrorBody()` in `lib/api/http-transport.ts` to the real error
   envelope.
4. If the backend uses httpOnly cookies rather than bearer tokens, drop the
   `accessToken` handling in `session-storage.ts`; `credentials: 'include'` is
   already set.
5. Delete `src/mocks/` and the `DemoCredentials` component.

## Deployment

`npm run build` produces a static `dist/`. Any static host works, provided
unknown paths fall back to `index.html`:

* **Netlify / Cloudflare Pages** — `public/_redirects` is already included.
* **nginx** — `location / { try_files $uri $uri/ /index.html; }`
* **Apache** — `FallbackResource /index.html`

Environment variables are baked in at build time, so build once per environment.
