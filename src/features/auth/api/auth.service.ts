import { apiClient } from '@/lib/api';
import type { AuthenticatedIdentity, LoginCredentials, RequestOptions, Session } from '@/shared/types';
import { authContract, type CurrentUserResponse } from './auth.contract';

/**
 * Auth service — the only module that talks to the auth endpoints.
 *
 * Services translate between the API contract and the application's domain
 * types. If the backend renames a field, the mapping changes here and nothing
 * upstream notices.
 */

function toIdentity(response: CurrentUserResponse): AuthenticatedIdentity {
  return {
    user: response.user,
    profile: response.profile,
    role: response.role,
    permissions: response.permissions,
  };
}

export const authService = {
  async login(credentials: LoginCredentials, options?: RequestOptions): Promise<Session> {
    const response = await apiClient.call(authContract.login, {
      body: credentials,
      options,
    });
    return response.session;
  },

  async logout(options?: RequestOptions): Promise<void> {
    await apiClient.call(authContract.logout, { options });
  },

  /** Fetches user + profile + role + permissions for the current session (§10). */
  async currentIdentity(options?: RequestOptions): Promise<AuthenticatedIdentity> {
    const response = await apiClient.call(authContract.me, { options });
    return toIdentity(response);
  },
};
