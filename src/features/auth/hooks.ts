import { useCallback, useMemo } from 'react';
import type { PermissionKey } from '@/shared/types';
import { useAuthStore } from './auth.store';
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  satisfies,
  type PermissionRequirement,
} from './permissions';
import { portalForRole } from './portal';

/** Current authentication state. Selectors keep re-renders narrow. */
export function useAuth() {
  const status = useAuthStore((state) => state.status);
  const identity = useAuthStore((state) => state.identity);
  const error = useAuthStore((state) => state.error);

  return {
    status,
    identity,
    error,
    isAuthenticated: status === 'authenticated',
    isBusy: status === 'restoring' || status === 'authenticating',
  };
}

export function useAuthActions() {
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);
  return { login, logout, clearError };
}

/** The signed-in user's identity. Throws if used outside an authenticated tree. */
export function useCurrentIdentity() {
  const identity = useAuthStore((state) => state.identity);
  if (!identity) {
    throw new Error('useCurrentIdentity must be used inside an authenticated route.');
  }
  return identity;
}

export function useCurrentPortal() {
  const role = useAuthStore((state) => state.identity?.role);
  return role ? portalForRole(role) : null;
}

/**
 * Permission checks for components (Day 1 step 10).
 *
 * Always prefer these over inspecting the role. UX only — the backend enforces.
 */
export function usePermissions() {
  const permissionSet = useAuthStore((state) => state.permissionSet);

  const can = useCallback(
    (permission: PermissionKey) => hasPermission(permissionSet, permission),
    [permissionSet],
  );
  const canAny = useCallback(
    (permissions: readonly PermissionKey[]) => hasAnyPermission(permissionSet, permissions),
    [permissionSet],
  );
  const canAll = useCallback(
    (permissions: readonly PermissionKey[]) => hasAllPermissions(permissionSet, permissions),
    [permissionSet],
  );
  const meets = useCallback(
    (requirement: PermissionRequirement) => satisfies(permissionSet, requirement),
    [permissionSet],
  );

  return useMemo(
    () => ({ permissionSet, can, canAny, canAll, meets }),
    [permissionSet, can, canAny, canAll, meets],
  );
}
