# Requirement Traceability

Per the Master Directive. Each PDF requirement is traced to its module,
authority, route, component, API dependency and permission, with an honest
status. A row is **COMPLETED** only when it satisfies functional, UX, responsive
and permission requirements — not merely because a screen renders.

**Status legend:** `DONE` · `PARTIAL` · `PLACEHOLDER` (route+guard+nav only) ·
`NOT STARTED` · `BLOCKED` · `NEEDS CLARIFICATION`

Current state: Phase 1 foundation complete + Notifications reference feature +
**Management authority dashboards (Admin/Accounts/Faculty)**. Remaining
non-foundation modules are `PLACEHOLDER` by design.

---

## Foundation (PDF Phase 1)

| Requirement | Route | Component(s) | API | Permission | Status |
| --- | --- | --- | --- | --- | --- |
| App shell (§9) | all authed | `AppShell`, `AppHeader`, `SidebarNav`, `BrandMark`, `Breadcrumbs` | — | — | DONE |
| Routing + guards (§12) | all | `router`, `RequireAuth/RequirePortal/RequirePermission` | — | per-route | DONE |
| Authentication UI (§10) | `/login` | `LoginPage`, `useApiForm` | `auth.login/logout/me` | none (login) | DONE (mock) |
| Permission system (§11) | — | `permissions.ts`, `PermissionGuard`, nav `filter` | `/auth/me` | — | DONE |
| API client (§26) | — | `ApiClient`, transports, `contract` | all | — | DONE |
| Error handling (§29) | — | `ApiError`, `QueryBoundary` | — | — | DONE |
| Universal states (§28) | — | `LoadingState/EmptyState/NoResultsState/ErrorState/ForbiddenState/NotFoundState` | — | — | DONE |
| Reusable components (§34) | — | Button, Input, Select, DatePicker, Modal, Drawer, Table, Pagination, Badge, Card, Tabs, Dropdown, Toast, Dialog, Tooltip | — | — | DONE |
| Design system | — | `styles/index.css`, `cn`, `DESIGN_SYSTEM.md` | — | — | DONE |
| Dynamic navigation (§36, §37) | — | `management.nav`, `student-parent.nav`, `filterNavSections` | — | per-item | DONE |
| State architecture (§27) | — | React Query, `auth.store`, `ui.store` | — | — | DONE |
| Responsive foundation (§33) | all | `AppShell`, bottom tab bar, `DataTable` mobile cards | — | — | DONE |
| Notifications reference (§25) | `/*/notifications` | `NotificationsPage`, `DataTable`, `Pagination`, `FilterBar` | `notifications.list` | `notifications.view` | DONE |

---

## Management — Dashboards (PDF §13, Phase 2)

| Authority | Route | Component | API | Permission | Status |
| --- | --- | --- | --- | --- | --- |
| Admin dashboard | `/management` | `AdminDashboard` | `dashboard.summary` | per-widget | DONE — operational: KPIs, needs-attention, today's classes, recent admissions |
| Accounts dashboard | `/management` | `AccountsDashboard` | `dashboard.summary` | per-widget (finance) | DONE — financial: collection/outstanding KPIs, transactions + installments tables |
| Faculty dashboard | `/management` | `FacultyDashboard` | `dashboard.summary` | per-widget (academic) | DONE — academic: own schedule, attendance-to-mark, recent attendance |

> Each authority now renders a purpose-built dashboard, selected by role and
> narrowed on the API's discriminated `DashboardSummary`. Every widget is still
> permission-gated. Figures flow through the dashboard API (mock now, real via
> `VITE_API_MODE=http`) and are marked "Demonstration data" in mock mode.
> Faculty figures are scoped to assigned batches only (§6). Verified in-browser
> for all three authorities.

## Management — Core modules (PDF §14, Phases 2–5)

