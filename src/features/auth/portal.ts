import { MANAGEMENT_ROLES, type PortalId, type Role } from '@/shared/types';

/**
 * Which of the two applications (§1) a role belongs to.
 *
 * This is the one legitimate use of the role: choosing an application shell and
 * a landing route. It is navigation, not authorization — every page inside a
 * portal is still gated on permissions.
 */
export function portalForRole(role: Role): PortalId {
  return MANAGEMENT_ROLES.includes(role) ? 'management' : 'student-parent';
}

export const PORTAL_ROOT: Record<PortalId, string> = {
  management: '/management',
  'student-parent': '/portal',
};

export function homePathForRole(role: Role): string {
  return PORTAL_ROOT[portalForRole(role)];
}
