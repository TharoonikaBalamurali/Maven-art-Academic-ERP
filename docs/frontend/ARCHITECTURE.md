# Maven Art Academic ERP — Frontend Architecture

Authoritative source: **Maven Art Academic ERP — Frontend Architecture & Portal
Specification, v1.0** (referenced below as §n). Where this document and the
specification disagree, the specification wins.

Status: Day 1 foundation. No business modules are implemented.

---

## 1. Technology decisions

| Concern | Choice | Why |
| --- | --- | --- |
| Build tool | **Vite 8** | Fast dev server, first-class TypeScript, standard production bundling. No framework-level server is needed — the backend owns all data and auth (§41). |
| Framework | **React 19** | Largest ecosystem for data-heavy admin interfaces; the team's likely default. |
| Language | **TypeScript (strict)** | §5 of the Day 1 brief requires a strong type system. `strict` plus `noUncheckedIndexedAccess`; `any` is an ESLint error. |
| Routing | **React Router 7** (`createBrowserRouter`) | Nested layout routes map directly onto the two-portal structure (§1) and make layered route guards natural (§12). |
| Server state | **TanStack Query 5** | §27 requires server state to be separated from UI state. Query owns caching, deduplication, retry and cancellation, so no API response is ever copied into a global store. |
| Auth + UI state | **Zustand** | Two small stores for the other two state categories in §27. Chosen over Context to keep re-renders narrow and to allow non-React code (the API client) to read the session. |
| Forms | **react-hook-form + Zod** | §30: fast client-side feedback, uncontrolled inputs for large forms, and a resolver that maps cleanly onto backend 422 responses. |
| Styling | **Tailwind CSS v4** | Utility-first over a token layer defined once in `src/styles/index.css`. No component library was adopted — see §7 below. |
| Icons | **lucide-react** | Tree-shakeable SVG icons; navigation config references components directly. |
| Testing | **Vitest + Testing Library** | Shares the Vite pipeline (no second build config); Testing Library keeps tests behavioural rather than implementation-coupled. |
| Class merging | **clsx + tailwind-merge** | Two tiny utilities behind one `cn()` helper, so variant props can override base classes predictably. |

**No UI component library** (MUI, Ant, shadcn, Radix) was installed. The
specification names 17 primitives (§34) that are mostly native elements —
`<dialog>`, `<select>`, `<table>`, `<input type="date">`. Using the platform
gives correct accessibility and mobile behaviour without a dependency that
would dictate the visual language of the whole ERP. If a genuinely hard widget
appears later (combobox, virtualised grid), add a headless primitive for that
widget only.

**Deviation from the specification, recorded per the Conformance Rule.**
§1 describes "two independently developed applications". This repository is one
Vite application containing two portal boundaries (`src/portals/management`,
`src/portals/student-parent`) over shared infrastructure.
*Reason:* the portals share identity, permissions, API client, error handling
and every UI primitive; two build pipelines would duplicate all of it on Day 1
for no benefit. *Impact:* one deployment artefact serves both portals; a user
downloads some code for a portal they cannot enter. *Reversal path:* the portal
directories have no cross-imports, so splitting them into separate builds later
requires moving two folders and duplicating `main.tsx` — no rewrite of shared
code.

---

## 2. Architectural spine

```
Component → Hook → Service → ApiClient → Transport → (mock | backend)
```

Enforced, not just documented:

* Components never import `apiClient` or a service directly; they use a hook.
* Services are the only place that knows an endpoint path.
* The API client is the only place that knows a base URL or auth scheme.
* `src/mocks` may be imported by exactly one file (`lib/api/mock-transport.ts`).
  An ESLint `no-restricted-imports` rule fails the build otherwise.

Swapping mock for real backend is `VITE_API_MODE=http` plus a base URL. No
component, hook or service changes (§42).

---

## 2b. Design system

`src/styles/index.css` is the single source of visual truth. Components compose
utilities generated from tokens; they never invent a radius, shadow or font
size.

* **Colour** — semantic tokens (`--surface`, `--text-muted`, `--accent`,
  `--danger` …), each declared **once** with CSS `light-dark()`. Only
  `color-scheme` changes between themes, so light and dark cannot drift apart.
  Dark is not an inversion: light uses white cards on a near-white page, dark
  uses a *lighter* card on a dark page so elevation still reads correctly.
* **Radius by role** — `--radius-control` (buttons, inputs), `--radius-surface`
  (cards, panels), `--radius-overlay` (modals, drawers).
* **Elevation by level** — `--shadow-raised`, `--shadow-overlay`,
  `--shadow-modal`. Deliberately shallow.
* **Type scale by role** — `--text-caption` (11px) → `--text-metric` (24px),
  named for purpose so "how big is a table cell" is one edit.
* **Composite utilities** — `surface-card`, `surface-overlay`, `page-gutter`.

Theme preference (`light` / `dark` / `system`) lives in `ui.store` and is
applied as `data-theme` on the root element.

## 3. Directory structure

```
src/
  app/                     Application wiring
    providers/             QueryClientProvider, theme, auth bootstrap
    router/                Route tree, guards, 403/404 pages, error boundary
    state/                 ui.store.ts  (UI state — §27)
    query-client.ts        Server-state defaults (§27)
  config/
    env.ts                 The only reader of import.meta.env
    navigation/            Permission-annotated nav trees + filter
  features/                Domain features (vertical slices)
    auth/                  Contract, service, store, guards, permissions, login
    notifications/         Reference feature proving the architecture
  lib/
    api/                   ApiClient, contract types, transports, ApiError
    utils/                 cn(), field id helpers
  mocks/                   Mock backend — deleted at integration time
  portals/
    management/            Shell + routes for Admin / Accounts / Faculty
    student-parent/        Shell + routes for Student / Parent
    shared/                ModulePlaceholder
  shared/
    types/                 Centralised domain + API types
    ui/                    Presentational primitives (§34)
    layout/                AppShell, header, sidebar, breadcrumbs, search
    dashboard/             Dashboard grid, summary cards, widget states
    forms/                 useApiForm, FormError
    hooks/                 useListQueryState, useDebouncedValue
  test/                    Test render helpers
```

