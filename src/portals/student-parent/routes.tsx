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

/** Student / Parent Portal routes (§7, §37). Every module is now implemented. */
const MODULES: readonly PortalRoute[] = [];

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
    // My Children (§8) — the parent's linked children; selecting one re-scopes
    // the whole portal to that child.
    path: 'children',
    element: (
      <RequirePermission anyOf={['portal.children.view']}>
        {lazyRoute(() => import('@/features/portal/components/PortalChildrenPage'), (m) => m.PortalChildrenPage)}
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
  {
    // Academic group (§7) — course, timetable, attendance and progress, each
    // scoped by the backend to the caller / selected child.
    path: 'course',
    element: (
      <RequirePermission anyOf={['portal.academic.view']}>
        {lazyRoute(() => import('@/features/portal/components/PortalCoursePage'), (m) => m.PortalCoursePage)}
      </RequirePermission>
    ),
  },
  {
    path: 'timetable',
    element: (
      <RequirePermission anyOf={['portal.timetable.view']}>
        {lazyRoute(() => import('@/features/portal/components/PortalTimetablePage'), (m) => m.PortalTimetablePage)}
      </RequirePermission>
    ),
  },
  {
    path: 'attendance',
    element: (
      <RequirePermission anyOf={['portal.attendance.view']}>
        {lazyRoute(() => import('@/features/portal/components/PortalAttendancePage'), (m) => m.PortalAttendancePage)}
      </RequirePermission>
    ),
  },
  {
    path: 'progress',
    element: (
      <RequirePermission anyOf={['portal.progress.view']}>
        {lazyRoute(() => import('@/features/portal/components/PortalProgressPage'), (m) => m.PortalProgressPage)}
      </RequirePermission>
    ),
  },
  {
    // Finance group (§7) — the caller's fees, payments and certificates.
    path: 'fees',
    element: (
      <RequirePermission anyOf={['portal.fees.view']}>
        {lazyRoute(() => import('@/features/portal/components/PortalFeesPage'), (m) => m.PortalFeesPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'payments',
    element: (
      <RequirePermission anyOf={['portal.payments.view']}>
        {lazyRoute(() => import('@/features/portal/components/PortalPaymentsPage'), (m) => m.PortalPaymentsPage)}
      </RequirePermission>
    ),
  },
  {
    path: 'certificates',
    element: (
      <RequirePermission anyOf={['portal.certificates.view']}>
        {lazyRoute(() => import('@/features/portal/components/PortalCertificatesPage'), (m) => m.PortalCertificatesPage)}
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
