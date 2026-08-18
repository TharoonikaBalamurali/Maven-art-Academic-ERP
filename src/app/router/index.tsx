import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { managementRoutes } from '@/portals/management/routes';
import { studentParentRoutes } from '@/portals/student-parent/routes';
import { RequireAuth, RequirePortal } from './guards';
import { lazyRoute } from './lazyRoute';
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
 * Every page element is loaded through `lazyRoute`, so a module's code is
 * fetched only when someone navigates to it.
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
        children: [
          {
            element: lazyRoute(
              () => import('@/portals/management/ManagementLayout'),
              (m) => m.ManagementLayout,
            ),
            children: managementRoutes,
          },
        ],
      },
      {
        path: '/portal',
        element: <RequirePortal portal="student-parent" />,
        children: [
          {
            element: lazyRoute(
              () => import('@/portals/student-parent/StudentParentLayout'),
              (m) => m.StudentParentLayout,
            ),
            children: studentParentRoutes,
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