| Module | Route | Permission (view / create) | Status |
| --- | --- | --- | --- |
| Students — **list** | `/management/students` | `students.view` | **DONE** — §14.1 columns, server search/filter(course,status)/sort/pagination, permission-gated New + row actions, all data states |
| Students — details | `/management/students/:id` | `students.view` | **DONE** — 8 deep-linkable tabs (§14.1): Personal/Academic/Parent/Enrollment full; Attendance/Fees/Progress/Certificates backend rollup summaries linking to their module; not-found state |
| Students — create | `/management/students/new` | `students.create` | **DONE** — grouped form, client + server validation, 422 field mapping, success toast → detail |
| Students — edit | `/management/students/:id/edit` | `students.update` | **DONE** — same form prefilled from the record; server 422 mapping |
| Parents | `/management/parents` | `parents.view` | PLACEHOLDER |
| Faculty | `/management/faculty` | `faculty.view` | PLACEHOLDER |
| Courses | `/management/courses` | `courses.view` | PLACEHOLDER |
| Batches | `/management/batches` | `batches.view` | PLACEHOLDER |
| Timetable | `/management/timetable` | `timetable.view` | PLACEHOLDER |
| Attendance | `/management/attendance` | `attendance.view` / `attendance.mark` | **DONE** — faculty marking workflow (§21): only the caller's assigned classes (no batch picker), roster present/absent + submit; backend authorises per class (§6); read-only for view-only users; empty state for the unassigned |
| Enquiries | `/management/enquiries` | `enquiries.view` | PLACEHOLDER |
| Applications | `/management/applications` | `applications.view` | PLACEHOLDER — buttons = state + permission |
| Admissions | `/management/admissions` | `admissions.view` / `admissions.approve` | PLACEHOLDER |
| Enrollments | `/management/enrollments` | `enrollments.view` | PLACEHOLDER |
| Fee Structures | `/management/fee-structures` | `fee_structures.view` | PLACEHOLDER |
| Fee Assignments | `/management/fee-assignments` | `fee_assignments.view` | PLACEHOLDER |
| Installments | `/management/installments` | `installments.view` | PLACEHOLDER |
| Payments | `/management/payments` | `payments.view` / `payments.create` | PLACEHOLDER |
| Outstanding Fees | `/management/outstanding` | `outstanding.view` | PLACEHOLDER |
| Receipts | `/management/receipts` | `receipts.view` | PLACEHOLDER |
| Academic Progress | `/management/progress` | `progress.view` | PLACEHOLDER |
| Certificates | `/management/certificates` | `certificates.view` | PLACEHOLDER |
| Reports | `/management/reports` | `reports.view` | PLACEHOLDER |
| Users | `/management/users` | `users.view` | PLACEHOLDER |
| Roles & Permissions | `/management/roles` | `roles.view` | PLACEHOLDER |
| Audit Logs | `/management/audit` | `audit.view` | PLACEHOLDER |
| Settings | `/management/settings` | `settings.view` | PLACEHOLDER |

## Student / Parent portal (PDF §7–§8, §37, Phase 6)

| Item | Route | Permission | Status |
| --- | --- | --- | --- |
| Dashboard (Student) | `/portal` | `portal.dashboard.view` | PARTIAL — foundation, must be student-specific |
| Dashboard (Parent) | `/portal` | `portal.dashboard.view` + `portal.children.view` | PARTIAL — must be child-centric |
| My Children | `/portal/children` | `portal.children.view` | PLACEHOLDER — child selector → context switch (§8) |
| Course | `/portal/course` | `portal.academic.view` | PLACEHOLDER |
| Timetable | `/portal/timetable` | `portal.timetable.view` | PLACEHOLDER |
| Attendance | `/portal/attendance` | `portal.attendance.view` | PLACEHOLDER |
| Progress | `/portal/progress` | `portal.progress.view` | PLACEHOLDER |
| Fees | `/portal/fees` | `portal.fees.view` | PLACEHOLDER |
| Payments | `/portal/payments` | `portal.payments.view` | PLACEHOLDER |
| Certificates | `/portal/certificates` | `portal.certificates.view` | PLACEHOLDER |
| Notifications | `/portal/notifications` | `notifications.view` | DONE (reference feature) |
| Profile | `/portal/profile` | `portal.profile.view` | PLACEHOLDER |

---

## API domains (PDF §26) — mock coverage

| Domain | Contract | Mock routes | Status |
| --- | --- | --- | --- |
| auth | `auth.contract.ts` | login, logout, me | DONE |
| notifications | `notifications.contract.ts` | list | DONE |
| dashboard | `dashboard.contract.ts` | summary (role-scoped) | DONE |
| students | `students.contract.ts` | list, filter-options, get, create, update | DONE — full CRUD (mock uses an in-memory store so create/edit reflect in list + detail) |
| attendance | `attendance.contract.ts` | todaysClasses, roster, submit | DONE — scoped to the caller's assigned classes; backend authorises marking (§6) |
| parents, faculty, courses, batches, enquiries, applications, admissions, enrollments, fees, payments, progress, certificates | — | — | NOT STARTED (Phase 2+) |

---

## Cross-cutting guarantees (must hold in every future module)

| Guarantee | Where enforced today |
| --- | --- |
| Frontend never bypasses backend authorization (§39) | Guards are UX-only; backend re-checks every request. |
| No institutional business rules in frontend | No balance/schedule/result computation anywhere. |
| Faculty attendance limited to assigned batches (§6) | To enforce in the Attendance module: no global batch picker. |
| Parent sees only linked children (§8) | To enforce in Phase 6: child list from backend, never an arbitrary id. |
| Buttons = state + permission (§16) | To enforce in Admissions/Applications. |
| Server-side search/filter/pagination (§31, §32) | `useListQueryState` + backend metadata; proven in Notifications. |

---

_Update this file as each module moves PLACEHOLDER → PARTIAL → DONE. A row
reaches DONE only when its functional, UX, responsive and permission
requirements are all met._
