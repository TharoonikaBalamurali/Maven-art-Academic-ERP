import type { PermissionKey } from '@/shared/types';

/**
 * Pure permission algebra (Day 1 step 10).
 *
 * These functions are the ONLY way the application asks "may this user…".
 * They are deliberately pure and role-free: gating on `role === 'admin'` is
 * forbidden by specification §11, because the backend RBAC tables — not the
 * frontend — decide what a role can do.
 *
 * This is UX protection. The backend is the security boundary (§2, §35).
 */

export type PermissionSet = ReadonlySet<PermissionKey>;

export function toPermissionSet(permissions: readonly PermissionKey[]): PermissionSet {
  return new Set(permissions);
}

export function hasPermission(granted: PermissionSet, permission: PermissionKey): boolean {
  return granted.has(permission);
}

export function hasAnyPermission(
  granted: PermissionSet,
  permissions: readonly PermissionKey[],
): boolean {
  // An empty requirement means "no permission required" — the item is public
  // to any authenticated user.
  if (permissions.length === 0) return true;
  return permissions.some((permission) => granted.has(permission));
}

export function hasAllPermissions(
  granted: PermissionSet,
  permissions: readonly PermissionKey[],
): boolean {
  if (permissions.length === 0) return true;
  return permissions.every((permission) => granted.has(permission));
}

export interface PermissionRequirement {
  /** Satisfied when the user holds at least one of these. */
  anyOf?: readonly PermissionKey[];
  /** Satisfied when the user holds all of these. */
  allOf?: readonly PermissionKey[];
}

/** Evaluates a requirement. Both clauses must pass when both are supplied. */
export function satisfies(granted: PermissionSet, requirement: PermissionRequirement): boolean {
  return (
    hasAnyPermission(granted, requirement.anyOf ?? []) &&
    hasAllPermissions(granted, requirement.allOf ?? [])
  );
}
