import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { ManagementLayout } from '@/portals/management/ManagementLayout';
import { managementRoutes } from '@/portals/management/routes';
import { StudentParentLayout } from '@/portals/student-parent/StudentParentLayout';
import { studentParentRoutes } from '@/portals/student-parent/routes';
import { RequireAuth, RequirePortal } from './guards';
import { NotFoundPage } from './pages/NotFoundPage';
import { RootRedirect } from './pages/RootRedirect';

/**
 * Route architecture (Day 1 step 7).
 *
 *   /login            public
 *   /                 redirects to the portal for the signed-in role
 *   /management/*     Management Portal  — Admin, Accounts, Faculty
 *   /portal/*         Student / Parent Portal
 *   *                 404
 *
 * Protection is layered: RequireAuth → RequirePortal → RequirePermission.
 * Adding a module means adding one entry to a portal's `routes.tsx`; the
 * guards, shell and navigation need no change.
 *
 * Deferred: route-level code splitting. The seam is the two `routes.tsx`
 * files — see docs/frontend/ARCHITECTURE_REVIEW.md.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      { path: '/', element: <RootRedirect /> },
      {
        path: '/management',
        element: <RequirePortal portal="management" />,
        children: [{ element: <ManagementLayout />, children: managementRoutes }],
      },
      {
        path: '/portal',
        element: <RequirePortal portal="student-parent" />,
        children: [{ element: <StudentParentLayout />, children: studentParentRoutes }],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
