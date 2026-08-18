# Frontend Audit — against the Master Engineering Directive & the PDF

Performed as the mandatory first action of the Master Directive. **No code was
changed during this audit** (per the directive; only read-only inspection and
the existing verification pipeline were run).

- Repository state: commit `63dd6ba`, working tree clean.
- Baseline (from the immediately preceding verified run, unchanged since):
  **107 tests passing**, typecheck clean, lint clean, production build succeeds.
- Source: 95 files; tests: 14 suites.

The project has completed **Phase 1 (Shared Frontend Foundation)** plus a single
end-to-end reference feature (Notifications). Phases 2–7 are route/guard/nav
placeholders by design.

---

## A. Already correct (preserve as-is)

| Area | Evidence |
| --- | --- |
| **Two-application architecture (§1)** | `src/portals/management` and `src/portals/student-parent` over shared infrastructure, no cross-imports. Management = Admin/Accounts/Faculty; Portal = Student/Parent. |
| **Backend-driven authorization (§2)** | Permissions come only from `/auth/me`; `session-storage` persists the credential and nothing else; identity re-fetched every reload. `grep "role ===" src` returns only a comment. |
| **Permission architecture (§11, §35)** | Pure `hasPermission/hasAnyPermission/hasAllPermissions/satisfies`; `PermissionGuard` for UI; `RequirePermission` for routes; nav filtered by permission. `PermissionKey` accepts backend-added strings. |
| **Layered route protection (§12)** | `RequireAuth → RequirePortal → RequirePermission`; real 403 and 404 pages; list vs. create permission distinction (`/students` vs `/students/new`). |
| **Centralized API layer (§26)** | `Component → Hook → Service → ApiClient → Transport`. An ESLint rule forbids importing `@/mocks` anywhere but the transport, so mock→real is one env var. |
| **Normalized errors (§29)** | Single `ApiError` with the exact 400/401/403/404/409/422/500 mapping; raw backend text never surfaced. 401 handled centrally. |
| **State separation (§27)** | Server = TanStack Query; auth = `auth.store`; UI = `ui.store`. No server payload copied into a store. |
| **Server-driven lists (§31, §32)** | `useListQueryState` holds page/search/sort/filter in the URL; `Pagination` consumes backend metadata; debounced search. Proven by the Notifications feature. |
| **Universal data states (§28)** | `QueryBoundary` + Loading/Empty/NoResults/Error/Forbidden/NotFound, reachable in-browser via the mock demo-state control. |
| **Design system** | Token layer (colour via `light-dark()`, role-named type scale, radius/elevation), `cn()` token-aware, WCAG AA verified (min 5.25:1 light / 5.39:1 dark). |
| **Accessibility foundation** | Native `<dialog>` overlays, labelled controls, skip link, one `h1`/page, uniquely-named landmarks, reduced-motion honoured. |
| **Environment & deploy** | `env.ts` is the sole `import.meta.env` reader and fails fast; no secrets in source; static build + SPA fallback; `strictPort`. |

---

## B. Partially correct (foundation present, module work remains)

| Area | State | Gap vs directive/PDF |
| --- | --- | --- |
| **Authority experiences** | Two dashboards: one Management (Admin/Accounts/Faculty), one Student/Parent. Both permission-gate their widgets. | The directive requires **five deliberately-designed** experiences and explicitly forbids "one dashboard and hide random widgets". PDF §13 also defines five distinct dashboards. This is the **top Phase-2/6 item**. |
| **API domains** | Contract/service/hook/mock pattern established, but instantiated only for `auth` and `notifications`. | The 14 domain APIs (students, fees, attendance…) do not exist yet. The *pattern* is proven; the *instances* are Phase 2+. |
| **Tables** | `DataTable` supports search/filter/sort/pagination/selection/row-actions/density/mobile-cards. | Only the Notifications list uses it. Student list, payment table, etc. are Phase 2+. |
| **Forms** | `useApiForm` + `FormSection/FormActions` + field primitives with validation/error/loading. | Only the login form exists. Business forms are Phase 2+. |
| **Realistic data** | 5 believable accounts (Aarthi Ramesh, Devi Krishnan…); 47 notifications. | Notification **bodies literally say "Placeholder notification body"** (`fixtures.ts:149`) — the directive bans placeholder data. See §J. |
| **Timetable / Attendance / Admissions / Finance / Progress / Certificates** | Route + guard + nav + status badge. | No module UI. Correct for Phase 1; each carries the constraints in §D. |

