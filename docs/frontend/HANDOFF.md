# Maven Art Academic ERP — Frontend Handoff

> Purpose: give a new engineer (or a fresh Claude session) everything needed to
> continue this frontend without re-deriving context. Read this top to bottom
> once, then use `REQUIREMENTS.md` as the live per-module traceability matrix.

Last updated after commit `8054dd2` (Admin dashboard enhancement).

---

## 1. Snapshot

- **Product**: web frontend for an educational ERP with **two portals** —
  **Management** (Admin / Accounts / Faculty) and **Student/Parent**.
- **Status**: **spec-complete for the frontend.** Every module named in the
  governing spec is implemented across both portals, running against a mock API.
  Recent extra work: a responsive content-width refactor (Day 2A) and a
  full Admin-dashboard enhancement.
- **Health**: `npm run verify` is green — **359 tests**, typecheck + ESLint
  clean, production build succeeds.
- **Backend**: not implemented. The app runs entirely on an in-memory mock that
  imitates a real HTTP API. Switching to a real backend is `VITE_API_MODE=http`
  plus implementing the documented endpoints (see §8).

### Governing rules (the invariants — never break these)
1. **Frontend authorization is UX only.** The backend is the security boundary.
   Permission checks (`PermissionGuard`, route guards) only shape the UI.
2. **The frontend never decides state transitions.** Buttons come from the
   backend's advertised `availableActions` ∩ the caller's permission. Illegal
   transitions return **409**.
3. **The frontend never computes authoritative values** — balances, totals,
   grades, results, schedules, receipts, certificates. It displays what the
   backend returns, verbatim. (The "finance/academic/document invariants".)
4. **PDF spec is the source of truth.** Do not invent business rules. Anything
   without a backend contract is marked `TBD — BACKEND CONTRACT`.
5. **One coherent unit per turn**: build → verify (`npm run verify`) → browser-
   check → update `REQUIREMENTS.md` → commit → stop.

---

## 2. Tech stack & how to run

- Vite 8, React 19, TypeScript (strict), React Router 7 (`createBrowserRouter`,
  lazy routes), TanStack Query 5 (server state), Zustand 5 (auth + UI state),
  react-hook-form + Zod (forms), Tailwind CSS v4 (CSS-first `@theme`),
  Vitest + Testing Library. Node 24, npm.
- Platform note: development happens on **Windows** (PowerShell primary; a Bash
  tool is also available). Git may warn about LF→CRLF — harmless.

```bash
npm install
npm run dev        # http://localhost:5173  (mock API, no backend needed)
npm run verify     # typecheck + lint + test + build  (run before every commit)
npm run test       # vitest run
```

**Demo logins** (mock; password is `password` for all):
`admin@mavenart.test`, `accounts@mavenart.test`, `faculty@mavenart.test`,
`student@mavenart.test`, `parent@mavenart.test`.

---

## 3. Architecture

### The request spine (never bypass it)
```
Component → Hook (TanStack Query) → Service → ApiClient → Transport (mock | http)
```
- A component never calls `fetch` or the mock directly. It uses a **hook**; the
  hook calls a **service**; the service calls `apiClient.call(contract, …)`.
- ESLint bans importing `@/mocks` anywhere except the transport layer.
- `VITE_API_MODE` selects the transport (`mock` default, `http` for real API).

### Feature-slice layout
Every domain in `src/features/<domain>/` follows the same shape:
```
<domain>/
  types.ts                     # domain types (KnownOr<'a'|'b'> for backend enums)
  status.ts | stage.ts         # status → BadgeTone map (where applicable)
  api/<domain>.contract.ts     # endpoint() definitions (method, path, permission)
  api/<domain>.service.ts      # thin service methods over apiClient
  hooks/use<Domain>.ts         # useQuery / useMutation wrappers + query keys
  components/<Domain>Page.tsx   # list page
  components/<Domain>DetailPage.tsx
  <domain>.mock.test.ts        # mock-API tests (permissions, transitions, 404)
  <domain>.render.test.tsx     # component render tests (gating, verbatim values)
```
The mock store for each domain lives in `src/mocks/<domain>-data.ts` and is
registered as routes in `src/mocks/mock-router.ts`.

