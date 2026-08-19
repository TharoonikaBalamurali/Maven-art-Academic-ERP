import type { RouteObject } from 'react-router-dom';
import { RequirePermission } from '@/app/router/guards';
import { lazyRoute } from '@/app/router/lazyRoute';
import { ModulePlaceholder } from '@/portals/shared/ModulePlaceholder';
import type { PermissionKey } from '@/shared/types';

interface PortalRoute {
  path: string;
  title: string;
  description: string;
  permission: PermissionKey;
  phase: string;
}

/** Student / Parent Portal routes (§7, §37). */
const MODULES: readonly PortalRoute[] = [
  { path: 'children', title: 'My Children', description: 'Students linked to your account. Selecting a student changes the data shown across the portal.', permission: 'portal.children.view', phase: 'Phase 6' },
  { path: 'course', title: 'Course', description: 'Your course and batch information.', permission: 'portal.academic.view', phase: 'Phase 6' },
  { path: 'timetable', title: 'Timetable', description: 'Your scheduled classes.', permission: 'portal.timetable.view', phase: 'Phase 6' },
  { path: 'attendance', title: 'Attendance', description: 'Your attendance record.', permission: 'portal.attendance.view', phase: 'Phase 6' },
  { path: 'progress', title: 'Progress', description: 'Assessments, scores and grades.', permission: 'portal.progress.view', phase: 'Phase 6' },
  { path: 'fees', title: 'Fees', description: 'Total, paid and pending fees with due dates.', permission: 'portal.fees.view', phase: 'Phase 6' },
  { path: 'payments', title: 'Payments', description: 'Your payment history.', permission: 'portal.payments.view', phase: 'Phase 6' },
  { path: 'certificates', title: 'Certificates', description: 'Certificates issued to you.', permission: 'portal.certificates.view', phase: 'Phase 6' },
];

export const studentParentRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <RequirePermission anyOf={['portal.dashboard.view']}>
        {lazyRoute(
          () => import('./pages/StudentParentDashboard'),
          (m) => m.StudentParentDashboard,
        )}
      </RequirePermission>
    ),
  },
  {
    // Implemented on Day 1 as the reference list page for the architecture.
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
    // Profile (§7) — the authenticated student's own record.
    path: 'profile',
    element: (
      <RequirePermission anyOf={['portal.profile.view']}>
        {lazyRoute(
          () => import('@/features/portal/components/PortalProfilePage'),
          (m) => m.PortalProfilePage,
        )}
      </RequirePermission>
    ),
  },
  ...MODULES.map<RouteObject>((module) => ({
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
  })),
];