---

## C. Conflicts with the PDF

**None.** No implemented behaviour contradicts the PDF. The two documented
deviations are architectural adaptations the specification permits, not
conflicts:

1. **One build, two portal boundaries** (vs. §1 "two independently developed
   applications"). Recorded in ARCHITECTURE.md §1 with rationale and a cheap
   reversal path (the portal folders have no cross-imports).
2. **API co-located in feature slices** (`features/auth/api/…`) rather than a
   top-level `src/api/`. The directive explicitly allows adapting its example
   structure; feature-slice keeps a domain's contract/service/hook/types/UI
   together and is the stronger long-term shape.

---

## D. Missing requirements (expected — Phases 2–7)

Not defects; scheduled work. Listed with the constraints each must honour so
they are not lost between now and implementation.

| Module | Phase | Non-negotiable constraint from PDF/directive |
| --- | --- | --- |
| Admin / Accounts / Faculty dashboards | 2 | Each purpose-built (§13); Accounts finance-dense, Faculty academic; no shared generic grid. |
| Students (list + details) | 2 | List columns: Register No, Name, Course, Batch, Section, Status, Actions (§14.1). Details tabs: Personal/Academic/Parent/Enrollment/Attendance/Fees/Progress/Certificates. |
| Faculty / Courses / Batches | 2 | Course, Batch, Faculty Assignment, Schedule kept as **separate** concepts (§19). |
| Timetable | 2 | Consume backend schedule; never compute scheduling locally (§20). Views: Day/Week/Batch/Faculty/Room; Faculty = My Schedule; Student = My Timetable. |
| **Attendance** | 2 | **Faculty → Assigned Batch → Scheduled Class → Student List → Mark.** No global "mark attendance for any batch" UI. Backend authorizes (§6, §21). |
| Enquiries → Applications → Admissions → Enrollments | 3 | Buttons driven by **current state + permission**; frontend never decides a transition (§15–§18). |
| Finance (structures/assignments/installments/payments/outstanding/receipts) | 4 | Never compute authoritative balances locally (§22, §39). |
| Progress / Certificates / Reports | 5 | Never compute official results or generate certificates locally (§23, §24). |
| Student/Parent portal pages + **My Children** | 6 | Parent selects a linked child → context switches across the portal; data only for backend-linked students (§8). |
| Real API integration | 7 | Flip `VITE_API_MODE=http`, reconcile `TBD — BACKEND CONTRACT` markers, delete `src/mocks`. |

---

## E. What to preserve (do not touch without cause)

- The API spine and the mock-import ESLint boundary — it is what makes Phase 7 a
  one-variable change.
- The permission algebra and the three-layer guard stack.
- `ApiError` + the §29 mapping.
- State separation (Query / auth store / ui store).
- The token layer and `cn()`'s token-aware merge config (`cn.test.ts` locks it;
  removing it silently breaks the type scale).
- The theme-switch transition suppression in `AppProviders` (removing the forced
  reflows re-pins card backgrounds in dark mode).

---

## F. What should be refactored (small, before Phase 2)

| Item | Why | Size |
| --- | --- | --- |
| Notification fixture bodies | Literal "Placeholder" text violates the realistic-data rule. Replace with believable notification copy. | Trivial |
| `ModulePlaceholder` copy | Fine as scaffolding, but should not be mistaken for delivered UI — already carries a "Placeholder" status badge; keep that discipline. | None (working as intended) |
| Consolidated docs | Directive wants `api-contracts.md`, `permissions.md`, `decisions.md`, `implementation-status.md`. Contracts/permissions/decisions currently live inside ARCHITECTURE/REVIEW; a traceability doc did not exist. Added `REQUIREMENTS.md` this pass. | Doc-only |

---

## G. What should NOT be changed

- Technology stack (Vite/React/TS/Router/Query/Zustand/RHF+Zod/Tailwind). Mature,
  type-safe, deployable; the directive says do not churn a settled stack.