### Key shared systems
- **Layout shell**: `src/shared/layout/AppShell.tsx` (header + sidebar + main),
  configured per portal by `ManagementLayout` / `StudentParentLayout`.
- **Per-page content width** (Day 2A): `src/shared/layout/pageWidth.ts` chooses
  the content max-width from the route shape — list/index → **wide**
  (`--container-wide` 110rem), `:param` → **detail** (80rem), `new`/`edit` →
  **form** (48rem). `withPageWidth()` annotates the route tree once; the shell
  reads it via `useMatches()`. Override per route with `handle.pageWidth`.
  Management defaults to `wide`, Student/Parent to `detail`.
- **Design tokens**: `src/styles/index.css` `@theme` block — colors via
  `light-dark()`, type scale named by role (`--text-body`, `--text-page`, …),
  three radii, shallow shadows. Documented in `DESIGN_SYSTEM.md`.
- **UI kit**: `src/shared/ui/*` — `DataTable`, `Badge`, `Button`, `Modal`,
  `Input`, `Select`, `Card`, `QueryBoundary`, `EmptyState`, `Pagination`, toasts.
- **Dashboard kit**: `src/shared/dashboard/*` — `SummaryCard`, `WidgetCard`,
  `DashboardGrid`, `ActivityList`, `QuickAction`, `EmptyWidget`.
- **Page vocabulary**: `src/shared/layout/page.tsx` — `PageHeader`,
  `ContentSection`, `SectionHeader`, `FilterBar`, `ActionBar`.
- **List query**: `ListQuery` (page/limit/search/sortBy/sortDir/filters) +
  `useListQueryState` (URL-synced) + `toListParams`. All lists are server-driven.

### State separation
- **Server state** → TanStack Query only. Query keys live in each hook file.
- **Auth state** → `src/features/auth/auth.store.ts` (session, identity,
  permission set). `usePermissions()` exposes `can`, `canAny`, `canAll`, `meets`.
- **UI state** → `src/app/state/ui.store.ts` (sidebar, theme, `selectedStudentId`
  for the parent child-switcher, `selectedBatchId`). Persisted subset only.

---

## 4. The mock API (`src/mocks/`)

- `mock-router.ts` is the in-memory backend: `handleMockRequest(request, token)`
  matches `{method, pattern}` and runs a handler. It authenticates via a fake
  bearer token, enforces the permission each endpoint claims, paginates
  server-side, and throws normalized `ApiError`s (`fail(kind)` → 401/403/404/
  409/422/500). **Route ordering matters**: register specific routes before
  `:param` routes.
- Each domain's `*-data.ts` holds an in-memory store built from `src/mocks/seed.ts`
  (courses, batches, students, faculty, classes, finance figures). State-machine
  domains own their transitions and expose `reset<Domain>()` for test isolation.
- `src/mocks/fixtures.ts` defines the five demo accounts and the **role →
  permission** map (`MOCK_PERMISSIONS_BY_ROLE`). Permission keys are a strict
  union in `src/shared/types/permission.ts` — add a key there before using it.

### State-machine pattern (enquiries, applications, admissions)
The backend mock owns the machine; the entity detail carries `availableActions`;
the UI renders a button only when `action ∈ availableActions` **and** the user
holds the permission; an illegal transition → 409 + toast. Cross-domain
handoffs are wired: **application approve → creates an admission**; **admission
enrol → creates an enrollment**; **payment record → issues a receipt**. Deep
links between these resolve within a session.

---

## 5. What is implemented