A feature owns its contract, service, hooks, types and components. Adding a
module means adding one folder under `features/` and one route entry — nothing
in `app/`, `lib/` or `shared/` changes.

---

## 4. Authentication (§10)

```
login → session stored → GET /auth/me → user + profile + role + permissions → portal
```

* `authService` calls the endpoints; `useAuthStore` holds the result.
* Only the **credential** is persisted (`localStorage`), never role or
  permissions. On every reload the identity is re-fetched from the backend, so
  tampering with storage yields at most an invalid token (§39).
* A 401 from *any* endpoint calls `expireSession()` once, centrally, via the
  API client's unauthorized handler. Individual callers never handle 401.
* Day 1 authentication is **mock**. It is not security and is not represented as
  such — the backend is the security boundary (§2).

---

## 5. Permissions (§11, §12, §35)

Everything flows from one pure module, `features/auth/permissions.ts`:
`hasPermission`, `hasAnyPermission`, `hasAllPermissions`, `satisfies`.

Consumers:

| Surface | Mechanism |
| --- | --- |
| Routes | `<RequirePermission anyOf={[...]}>` → renders the 403 page (§12) |
| Portal boundary | `<RequirePortal portal="management">` → redirects to the user's own portal |
| Navigation | `filterNavSections()` removes items and empty sections |
| Buttons/actions | `<PermissionGuard permission="students.create">` |

There is **no** `role === 'admin'` check anywhere in the application. The role is
used for exactly two things: choosing a portal, and printing a label. An empty
requirement means "any authenticated user", which is how Dashboard stays visible.

`PermissionKey` accepts strings outside the catalogue, so a backend that adds a
permission does not require a frontend release.

---

## 6. State separation (§27)

| Category | Owner | Rule |
| --- | --- | --- |
| Server state | TanStack Query | Anything from an API. Never copied into a store. |
| Auth state | `auth.store.ts` | Session, user, profile, role, permissions. |
| UI state | `ui.store.ts` | Sidebar, drawer, theme, selected student/batch. Persisted selectively. |

---

## 7. Errors, loading and data states (§28, §29)

Every transport converts failures into a single `ApiError` with a normalized
`kind`. Status mapping is exactly §29 (400/401/403/404/409/422/500) plus
`network`, `timeout` and `aborted`. **Raw backend messages are never shown** —
they are attached as `cause` for logging only.

`<QueryBoundary>` turns a query result into the right state: loading skeleton,
403 `ForbiddenState`, 404 `NotFoundState`, or a retryable `ErrorState`. Pages
decide empty vs. no-results, because only the page knows whether zero rows means
"no data" or "your filter excluded everything".

---

## 8. Lists: search, filter, sort, pagination (§31, §32)

`useListQueryState` holds page/search/sort/filters **in the URL**, producing the
`ListQuery` sent to the backend. Filtered views are shareable and survive
reloads, and the query string is a natural React Query cache key.

Pagination consumes backend metadata (`page`, `limit`, `total`, `totalPages`)
and never slices client-side. The architecture cannot accidentally load a whole
table into the browser.

`features/notifications` is the worked reference: copy it when building
Students, Payments or Attendance.

---

## 8b. Application shell (§9)

Both portals render one `AppShell`, differing only by props. The header is
`Logo · Search · Notification · Profile` in both, as the specification requires
a consistent layout system across the two applications.

* **Search** is a permission-filtered module jumper (`Ctrl`/`Cmd`+`K`). It does
  not search records — that is server-side (§31) and awaits an endpoint.
* **Breadcrumbs** are derived from the navigation config rather than a second
  route-title registry, so they can never disagree with the sidebar.
* **Dashboards** compose `DashboardGrid` / `SummaryCard` / `WidgetCard` /
  `QuickAction` / `ActivityList` plus widget-scale loading, empty and error
  states. Metrics render in an explicit `unavailable` state until the backend
  supplies them — the foundation never displays an invented number.

Every page element is loaded through `lazyRoute`, so a module's code is fetched
only when someone navigates to it.

## 9. Responsive & accessibility (§33, Day 1 steps 19–20)

* Management: persistent sidebar ≥1024px, drawer below. Tables scroll
  horizontally inside their own container.
* Student/Parent: drawer navigation plus a bottom tab bar under 640px; tables
  render as cards via `renderMobileCard`.
* Dialogs and drawers are native `<dialog>` (focus trap, top layer, Escape).
* Every control is labelled; errors use `role="alert"` and `aria-describedby`;
  interactive targets are ≥44px; a skip link precedes the navigation; sortable
  headers expose `aria-sort`; `prefers-reduced-motion` is honoured.

---

## 10. Environment & deployment

`src/config/env.ts` is the only reader of `import.meta.env`, and it throws at
startup on invalid configuration (e.g. `VITE_API_MODE=http` without a base URL).
No URL, credential or secret appears in source. `.env` files are git-ignored;
`.env.example` documents every variable.

The build output is static (`dist/`) and needs only SPA history fallback —
`public/_redirects` covers Netlify/Cloudflare Pages; the equivalent nginx and
Apache rules are in `DEVELOPMENT.md`.