- Portal split, authority model, permission model, API architecture, auth
  architecture. The directive lists all of these as "stop and confirm" items.
- The "no invented authoritative numbers" discipline on dashboards — reconcile
  with the realistic-data rule by using believable data for *demonstrated list
  content*, while authoritative metrics stay backend-sourced (see §J).

---

## H. Recommended implementation order (next)

The directive's foundation order (Design System → Shell → Authority → Permission
→ Routing → API → Mock → Components → UI States → Responsive) is **already
satisfied by Phase 1**. Proceed into Phase 2, smallest coherent unit first:

1. **Realistic mock data pass** (trivial): replace placeholder notification
   bodies; add a believable data seed the Phase-2 modules will read.
2. **Authority dashboards** — Admin, then Accounts, then Faculty, each a
   purpose-built layout (KPIs + operational tables), not a shared widget grid.
3. **Students module** — list (the columns in §14.1) then details tabs. This is
   the honest test that a real module needs nothing from `app/`, `lib/`,
   `shared/`. Add the `students` domain API + mock routes.
4. **Faculty/Courses/Batches/Timetable**, then **Attendance** (the assigned-batch
   flow last, as it depends on batch + schedule).

Do **one** of these per assignment, verify, report, stop.

---

## I. Architectural risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Authority dashboards drifting into "one grid, hidden widgets" | High | Phase 2 must build three distinct Management dashboards; the directive is explicit. Track in `REQUIREMENTS.md`. |
| Mock contract diverging from the eventual backend | Medium | Every provisional shape is marked `TBD — BACKEND CONTRACT`; keep the marker discipline so Phase 7 is a diff, not a hunt. |
| State-machine buttons (admissions/applications) inferred client-side | Medium→High if wrong | Enforce "buttons = current state + permission"; never encode transition rules in the frontend. |
| Permission catalogue drift | Low | `consistency.test.ts` fails if nav/fixtures reference a permission outside the catalogue. |

---

## J. UI/UX issues

| Issue | Severity | Note |
| --- | --- | --- |
| **One dashboard per portal, not per authority** | High | The single largest gap vs this directive. Phase 2. |
| **Placeholder notification bodies** | Medium | Violates the realistic-data rule; trivial fix. |
| **Realistic-data vs invented-metrics tension** | Medium (decision) | Prior work deliberately shows `—` for unbuilt metrics. This directive wants believable data. **Resolution to confirm:** believable data for *demonstrated tables/lists*; authoritative figures (balances, attendance %, results) stay backend-sourced and show an explicit "unavailable" state until wired. This keeps §22/§39 intact. |
| Desktop sidebar rows 40px (< 44px) | Low | Deliberate density for a ~25-item pointer-driven menu; documented. |
| No charts yet | Low | Deferred to Reports (Phase 5); no decorative charts before then, per directive. |

---

## K. Technical risks

| Risk | Severity | Note |
| --- | --- | --- |
| No end-to-end tests | Medium | 107 unit/component tests; the login→guard→portal journey is verified manually. Add Playwright before Phase 7. |
| No automated a11y/visual-regression | Low–Med | Contrast and structure verified by scripted DOM measurement, not a tool. Add `vitest-axe` before the Student/Parent portal ships (Phase 6). |
| `light-dark()` browser floor | Low | Chrome 123+/Safari 17.5+/Firefox 120+. Fine for an institutional web app; older browsers see the light palette, not a break. |
| i18n absent | Medium | Copy is inline English and growing. Decide before Phase 2 or retrofitting multiplies across modules. |
| Bundle growth as modules land | Low | Route-level code splitting already in place (`lazyRoute`); each module is its own chunk. |

---

## Conclusion

Phase 1 is **built, verified and stable**, and satisfies the directive's
foundation-ordering. No PDF conflicts. The dominant forward gap is
**authority-specific dashboards** (Phase 2), followed by the module build-out in
PDF phase order. The immediate, in-scope cleanups are the placeholder-data fix
and the realistic-data/authoritative-metric decision in §J.

Per the directive: audit delivered, **no modules started**, stopping here for the
next instruction.
