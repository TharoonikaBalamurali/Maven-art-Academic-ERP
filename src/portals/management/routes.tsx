import type { RouteObject } from 'react-router-dom';
import { RequirePermission } from '@/app/router/guards';
import { lazyRoute } from '@/app/router/lazyRoute';
import { ModulePlaceholder } from '@/portals/shared/ModulePlaceholder';
import type { PermissionKey } from '@/shared/types';

interface ModuleRoute {
  path: string;
  title: string;
  description: string;
  /** Enforced by `RequirePermission`; the backend enforces it again (§12). */
  permission: PermissionKey;
  phase: string;
  /** Route requiring a stronger permission than its list route (§12). */
  create?: { path: string; permission: PermissionKey; title: string };
}

/**
 * Management Portal module routes (§3.1).
 *
 * Every module named in the specification has a route and a guard from Day 1,
 * so adding a module later means replacing a placeholder element — never
 * touching routing, guards or navigation.
 */
const MODULES: readonly ModuleRoute[] = [
  { path: 'students', title: 'Students', description: 'Student records, enrolment and academic history.', permission: 'students.view', phase: 'Phase 2', create: { path: 'students/new', permission: 'students.create', title: 'New Student' } },
  { path: 'parents', title: 'Parents', description: 'Parent records and their linked students.', permission: 'parents.view', phase: 'Phase 2' },
  { path: 'faculty', title: 'Faculty', description: 'Faculty records and batch assignments.', permission: 'faculty.view', phase: 'Phase 2' },
  { path: 'courses', title: 'Courses', description: 'Course catalogue and configuration.', permission: 'courses.view', phase: 'Phase 2' },
  { path: 'batches', title: 'Batches', description: 'Batches, their students, faculty and schedule.', permission: 'batches.view', phase: 'Phase 2' },
  { path: 'timetable', title: 'Timetable', description: 'Day, week, batch, faculty and room views.', permission: 'timetable.view', phase: 'Phase 2' },
  { path: 'attendance', title: 'Attendance', description: 'Attendance for scheduled classes. Only assigned faculty may mark attendance — enforced by the backend.', permission: 'attendance.view', phase: 'Phase 2' },

  { path: 'enquiries', title: 'Enquiries', description: 'Enquiry intake and follow-up.', permission: 'enquiries.view', phase: 'Phase 3' },
  { path: 'applications', title: 'Applications', description: 'Application review and decisions.', permission: 'applications.view', phase: 'Phase 3' },
  { path: 'admissions', title: 'Admissions', description: 'Admission decisions and records.', permission: 'admissions.view', phase: 'Phase 3' },
  { path: 'enrollments', title: 'Enrollments', description: 'Student to course and batch enrolment.', permission: 'enrollments.view', phase: 'Phase 3' },

  { path: 'fee-structures', title: 'Fee Structures', description: 'Fee structure definitions.', permission: 'fee_structures.view', phase: 'Phase 4' },
  { path: 'fee-assignments', title: 'Fee Assignments', description: 'Fees assigned to students.', permission: 'fee_assignments.view', phase: 'Phase 4' },
  { path: 'installments', title: 'Installments', description: 'Installment plans and due dates.', permission: 'installments.view', phase: 'Phase 4' },
  { path: 'payments', title: 'Payments', description: 'Recorded payments and transactions.', permission: 'payments.view', phase: 'Phase 4' },
  { path: 'outstanding', title: 'Outstanding Fees', description: 'Outstanding balances reported by the backend.', permission: 'outstanding.view', phase: 'Phase 4' },
  { path: 'receipts', title: 'Receipts', description: 'Payment receipts.', permission: 'receipts.view', phase: 'Phase 4' },

  { path: 'progress', title: 'Academic Progress', description: 'Assessments, scores and grades.', permission: 'progress.view', phase: 'Phase 5' },
  { path: 'certificates', title: 'Certificates', description: 'Certificates issued from backend storage.', permission: 'certificates.view', phase: 'Phase 5' },
  { path: 'reports', title: 'Reports', description: 'Operational and financial reporting.', permission: 'reports.view', phase: 'Phase 5' },

  { path: 'users', title: 'Users', description: 'User accounts.', permission: 'users.view', phase: 'Phase 5' },
  { path: 'roles', title: 'Roles & Permissions', description: 'Role definitions and permission assignment.', permission: 'roles.view', phase: 'Phase 5' },
  { path: 'audit', title: 'Audit Logs', description: 'Audit trail recorded by the backend.', permission: 'audit.view', phase: 'Phase 5' },
  { path: 'settings', title: 'Settings', description: 'Institution settings.', permission: 'settings.view', phase: 'Phase 5' },
];

