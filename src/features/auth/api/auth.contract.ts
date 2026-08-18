import { endpoint } from '@/lib/api';
import type { LoginCredentials, PermissionKey, Profile, Role, Session, User } from '@/shared/types';

/**
 * Auth API contract (§10, §40).
 *
 * TBD — BACKEND CONTRACT: paths and payload shapes are provisional. When the
 * backend API document lands, this file and `auth.mapper.ts` are the only files
 * that change — services, hooks and components stay as they are.
 */

export interface LoginResponse {
  session: Session;
}

export interface CurrentUserResponse {
  user: User;
  profile: Profile;
  role: Role;
  permissions: readonly PermissionKey[];
}

export const authContract = {
  login: endpoint<LoginCredentials, LoginResponse>({
    method: 'POST',
    path: '/auth/login',
    auth: false,
  }),
  logout: endpoint<void, null>({
    method: 'POST',
    path: '/auth/logout',
    auth: true,
  }),
  /** Identity, role and permissions in one round trip (§10). */
  me: endpoint<void, CurrentUserResponse>({
    method: 'GET',
    path: '/auth/me',
    auth: true,
  }),
} as const;
