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
| Faculty — list + detail | `/management/faculty`, `/faculty/:id` | `faculty.view` | **DONE** — list (search/sort/pagination); detail shows assigned batches + subjects, batches link to their record (§6) |
| Courses — list + detail | `/management/courses`, `/courses/:id` | `courses.view` | **DONE** — list (search/sort/pagination); detail shows the course's batches linking to their record (§19) |
| Batches — list | `/management/batches` | `batches.view` | **DONE** — server search/filter(course,status)/sort/pagination; Batch/Course/Faculty/Section/Students/Status columns |
| Batches — details | `/management/batches/:id` | `batches.view` | **DONE** — relational (§19): Course/Faculty/Section/enrolment as distinct facts; Students + Schedule tabs; roster links to student records |
| Timetable | `/management/timetable` | `timetable.view` | **DONE** — published weekly grid (Mon–Fri day columns); Batch / Faculty / Room views via server-side filters (§20); frontend lays out, never computes the schedule |
| Attendance | `/management/attendance` | `attendance.view` / `attendance.mark` | **DONE** — faculty marking workflow (§21): only the caller's assigned classes (no batch picker), roster present/absent + submit; backend authorises per class (§6); read-only for view-only users; empty state for the unassigned |
| Enquiries — list + detail | `/management/enquiries`, `/enquiries/:id` | `enquiries.view` / `enquiries.update` | **DONE** — state-machine workflow (§15–§18): list with stage filter; detail with follow-up timeline and **actions rendered only from backend `availableActions` ∩ permission**; convert/close/reopen/log-followup; backend rejects illegal transitions (409) |
| Applications — list + detail | `/management/applications`, `/applications/:id` | `applications.view` / `applications.review` | **DONE** — review + admission-decision state machine (§16): list with stage filter; detail renders submit/start-review/approve/reject **only from backend `availableActions` ∩ permission**; approve/reject capture an optional note via dialog; approval yields an `adm-…` admission link; backend rejects illegal transitions (409) |
| Admissions — list + detail | `/management/admissions`, `/admissions/:id` | `admissions.view` / `admissions.approve` | **DONE** — offer state machine (§17): created on application approval (§16 → §17 handoff); list with stage filter; detail renders confirm/enroll/cancel **only from backend `availableActions` ∩ permission**; enrol/cancel capture an optional note via dialog; enrolment yields an `enr-…` enrollment link; backend rejects illegal transitions (409) |
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
| batches | `batches.contract.ts` | list, get | DONE — list + relational detail (course/faculty/schedule/students kept separate, §19) |
| timetable | `timetable.contract.ts` | list (batch/faculty/room filters), options | DONE — published weekly schedule, laid out not computed (§20) |
| faculty | `faculty.contract.ts` | list, get | DONE — list + detail (assigned batches, subjects) |
| courses | `courses.contract.ts` | list, get | DONE — list + detail (batches under the course) |
| enquiries | `enquiries.contract.ts` | list, get, addFollowup, convert, close, reopen | DONE — backend-owned state machine; availableActions drive the UI (§15–§18) |
| applications | `applications.contract.ts` | list, get, submit, startReview, approve, reject | DONE — backend-owned review state machine; availableActions drive the UI; approval creates an admission (§16) |
| admissions | `admissions.contract.ts` | list, get, confirm, enroll, cancel | DONE — backend-owned offer state machine; availableActions drive the UI; enrolment creates an enrollment (§17) |
| parents, enrollments, fees, payments, progress, certificates | — | — | NOT STARTED (Phase 3+) |

---

## Cross-cutting guarantees (must hold in every future module)

| Guarantee | Where enforced today |
| --- | --- |
| Frontend never bypasses backend authorization (§39) | Guards are UX-only; backend re-checks every request. |
| No institutional business rules in frontend | No balance/schedule/result computation anywhere. |
| Faculty attendance limited to assigned batches (§6) | To enforce in the Attendance module: no global batch picker. |
| Parent sees only linked children (§8) | To enforce in Phase 6: child list from backend, never an arbitrary id. |
| Buttons = state + permission (§16) | Enforced in Enquiries, Applications and Admissions; to extend to Enrollments. |
| Server-side search/filter/pagination (§31, §32) | `useListQueryState` + backend metadata; proven in Notifications. |

---

_Update this file as each module moves PLACEHOLDER → PARTIAL → DONE. A row
reaches DONE only when its functional, UX, responsive and permission
requirements are all met._