### Management portal — every module DONE
| Group | Modules |
| --- | --- |
| Academics | Students (list, 8-tab detail, create/edit form), Parents, Faculty (+detail), Courses (+detail), Batches (+detail), Timetable (day/week/batch/faculty/room), Attendance (faculty marking workflow) |
| Admissions (§15–18) | Enquiries (state machine + follow-ups), Applications (review/approve/reject → admission), Admissions (confirm/enrol → enrollment), Enrollments |
| Finance (§19–24) | Fee Structures, Fee Assignments, Installments, Payments (record, gated `payments.create`), Outstanding Fees, Receipts |
| Academic records (§26–27) | Academic Progress (backend grades), Certificates (issue, gated `certificates.issue`), Reports (view + export) |
| Administration | Users, Roles & Permissions, Audit Logs, Settings |
| Dashboards | Admin (full operational overview — action centre, institution groups, recent activity from audit, quick actions), Accounts (financial), Faculty (teaching load) |

### Student/Parent portal — every module DONE
Dashboard (backend-scoped “me”), Profile, Course, Timetable, Attendance
(backend %), Progress (backend grades), Fees, Payments, Certificates, and
**My Children** — the parent switcher: selecting a child sets `selectedStudentId`,
which every portal query keys on, re-scoping the whole portal (§8). Backend still
authorises access.

### Cross-cutting done
- Responsive content-width system (Day 2A) — verified 375→1920px, no overflow.
- Notifications (centralised, shared by both portals).
- Loading / empty / error / unauthorized / forbidden states everywhere via
  `QueryBoundary`.

**Traceability**: `docs/frontend/REQUIREMENTS.md` has a row per module (status +
API domain rows). Keep it updated as the single source of “what’s done”.

---

## 6. Directory map (orientation)
```
src/
  app/                 # router, providers, ui.store
  config/navigation/   # management.nav.ts, student-parent.nav.ts (+ filter)
  features/<29 domains># feature slices (see §3)
  lib/api/             # apiClient, endpoint(), ApiError, toListParams, transports
  lib/utils/           # cn(), format.ts (formatCurrency/Date/DateTime/Percent…)
  mocks/               # mock-router.ts, seed.ts, fixtures.ts, <domain>-data.ts
  portals/
    management/        # ManagementLayout, routes.tsx, pages/ManagementDashboard
    student-parent/    # StudentParentLayout, routes.tsx, pages/…Dashboard
  shared/
    dashboard/         # dashboard widget kit
    layout/            # AppShell, AppHeader, SidebarNav, page.tsx, pageWidth.ts
    ui/                # DataTable, Modal, Badge, Button, inputs, QueryBoundary…
    types/             # permission.ts, auth.ts, api/list types
  styles/index.css     # @theme tokens, utilities, light-dark palette
docs/frontend/         # ARCHITECTURE, DESIGN_SYSTEM, DEVELOPMENT, AUDIT,
                       # ARCHITECTURE_REVIEW, REQUIREMENTS, HANDOFF (this file)
```

---

## 7. Conventions a new contributor MUST follow
- **Add a permission key** to `src/shared/types/permission.ts` before referencing
  it; grant it to roles in `src/mocks/fixtures.ts`.
- **New module** = copy an existing feature slice (e.g. `receipts` for read-only,
  `payments` for a create action, `applications` for a state machine). Register
  its mock store + routes in `mock-router.ts`, add lazy routes in the portal’s
  `routes.tsx`, and (management) it inherits page-width from route shape.
- **Money/grades/totals**: store them explicitly in the mock and render verbatim.
  Tests should prove the client does not recompute (e.g. give the backend a total
  that differs from the component sum and assert the backend figure shows).
- **Tables**: use `DataTable` with `renderMobileCard` for Student/Parent (mobile
  first-class) and rely on horizontal scroll for Management.
- **Tests**: every domain gets a `.mock.test.ts` (permissions, transitions, 404)
  and, where there’s notable UI, a `.render.test.tsx` (gating, verbatim values).
  Watch for DataTable rendering both a desktop row and a mobile card → use
  `getAllByText`.
