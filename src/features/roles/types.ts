import type { Id } from '@/shared/types';

/**
 * Role & permission types (§ administration).
 *
 * Roles and the permissions granted to each. The mapping is OWNED AND ENFORCED
 * BY THE BACKEND (§12: frontend authorization is UX only). This module surfaces
 * the backend's role definitions read-only; editing is `roles.update` (TBD).
 */
export interface RoleListItem {
  id: Id;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
}

export interface PermissionGroup {
  domain: string;
  permissions: string[];
}

export interface RoleDetail {
  id: Id;
  name: string;
  description: string;
  userCount: number;
  groups: PermissionGroup[];
}
