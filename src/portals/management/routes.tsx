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
        <ModulePlaceholder
          title="New Student"
          description="Creating a student requires a stronger permission than viewing the list."
          permission="students.create"
          phase="Phase 2"
        />
      </RequirePermission>
    ),
  },
  {
    path: 'students/:studentId',
    element: (
      <RequirePermission anyOf={['students.view']}>
        <ModulePlaceholder
          title="Student Details"
          description="Personal, academic, parent, enrolment, attendance, fees, progress and certificates (§14.1)."
          permission="students.view"
          phase="Phase 2"
        />
      </RequirePermission>
    ),
  },

  // The `students` module is handled explicitly above; the rest stay placeholders.
  ...MODULES.filter((module) => module.path !== 'students').flatMap<RouteObject>((module) => {
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