- **Commit style**: `type(scope): summary`, ending with
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`. Only commit when the
  unit is green.

---

## 8. Swapping to a real backend
1. Set `VITE_API_MODE=http` and point the http transport at the API base URL.
2. Implement the endpoints the contracts declare. Each `api/<domain>.contract.ts`
   lists method + path + permission for every call — that IS the API surface the
   backend must satisfy. Domains: students, parents, faculty, courses, batches,
   attendance, timetable, enquiries, applications, admissions, enrollments,
   fee-structures, fee-assignments, installments, payments, outstanding, receipts,
   progress, certificates, reports, users, roles, audit, settings, notifications,
   dashboard, portal.
3. The backend must return the same shapes (see each `types.ts`) and enforce the
   permissions/`availableActions`/authoritative values the frontend assumes.
   Minimal UI change is expected — that’s the point of the abstraction.

---

## 9. Pending / remaining work

### A. Backend dependency (frontend ready, waiting on contract) — marked `TBD — BACKEND CONTRACT`
- **Real API** for every domain (§8). All figures are currently mock values.
- **Write paths not yet built** where the permission exists but no contract does:
  student **batch/course transfer, withdrawal, institutional transfer,
  completion** lifecycle operations (§7 of the Admin brief); roles editing
  (`roles.update`); settings editing (`settings.update`); fee-structure
  create/update; fee-assignment create; portal mutations.
- **Currency/locale** assumed INR/en-IN in `format.ts` — confirm with backend.

### B. Modules referenced but not built (no spec module / no data yet)
These appear on the Admin dashboard as **summary counts only** (permission-gated,
marked “module pending”) but have **no detail module, no mock store, and only
demonstration counts**:
- **Discipline** (`discipline.*` keys added) — incidents, states, confidential.
- **Leave / OD** (`leave.*`, `od.*` keys added) — request queues + approve flow.
- **Announcements** (`announcements.*` keys added) — create/schedule/publish.
Building any of these = a new feature slice + mock store + routes, then repoint
the dashboard action-centre items and summary cards to real data.

### C. Enhancements not yet requested (optional)
- **Student 360° profile** (Admin brief §22): the Students detail page exists
  with tabs; extend it to the full biodata/parent/siblings/health/discipline/
  leave sections as those domains land.
- **Other role dashboards** (Accounts, Faculty) were intentionally left as-is per
  the last task’s boundary — they are functional but not expanded to the depth of
  the Admin dashboard.
- **Reports**: currently a catalog + export request; no charts (deliberately).
  Add data-backed charts only when they carry operational value (see
  `dataviz`/design guidance if charts are introduced).
- Refresh `AUDIT.md` / `ARCHITECTURE_REVIEW.md` to reflect the finished build.

### D. Deployment
- No public deploy yet. It’s a static SPA — `npm run build` → serve `dist/` on any
  static host (Vercel/Netlify/Cloudflare/GitHub Pages). Needs SPA-fallback routing
  (all paths → index.html) and, if not hosted at root, a Vite `base`. Deploying is
  an outward-facing action — do it with the user’s hosting account.

---

## 10. Environment / known constraints
- **Windows dev box.** Use PowerShell or the Bash tool; both are available. Git
  warns LF→CRLF (cosmetic).
- **Linux CTF binaries can’t be run here** (no WSL) — not relevant to this app,
  but noted in memory.
- **In-app browser preview** occasionally: (a) can’t composite screenshots
  (“pane not displayed”) — rely on DOM/JS assertions + tests instead; (b) drifts
  routes or drops the session under HMR — re-login and re-navigate; (c) the dev
  server sometimes stops between sessions — `npm run dev` restarts it.
- **React controlled-input simulation** via raw DOM value-setting doesn’t always
  register in the live preview — cover create/edit form submits with unit tests
  rather than trusting a scripted browser fill.

---

## 11. Quick verification checklist for the next session
```bash
npm run verify          # expect: typecheck ok, lint ok, ~359 tests pass, build ok
npm run dev             # log in as admin → /management shows the full dashboard
```
Then read `docs/frontend/REQUIREMENTS.md` for the authoritative per-module status
before starting anything new, and follow the “one coherent unit per turn” loop.
