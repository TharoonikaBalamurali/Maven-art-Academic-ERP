# Architecture Review

Living document. Updated at the end of each foundation review.

* **Round 1** — Day 1 build review (quality gate passed, 70 tests).
* **Round 2** — Foundation review and UI/UX refinement (this document).

---

## 1. Current architecture

```
Component → Hook → Service → ApiClient → Transport → (mock | backend)
```

| Layer | Location | Responsibility |
| --- | --- | --- |
| Portals | `src/portals/{management,student-parent}` | Shell config + route tables for the two applications (§1) |
| Features | `src/features/*` | Vertical slices: contract, service, hooks, components |
| Shared UI | `src/shared/ui`, `shared/layout`, `shared/dashboard`, `shared/forms` | Presentational system, no domain knowledge |
| Infrastructure | `src/lib/api`, `src/app` | API client, routing, guards, providers, state stores |
| Config | `src/config` | Environment + permission-annotated navigation |
| Mocks | `src/mocks` | In-memory backend, reachable from exactly one file |

State is split three ways per §27: **server** (TanStack Query), **auth**
(`auth.store`), **UI** (`ui.store`). Authorization is permission-based
everywhere; the role is used only to choose a portal and print a label.

---

## 2. What Round 1 already had right

These were audited and left alone — the review brief's first rule is not to
damage a working foundation.

* **The mock boundary is enforced by tooling.** An ESLint rule forbids importing
  `@/mocks` outside the transport. Swapping to a real backend remains a
  one-variable change.
* **Permission algebra is pure and centralised**, with forward compatibility for
  permissions the backend adds later.
* **Errors are normalized once** into `ApiError`, with the §29 status mapping;
  raw backend text never reaches a user.
* **List state lives in the URL**, which keeps server-side pagination the
  natural path and client-side filtering the awkward one.
* **Layered route protection** (`RequireAuth → RequirePortal → RequirePermission`)
  with a real 403 experience.
* **No role checks, no API calls in components, no business rules in the
  frontend.** Re-verified by grep and by test.

---

## 3. Problems found

Ordered by severity. Items 1–2 are specification conformance failures
introduced in Round 1 — the most serious category, because the brief forbids
silently changing a requirement.

| # | Problem | Severity |
| --- | --- | --- |
| 1 | **Notifications were scoped to the Student/Parent portal only.** §25 states notifications are centralised and the backend decides who receives them; Round 1 invented a `portal.notifications.view` permission and withheld it from Admin, Accounts and Faculty. This silently narrowed a requirement. | High |
| 2 | **The Management header had no notification bell and neither header had Search.** §9 specifies one consistent layout for both applications: `Logo · Search · Notification · Profile`. Two of four elements were missing. | High |
| 3 | **The dark palette was duplicated verbatim in two CSS blocks.** Editing one and not the other would silently drift the dark theme. | Medium |
| 4 | **The design system was colour-only.** No tokens for radius, elevation or type scale, so components had drifted to four radii (`md`/`lg`/`xl`/`full`), three shadows and two arbitrary font sizes chosen ad hoc. | Medium |
| 5 | **No breadcrumbs and no route-title source.** §7 of the brief requires them; deeper routes gave the user no sense of place. | Medium |
| 6 | **No dashboard component vocabulary.** Each future dashboard would have invented its own grid, metric card and widget states. | Medium |
| 7 | **No route-level code splitting.** Carried over as known debt from Round 1; the entry chunk would grow with all ~30 modules. | Medium |
| 8 | **`Modal`, `Drawer`, `ConfirmDialog` and `Tabs` were untested and unused.** jsdom does not implement `HTMLDialogElement.showModal`, so dialog components were *untestable*, not merely untested. | Medium |
| 9 | **Search fired on submit only, with no debounce utility.** | Low |
| 10 | **Delivery status was not visible in the UI.** A placeholder page could be mistaken for a finished module in a demo. | Low |
| 11 | **Two `<nav aria-label="Main">` landmarks** (desktop sidebar + mobile drawer) — duplicated landmark names make landmark navigation ambiguous. | Low |
| 12 | **The search trigger was a 36px touch target** on mobile, below the 44px the responsive foundation promises. | Low |
| 13 | **`main.tsx` was not HMR-safe.** Re-execution during a hot update would call `createRoot()` on a container that already had a root, mounting a second React tree. | Low |

