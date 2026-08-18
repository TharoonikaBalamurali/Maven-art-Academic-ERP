import type { ReactNode } from 'react';
import type { PermissionKey } from '@/shared/types';
import { usePermissions } from './hooks';

export interface PermissionGuardProps {
  /** Shorthand for `anyOf={[permission]}`. */
  permission?: PermissionKey;
  anyOf?: readonly PermissionKey[];
  allOf?: readonly PermissionKey[];
  /** Rendered when the requirement is not met. Defaults to nothing. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Conditional rendering by permission (§35).
 *
 *   <PermissionGuard permission="students.create">
 *     <CreateStudentButton />
 *   </PermissionGuard>
 *
 * This hides UI. It does not secure anything — the backend authorizes every
 * request regardless of what the frontend chose to render.
 */
export function PermissionGuard({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { meets } = usePermissions();

  const requirement = {
    anyOf: permission ? [permission, ...(anyOf ?? [])] : (anyOf ?? []),
    allOf: allOf ?? [],
  };

  return <>{meets(requirement) ? children : fallback}</>;
}
