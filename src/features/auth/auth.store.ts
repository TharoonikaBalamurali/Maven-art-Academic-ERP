import { create } from 'zustand';
import { toApiError } from '@/lib/api';
import type {
  AuthStatus,
  AuthenticatedIdentity,
  LoginCredentials,
  PermissionKey,
  Session,
} from '@/shared/types';
import { authService } from './api/auth.service';
import { toPermissionSet, type PermissionSet } from './permissions';
import { sessionStorage } from './session-storage';

/**
 * Authentication state (Day 1 steps 9 & 15).
 *
 * This is one of the three state categories in specification §27 and is kept
 * strictly separate from server state (React Query) and UI state (ui.store).
 *
 * Day 1 uses the mock API, but the shape here is exactly what a real backend
 * session produces: the store never invents a user, never derives permissions,
 * and never persists anything except the credential.
 */
export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  identity: AuthenticatedIdentity | null;
  /** Derived once per identity change so guards are O(1) lookups. */
  permissionSet: PermissionSet;
  /** User-facing message from the last failed login attempt. */
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  /** Restores a persisted session on application start. */
  restore: () => Promise<void>;
  /** Called centrally when any request returns 401 (§29 → "Session expired"). */
  expireSession: () => void;
  clearError: () => void;
}

const EMPTY_PERMISSIONS: PermissionSet = new Set<PermissionKey>();

function unauthenticated(): Pick<AuthState, 'status' | 'session' | 'identity' | 'permissionSet'> {
  return {
    status: 'unauthenticated',
    session: null,
    identity: null,
    permissionSet: EMPTY_PERMISSIONS,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'restoring',
  session: null,
  identity: null,
  permissionSet: EMPTY_PERMISSIONS,
  error: null,

  async login(credentials) {
    set({ status: 'authenticating', error: null });
    try {
      const session = await authService.login(credentials);
      sessionStorage.write(session);
      set({ session });

      // Identity is always fetched from the backend, never inferred from the
      // login response — the backend owns role and permissions (§2, §10).
      const identity = await authService.currentIdentity();
      set({
        status: 'authenticated',
        identity,
        permissionSet: toPermissionSet(identity.permissions),
        error: null,
      });
    } catch (caught) {
      const error = toApiError(caught);
      sessionStorage.clear();
      set({ ...unauthenticated(), error: error.message });
      throw error;
    }
  },

  async logout() {
    const hadSession = get().session !== null;
    try {
      if (hadSession) await authService.logout();
    } catch {
      // A failed logout call must still clear the client session.
    } finally {
      sessionStorage.clear();
      set({ ...unauthenticated(), error: null });
    }
  },

  async restore() {
    const stored = sessionStorage.read();
    if (!stored) {
      set({ ...unauthenticated(), error: null });
      return;
    }

    set({ status: 'restoring', session: stored });
    try {
      const identity = await authService.currentIdentity();
      set({
        status: 'authenticated',
        identity,
        permissionSet: toPermissionSet(identity.permissions),
        error: null,
      });
    } catch {
      // Any failure to validate the stored credential means "not signed in".
      sessionStorage.clear();
      set({ ...unauthenticated(), error: null });
    }
  },

  expireSession() {
    if (get().status === 'unauthenticated') return;
    sessionStorage.clear();
    set({ ...unauthenticated(), error: 'Your session has expired. Please sign in again.' });
  },

  clearError() {
    set({ error: null });
  },
}));

/** Token accessor handed to the API client (see AuthProvider). */
export function currentAccessToken(): string | null {
  return useAuthStore.getState().session?.accessToken ?? null;
}