---

## 4. Problems fixed

All thirteen. Notable implementations:

1. **`notifications.view` is now a cross-portal permission** held by all five
   roles, matching §25. The same `NotificationsPage` feature now serves both
   portals through `/management/notifications` and `/portal/notifications` —
   which also demonstrates that a feature is portable across portal boundaries.
2. **Both headers now render `Logo · Search · Notification · Profile`.**
   Scope decision on Search: it searches the **navigation the current user may
   reach** (a module jumper, `Ctrl`/`Cmd`+`K`), not institutional records,
   because record search is server-side (§31) and no endpoint exists. The
   dialog, keyboard handling and trigger are reusable when it does — see the
   `TBD — BACKEND CONTRACT` note in `NavSearch.tsx`.
3. **Dark mode now uses CSS `light-dark()`.** Every token is declared once;
   only `color-scheme` changes per theme. The duplicated block is gone and
   drift is now impossible. Verified in the browser: explicit light, explicit
   dark and system-follows-OS all resolve correctly from one definition.
4. **The design system covers radius, elevation, type scale and layout.**
   Tokens are named by *role*, not by size — `--radius-control` /
   `--radius-surface` / `--radius-overlay`, `--shadow-raised` / `--shadow-overlay`
   / `--shadow-modal`, `--text-caption` … `--text-metric`. All 23 component
   files were migrated; a grep for raw `rounded-*` / `shadow-*` / `text-{xs,sm}`
   in components now returns nothing.
5. **Breadcrumbs are derived from the navigation config**, not a second title
   registry, so a module's breadcrumb can never disagree with its sidebar entry.
   Deep routes resolve against the longest matching entry
   (`Dashboard › Academic › Students › New`).
6. **Dashboard kit added**: `DashboardGrid`, `WidgetCard`, `SummaryCard`,
   `QuickAction`, `ActivityList`, `LoadingWidget`, `EmptyWidget`, `ErrorWidget`.
   Every metric renders in the `unavailable` state showing an em-dash and
   "Connected to the backend in Phase N" — **no number on any dashboard is
   invented**, which was an explicit constraint.
7. **Route-level code splitting** via a `lazyRoute` helper used by every page.
   Entry chunk fell from 18.4 kB to 15.0 kB gzip, with per-page chunks.
8. **A jsdom shim for `showModal`/`close`** was added to the test setup,
   reproducing only the observable contract the components rely on. Overlays
   and tabs now have real behavioural coverage (accessible name, native close
   event, roving tabindex, arrow-key navigation).
9. `useDebouncedValue` added and wired into the reference list page.
10. `ModuleStatus` (`foundation` / `placeholder` / `partial` / `implemented`)
    with a badge rendered on every placeholder page.
11. The drawer's navigation landmark is now named distinctly.
12. Search trigger raised to 44px; minimum visible touch target re-measured at
    44px on mobile.
13. `main.tsx` caches the root on `import.meta.hot.data`, so hot updates
    re-render the existing tree instead of mounting a second one.

**One reported symptom was *not* a defect.** A screenshot showed the app
apparently rendering twice, overlapping. Investigation found a single `#root`
with two children — the app shell and the toast region — and exactly one
`<header>`, `<main>` and `<h1>`. The overlap was a stale compositor frame in the
preview pane left over from a viewport resize. The HMR hardening above is still
worth having, but it was not the cause of what was seen.

---

## 5. UI improvements

* **Design direction**: calm, structured, information-dense. Muted indigo
  accent chosen to survive eight-hour daily use; shallow elevation so the app
  reads as a document rather than a stack of floating cards.
* **Type scale** tightened to a 6-step role-named scale; dense table text is
  13px, body 14px, page titles 20px, dashboard metrics 24px.
* **Badge tones now carry fixed meaning** across the product (success = paid /
  completed, warning = pending, danger = overdue / failed, info = in progress).
* **Sidebar** gained section grouping, a left active rule (so active state does
  not rely on colour alone), and a graceful collapsed mode.
