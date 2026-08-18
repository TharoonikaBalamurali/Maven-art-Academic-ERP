import type { Id, IsoDateString, KnownOr, Nullable } from './common';
import type { PermissionKey } from './permission';

/**
 * Roles defined by specification §1. The backend owns role assignment. The
 * frontend uses the role only to choose a portal and to label the UI — never
 * to gate a feature. Feature gating is always permission-based (§11).
 */
export const ROLES = ['admin', 'accounts', 'faculty', 'student', 'parent'] as const;
export type Role = (typeof ROLES)[number];
export type RoleKey = KnownOr<Role>;

/** The two frontend applications defined in §1. */
export type PortalId = 'management' | 'student-parent';

export const MANAGEMENT_ROLES: readonly Role[] = ['admin', 'accounts', 'faculty'];
export const STUDENT_PARENT_ROLES: readonly Role[] = ['student', 'parent'];

export interface User {
  id: Id;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: IsoDateString;
}

/** Human/profile information attached to the account. */
export interface Profile {
  id: Id;
  userId: Id;
  fullName: string;
  displayName: string;
  avatarUrl: Nullable<string>;
  phone: Nullable<string>;
}

/**
 * The session as the frontend sees it.
 *
 * TBD — BACKEND CONTRACT: token transport (httpOnly cookie vs bearer token)
 * is a backend decision. `accessToken` is optional so a cookie-based session
 * requires no frontend change.
 */
export interface Session {
  accessToken?: string;
  expiresAt: IsoDateString;
}

/** Everything the app needs in order to answer "who is signed in". */
export interface AuthenticatedIdentity {
  user: User;
  profile: Profile;
  role: Role;
  permissions: readonly PermissionKey[];
}

export type AuthStatus =
  | 'restoring'
  | 'authenticating'
  | 'authenticated'
  | 'unauthenticated';

export interface LoginCredentials {
  email: string;
  password: string;
}
