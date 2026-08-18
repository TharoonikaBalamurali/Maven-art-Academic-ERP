# Day 1 Architecture Review

Performed after implementation, before declaring Day 1 complete. The review is
deliberately critical: the point is to find what would force a rewrite later,
not to confirm that the app runs.

---

## 1. Quality gate

| # | Question | Verdict | Evidence / caveat |
| --- | --- | --- | --- |
| 1 | Future modules addable without restructuring the core? | **Yes** | A module is one folder under `features/` plus one route entry. `DEVELOPMENT.md` documents the 9-step recipe; the Notifications slice proves it end to end. |
| 2 | All five roles on one architecture? | **Yes** | Two shells, one nav filter, one guard stack. Verified in-browser for Admin, Faculty and Parent. |
| 3 | Permissions extendable without duplicated logic? | **Yes** | One pure module; `PermissionKey` accepts unknown backend strings, so new permissions need no frontend release. |
| 4 | Mock → real API without rewriting components? | **Yes** | Transport swap behind `VITE_API_MODE`. An ESLint rule prevents any component importing `@/mocks`. |
| 5 | Server / auth / UI state separated? | **Yes** | React Query, `auth.store`, `ui.store`. No server payload is written to a store. |
| 6 | Tables, forms, pagination, filters reusable? | **Yes** | `DataTable`, `Pagination`, `useListQueryState`, `useApiForm` are all domain-agnostic. |
| 7 | Large datasets via server-side paging/filtering? | **Yes** | `ListQuery` → backend; `Pagination` consumes backend metadata and never slices. Verified: page 2 of 47 records fetched 10 rows. |
| 8 | Student/Parent portal mobile-friendly? | **Yes** | Bottom tab bar, card fallback for tables, native pickers. Verified at 375px: no horizontal overflow, 10 cards instead of a table. |
| 9 | Management portal desktop-first? | **Yes** | Persistent collapsible sidebar ≥1024px, drawer below. |
| 10 | Real backend auth droppable in later? | **Yes** | Service + store boundary; cookie-based sessions need only the removal of token handling (`credentials: 'include'` already set). |
| 11 | Backend permissions replace mock permissions? | **Yes** | Permissions are only ever read from `/auth/me`; the mock map lives solely in `src/mocks/fixtures.ts`. |
| 12 | API errors normalized? | **Yes** | Single `ApiError`, §29 status mapping, raw backend text never rendered. 12 unit tests. |
| 13 | Loading/error/empty/forbidden reusable? | **Yes** | `DataStates` + `QueryBoundary`; all four verified in-browser via the demo-state selector. |
| 14 | Project testable? | **Yes** | 70 tests across 9 files: permissions, nav filtering, error mapping, API client, session storage, auth store, mock API, route guards, forms. |
| 15 | Production-buildable and deployable? | **Yes** | `npm run build` succeeds; static output plus SPA fallback. |
| 16 | Environment variables separated? | **Yes** | `config/env.ts` is the only reader and fails fast on misconfiguration. |
| 17 | Secrets protected? | **Yes** | `.env*` git-ignored except `.env.example`; no credentials in source. The mock password is a fixture, shown only when `VITE_API_MODE=mock`. |
| 18 | Circular dependencies? | **No** | Dependency direction is one-way: `portals → features → shared/lib → types`. `lib/api → mocks` is the single intentional edge, and mocks import only `lib/api` types. |
| 19 | Unnecessary abstractions? | **One** | `Tabs` is built but not yet used by any page — see Debt D3. |
| 20 | Unnecessary dependencies? | **No** | 11 runtime dependencies, each mapped to a named requirement. No UI kit, no date library, no state library duplication. |
| 21 | Giant components? | **No** | Largest is `NotificationsPage` (~230 lines) and it is the deliberate reference implementation; the shell is split into AppShell / AppHeader / SidebarNav. |
| 22 | Hard-coded role checks? | **No** | `grep -r "role ===" src` returns nothing. The role is used only by `portalForRole()` and for display labels. |
| 23 | API calls inside presentation components? | **No** | Components use hooks; only services import `apiClient`. |
| 24 | Backend business rules in the frontend? | **No** | No balance calculation, no attendance eligibility, no admission decision logic. Frontend validation is presence/shape only. |
| 25 | Would adding Students tomorrow change the core? | **No** | Route, guard, nav entry and permission already exist; only the page element is replaced. |

**Gate result: pass.** No question required a foundation fix. Two issues found
during review were fixed before sign-off (see §4).

---

## 2. Strengths

* **The mock boundary is enforced by tooling, not discipline.** The single most
  common failure mode of "we'll swap the mock later" is mock details leaking
  into components. Here, that leak is a lint error.
* **Permission checks are pure and centralised**, and permissions are re-fetched
  from the backend on every reload. Nothing security-relevant is read from
  storage.
* **Errors are normalized once.** No page will ever branch on a status code, and
  no backend message can reach a user verbatim.
* **List state lives in the URL**, which makes server-side pagination the natural
  path and client-side filtering the awkward one — the right way round for an ERP.
* **Accessibility is structural**: labels and error wiring come from `Field`, so
  a developer cannot easily build an unlabelled input.

