import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '@/features/auth/hooks';
import { homePathForRole, portalForRole } from '@/features/auth/portal';
import { useAuthStore } from '@/features/auth/auth.store';
import type { PermissionKey, PortalId } from '@/shared/types';
import { ForbiddenPage } from '@/app/router/pages/ForbiddenPage';

/**
 * Route protection (Day 1 step 7, specification §12).
 *
 * Three composable layers, applied as route elements:
 *   RequireAuth      — is there a session at all?
 *   RequirePortal    — does this role belong to this application? (§1)
 *   RequirePermission— does the backend-granted permission set allow this page?
 *
 * All three are UX. The backend re-checks every request regardless (§2, §35).
 */

export function RequireAuth() {
  const { isAuthenticated, status } = useAuth();
  const location = useLocation();

  if (status === 'restoring' || status === 'authenticating') {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <p className="text-body text-[var(--text-muted)]">Checking your session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // `from` lets the login page return the user to where they were headed.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function RequirePortal({ portal }: { portal: PortalId }) {
  const role = useAuthStore((state) => state.identity?.role);
  if (!role) return <Navigate to="/login" replace />;

  // A student reaching /management is not "forbidden" so much as in the wrong
  // application; send them to their own portal rather than showing a 403.
  if (portalForRole(role) !== portal) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return <Outlet />;
}

export interface RequirePermissionProps {
  anyOf?: readonly PermissionKey[];
  allOf?: readonly PermissionKey[];
  children?: ReactNode;
}

export function RequirePermission({ anyOf, allOf, children }: RequirePermissionProps) {
  const { meets } = usePermissions();

  if (!meets({ anyOf: anyOf ?? [], allOf: allOf ?? [] })) {
    // Specification §12: unauthorized access renders a 403 experience rather
    // than a half-rendered page.
    return <ForbiddenPage />;
  }

  return <>{children ?? <Outlet />}</>;
}