export const managementRoutes: RouteObject[] = [
  {
    index: true,
    element: lazyRoute(
      () => import('./pages/ManagementDashboard'),
      (m) => m.ManagementDashboard,
    ),
  },

  {
    // §25: notifications are centralised, so the same feature serves both
    // portals. Reusing the page here is the proof that a feature is portable
    // across portal boundaries.
    path: 'notifications',
    element: (
      <RequirePermission anyOf={['notifications.view']}>
        {lazyRoute(
          () => import('@/features/notifications/components/NotificationsPage'),
          (m) => m.NotificationsPage,
        )}
      </RequirePermission>
    ),
  },

  {
    // Students list — the first real Management module (§14.1). Its create and
    // detail routes remain placeholders (separate units).
    path: 'students',
    element: (
      <RequirePermission anyOf={['students.view']}>
        {lazyRoute(
          () => import('@/features/students/components/StudentsPage'),
          (m) => m.StudentsPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'students/new',
    element: (
      <RequirePermission anyOf={['students.create']}>
        {lazyRoute(
          () => import('@/features/students/components/StudentFormPage'),
          (m) => m.StudentCreatePage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'students/:studentId/edit',
    element: (
      <RequirePermission anyOf={['students.update']}>
        {lazyRoute(
          () => import('@/features/students/components/StudentFormPage'),
          (m) => m.StudentEditPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'students/:studentId',
    element: (
      <RequirePermission anyOf={['students.view']}>
        {lazyRoute(
          () => import('@/features/students/components/StudentDetailPage'),
          (m) => m.StudentDetailPage,
        )}
      </RequirePermission>
    ),
  },

  {
    // Attendance marking workflow (§21) — faculty mark their assigned classes.
    path: 'attendance',
    element: (
      <RequirePermission anyOf={['attendance.view']}>
        {lazyRoute(
          () => import('@/features/attendance/components/AttendancePage'),
          (m) => m.AttendancePage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'batches',
    element: (
      <RequirePermission anyOf={['batches.view']}>
        {lazyRoute(() => import('@/features/batches/components/BatchesPage'), (m) => m.BatchesPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'batches/:batchId',
    element: (
      <RequirePermission anyOf={['batches.view']}>
        {lazyRoute(
          () => import('@/features/batches/components/BatchDetailPage'),
          (m) => m.BatchDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Timetable (§20) — the published weekly schedule with batch/faculty/room views.
    path: 'timetable',
    element: (
      <RequirePermission anyOf={['timetable.view']}>
        {lazyRoute(
          () => import('@/features/timetable/components/TimetablePage'),
          (m) => m.TimetablePage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'faculty',
    element: (
      <RequirePermission anyOf={['faculty.view']}>
        {lazyRoute(() => import('@/features/faculty/components/FacultyPage'), (m) => m.FacultyPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'faculty/:facultyId',
    element: (
      <RequirePermission anyOf={['faculty.view']}>
        {lazyRoute(
          () => import('@/features/faculty/components/FacultyDetailPage'),
          (m) => m.FacultyDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'courses',
    element: (
      <RequirePermission anyOf={['courses.view']}>
        {lazyRoute(() => import('@/features/courses/components/CoursesPage'), (m) => m.CoursesPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'courses/:courseId',
    element: (
      <RequirePermission anyOf={['courses.view']}>
        {lazyRoute(
          () => import('@/features/courses/components/CourseDetailPage'),
          (m) => m.CourseDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Admissions pipeline entry (§15) — the state-machine workflow.
    path: 'enquiries',
    element: (
      <RequirePermission anyOf={['enquiries.view']}>
        {lazyRoute(() => import('@/features/enquiries/components/EnquiriesPage'), (m) => m.EnquiriesPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'enquiries/:enquiryId',
    element: (
      <RequirePermission anyOf={['enquiries.view']}>
        {lazyRoute(
          () => import('@/features/enquiries/components/EnquiryDetailPage'),
          (m) => m.EnquiryDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'applications',
    element: (
      <RequirePermission anyOf={['applications.view']}>
        {lazyRoute(
          () => import('@/features/applications/components/ApplicationsPage'),
          (m) => m.ApplicationsPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'applications/:applicationId',
    element: (
      <RequirePermission anyOf={['applications.view']}>
        {lazyRoute(
          () => import('@/features/applications/components/ApplicationDetailPage'),
          (m) => m.ApplicationDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Admissions (§17) — the offer state machine created on application approval.
    path: 'admissions',
    element: (
      <RequirePermission anyOf={['admissions.view']}>
        {lazyRoute(
          () => import('@/features/admissions/components/AdmissionsPage'),
          (m) => m.AdmissionsPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'admissions/:admissionId',
    element: (
      <RequirePermission anyOf={['admissions.view']}>
        {lazyRoute(
          () => import('@/features/admissions/components/AdmissionDetailPage'),
          (m) => m.AdmissionDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Enrollments (§18) — records created on admission enrolment.
    path: 'enrollments',
    element: (
      <RequirePermission anyOf={['enrollments.view']}>
        {lazyRoute(
          () => import('@/features/enrollments/components/EnrollmentsPage'),
          (m) => m.EnrollmentsPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'enrollments/:enrollmentId',
    element: (
      <RequirePermission anyOf={['enrollments.view']}>
        {lazyRoute(
          () => import('@/features/enrollments/components/EnrollmentDetailPage'),
          (m) => m.EnrollmentDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Fee Structures (§19) — backend-authoritative fee definitions per course.
    path: 'fee-structures',
    element: (
      <RequirePermission anyOf={['fee_structures.view']}>
        {lazyRoute(
          () => import('@/features/fee-structures/components/FeeStructuresPage'),
          (m) => m.FeeStructuresPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'fee-structures/:feeStructureId',
    element: (
      <RequirePermission anyOf={['fee_structures.view']}>
        {lazyRoute(
          () => import('@/features/fee-structures/components/FeeStructureDetailPage'),
          (m) => m.FeeStructureDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Fee Assignments (§20) — fees applied to students; balances from the backend.
    path: 'fee-assignments',
    element: (
      <RequirePermission anyOf={['fee_assignments.view']}>
        {lazyRoute(
          () => import('@/features/fee-assignments/components/FeeAssignmentsPage'),
          (m) => m.FeeAssignmentsPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'fee-assignments/:feeAssignmentId',
    element: (
      <RequirePermission anyOf={['fee_assignments.view']}>
        {lazyRoute(
          () => import('@/features/fee-assignments/components/FeeAssignmentDetailPage'),
          (m) => m.FeeAssignmentDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Installments (§21) — the backend-owned schedule of part-payments.
    path: 'installments',
    element: (
      <RequirePermission anyOf={['installments.view']}>
        {lazyRoute(
          () => import('@/features/installments/components/InstallmentsPage'),
          (m) => m.InstallmentsPage,
        )}
      </RequirePermission>
    ),
  },
  {
    path: 'installments/:installmentId',
    element: (
      <RequirePermission anyOf={['installments.view']}>
        {lazyRoute(
          () => import('@/features/installments/components/InstallmentDetailPage'),
          (m) => m.InstallmentDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Payments (§22) — recorded transactions; recording needs payments.create.
    path: 'payments',
    element: (
      <RequirePermission anyOf={['payments.view']}>
        {lazyRoute(() => import('@/features/payments/components/PaymentsPage'), (m) => m.PaymentsPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'payments/:paymentId',
    element: (
      <RequirePermission anyOf={['payments.view']}>
        {lazyRoute(
          () => import('@/features/payments/components/PaymentDetailPage'),
          (m) => m.PaymentDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Outstanding Fees (§23) — the backend's outstanding-balance report.
    path: 'outstanding',
    element: (
      <RequirePermission anyOf={['outstanding.view']}>
        {lazyRoute(() => import('@/features/outstanding/components/OutstandingPage'), (m) => m.OutstandingPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'outstanding/:outstandingId',
    element: (
      <RequirePermission anyOf={['outstanding.view']}>
        {lazyRoute(
          () => import('@/features/outstanding/components/OutstandingDetailPage'),
          (m) => m.OutstandingDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Receipts (§24) — backend-issued receipts for recorded payments.
    path: 'receipts',
    element: (
      <RequirePermission anyOf={['receipts.view']}>
        {lazyRoute(() => import('@/features/receipts/components/ReceiptsPage'), (m) => m.ReceiptsPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'receipts/:receiptId',
    element: (
      <RequirePermission anyOf={['receipts.view']}>
        {lazyRoute(
          () => import('@/features/receipts/components/ReceiptDetailPage'),
          (m) => m.ReceiptDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Academic Progress (§26) — assessment results; grades computed by the backend.
    path: 'progress',
    element: (
      <RequirePermission anyOf={['progress.view']}>
        {lazyRoute(() => import('@/features/progress/components/ProgressPage'), (m) => m.ProgressPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'progress/:progressId',
    element: (
      <RequirePermission anyOf={['progress.view']}>
        {lazyRoute(
          () => import('@/features/progress/components/ProgressDetailPage'),
          (m) => m.ProgressDetailPage,
        )}
      </RequirePermission>
    ),
  },
  {
    // Certificates (§27) — backend-issued documents; issuing needs certificates.issue.
    path: 'certificates',
    element: (
      <RequirePermission anyOf={['certificates.view']}>
        {lazyRoute(() => import('@/features/certificates/components/CertificatesPage'), (m) => m.CertificatesPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'certificates/:certificateId',
    element: (
      <RequirePermission anyOf={['certificates.view']}>
        {lazyRoute(
          () => import('@/features/certificates/components/CertificateDetailPage'),
          (m) => m.CertificateDetailPage,
        )}
      </RequirePermission>
    ),
  },

  // Modules handled explicitly above; the rest stay placeholders.
  ...MODULES.filter(
    (module) =>
      ![
        'students',
        'attendance',
        'batches',
        'timetable',
        'faculty',
        'courses',
        'enquiries',
        'applications',
        'admissions',
        'enrollments',
        'fee-structures',
        'fee-assignments',
        'installments',
        'payments',
        'outstanding',
        'receipts',
        'progress',
        'certificates',
      ].includes(module.path),
  ).flatMap<RouteObject>(
    (module) => {
    const routes: RouteObject[] = [
      {
        path: module.path,
        element: (
          <RequirePermission anyOf={[module.permission]}>
            <ModulePlaceholder
              title={module.title}
              description={module.description}
              permission={module.permission}
              phase={module.phase}
            />
          </RequirePermission>
        ),
      },
    ];

    if (module.create) {
      routes.push({
        path: module.create.path,
        element: (
          <RequirePermission anyOf={[module.create.permission]}>
            <ModulePlaceholder
              title={module.create.title}
              description={`Creating a ${module.title.toLowerCase().replace(/s$/, '')} requires a stronger permission than viewing the list.`}
              permission={module.create.permission}
              phase={module.phase}
            />
          </RequirePermission>
        ),
      });
    }

    return routes;
  }),
];