* **Header** gained the product mark, contextual portal label, search, bell and
  a restructured profile menu with a theme group.
* **Page container** unified: one `page-gutter` utility and one max content
  width token, so every future page has identical rhythm.

---

## 6. Remaining risks

| Risk | Assessment |
| --- | --- |
| **`light-dark()` browser support** | Chrome 123+, Safari 17.5+, Firefox 120+. Fine for an internal ERP in 2026; an older browser would render the light palette rather than break. Documented rather than polyfilled. |
| **Permission catalogue is still provisional** | It mirrors §11 but the authoritative list is the backend's. Reconciliation is an integration task; a consistency test now guards against drift *within* the frontend. |
| **No end-to-end tests** | Component and unit coverage is good (95 tests); the full login → guard → portal journey is still verified manually. |
| **No automated accessibility audit** | Checks remain structural and manual. |
| **Dashboards show no real data** | Intentional, but it means the dashboard kit is unproven against real volumes and loading behaviour. |

---

## 7. Technical debt

| ID | Item | Notes |
| --- | --- | --- |
| D1 | **No i18n layer.** | Unchanged from Round 1 and now more urgent — copy has grown. Decide before Phase 2; retrofitting after five phases is expensive. |
| D2 | **No error reporting service.** | `AppErrorBoundary` logs to console. One-line change once a vendor is chosen. |
| D3 | **No E2E tests.** | Highest-value candidate: login → portal redirect → permission guard. |
| D4 | **`exactOptionalPropertyTypes` is off.** | Fights react-hook-form/Zod generics. Revisit after their next majors. |
| D5 | **`Toaster` is wired but unused.** | Intentional: mutations arrive with the first CRUD module. |
| D6 | **Mock endpoint permission enforcement has one exercise path.** | Now that all roles hold `notifications.view`, the 403 path is covered via the demo-state control rather than a role that lacks the permission. Regains coverage naturally with the first management-only endpoint. |

Resolved since Round 1: route-level code splitting, search debounce, untested
primitives, dark-mode duplication.

---

## 8. Backend dependencies

Unchanged in substance from Round 1; every item is marked
`TBD — BACKEND CONTRACT` in code.

**Contract** — endpoint paths/payloads for every domain; error envelope shape;
pagination field names; list query parameter names; session transport (bearer
vs httpOnly cookie) and refresh strategy.

**Authorization** — the authoritative permission catalogue and role mapping;
RLS scoping so a parent receives only linked students (§8) and faculty
attendance rights are limited to assigned batches (§6). The frontend must never
infer either.

**Domain** — application/admission state machines (§16); authoritative fee
balances (§39); notification delivery and read/unread semantics (§25);
certificate storage and signed URLs (§24); audit log shape.

**New this round** — a global **record search** endpoint. The header search
currently covers navigation only; the UI is ready to add a "Records" group.

---

## 9. Deferred decisions

| Decision | Deferred until | Why |
| --- | --- | --- |
| i18n library | Before Phase 2 | Needs a business answer on supported languages. |
| Optimistic updates / mutation patterns | First CRUD module | No mutation exists; guessing now risks the wrong pattern. |
| Virtualised tables | A list exceeding ~200 rows per page | Server pagination makes this unlikely. |
| Splitting the portals into separate builds | If bundle size or release cadence diverges | Portal folders have no cross-imports; the split stays cheap. |
| Error reporting vendor | Before first staging deployment | — |

---

## 10. Final assessment

**PASS WITH FIXES.** Two specification conformance failures and eleven
implementation weaknesses were found; all thirteen are fixed and verified.

Against the Round 2 quality gate, all sixteen questions answer YES. The two
that were weakest in Round 1 — "can all future pages reuse the global UI
system?" and "is responsive behaviour part of the architecture?" — are now
backed by a complete token system, a shell that both portals share by
configuration, and a dashboard vocabulary that did not previously exist.

The foundation's defining property is unchanged and was preserved throughout:
**adding a module touches `features/` and one route entry, and nothing in
`app/`, `lib/` or `shared/`.** Every change in this round strengthened shared
infrastructure rather than working around it.