---

## 3. Weaknesses, risks and technical debt

| ID | Item | Severity | Notes |
| --- | --- | --- | --- |
| D1 | **No route-level code splitting.** Every portal's routes are imported eagerly; the entry chunk grows with each module. | Medium | Vendor chunks are split, so today's bundle is fine (~87 kB gzip React vendor). Seam: the two `routes.tsx` files convert to React Router `lazy()` with no other change. Do this when the first three real modules land. |
| D2 | **Search requires submit.** The search box applies on Enter, not as you type. | Low | Deliberate — it avoids a request per keystroke while no debounce utility exists. Add a `useDebouncedValue` hook when the first real list ships. |
| D3 | **`Tabs` is unused.** Built because §34 lists it; no page needs it yet. | Low | Tested only indirectly. Either the Student detail view (Phase 2) uses it, or delete it. Do not let unused primitives accumulate. |
| D4 | **No i18n layer.** All copy is inline English. | Medium | Cost grows with every module. Decide before Phase 2 whether the institution needs Tamil/other languages; retrofitting after five phases is expensive. |
| D5 | **No error reporting.** `AppErrorBoundary` only calls `console.error`. | Low | One-line change once a service (Sentry or equivalent) is chosen. |
| D6 | **No end-to-end tests.** Coverage is unit + component only; the browser verification in this Day 1 was manual. | Medium | The login → portal → guard flow is the highest-value E2E candidate. Add Playwright once the real backend or a stable mock server exists. |
| D7 | **Session-expiry message is suppressed at startup.** A stale credential on load sends the user to `/login` with no explanation. | Low | Deliberate: an old token on first load is not "your session just expired". Mid-session 401 does show the message (`expireSession`, unit-tested). Revisit if users report confusion. |
| D8 | **Accessibility not audited with a tool.** Checks were manual and structural. | Low | Add `vitest-axe` or an axe pass in E2E before Phase 6, when the mobile portal becomes user-facing. |
| D9 | **`exactOptionalPropertyTypes` is off.** | Low | Enabling it currently fights react-hook-form and Zod generics. Revisit after their next majors. |
| D10 | **`Toaster` is wired but nothing raises a toast yet.** | Low | Intentional: mutations arrive with the first CRUD module. |

---

## 4. Issues found during review and fixed

1. **Notification permission leaked into management roles.** The mock fixtures
   granted `portal.notifications.view` to Admin/Accounts/Faculty, which made the
   endpoint's permission check untestable and contradicted §36 (the Management
   sidebar has no Notifications entry). Removed; a test now asserts that a
   Faculty session receives 403 from `/notifications`.
2. **Header icon buttons were 36px tall** — below the 44px touch target the
   responsive foundation promises. Raised to 44px and re-verified at tablet width.

---

## 5. Deferred decisions

| Decision | Deferred until | Why |
| --- | --- | --- |
| Route-level code splitting | First three real modules | Premature while the app is small; the seam is known. |
| i18n library | Before Phase 2 | Needs a business answer about supported languages. |
| Optimistic updates / mutation patterns | First CRUD module | No mutation exists yet; inventing the pattern now risks guessing wrong. |
| Virtualised tables | When a real list exceeds ~200 rows per page | Server pagination makes this unlikely. |
| Splitting the two portals into separate builds | If bundle size or release cadence diverges | Portal folders have no cross-imports, so the split stays cheap. |
| Error reporting vendor | Before first staging deployment | — |

---

## 6. Backend dependencies

Everything below must come from the backend; the frontend deliberately does not
implement it. Provisional items are marked `TBD — BACKEND CONTRACT` in code.

**Contract-level**

1. Authoritative endpoint paths, methods and payloads for every domain
   (`*.contract.ts` currently guesses).
2. Error envelope shape — field name for messages, codes and per-field errors
   (`parseErrorBody` in `http-transport.ts`).
3. Pagination response field names (`page`, `limit`, `total`, `totalPages` assumed).
4. List query parameter names for search/sort/filter.
5. Session transport: bearer token vs. httpOnly cookie, refresh strategy, TTL.

**Authorization**

6. The real permission catalogue and role→permission mapping. The frontend
   catalogue in `shared/types/permission.ts` mirrors §11 and must be reconciled;
   any permission not in the RBAC tables has no effect.
7. RLS scoping — in particular that a parent receives data only for linked
   students (§8) and that faculty attendance rights are scoped to assigned
   batches (§6). The frontend must never infer either.

**Domain**

8. Application/admission state machines and which transitions are legal (§16) —
   the frontend renders the buttons the backend says are available.
9. Authoritative fee balances and outstanding amounts (§39).
10. Notification delivery and read/unread mutation semantics (§25).
11. Certificate storage and signed download URLs (§24).
12. Audit log shape (§3.1).

---

## 7. Conclusion

The foundation meets the Day 1 definition of done. The highest-value follow-ups,
in order, are **D6 (E2E coverage of the auth/guard flow)**, **D4 (i18n decision
before module copy multiplies)** and **D1 (code splitting once modules land)**.
None of the three requires changing the architecture — which is the outcome the
quality gate was checking for.
