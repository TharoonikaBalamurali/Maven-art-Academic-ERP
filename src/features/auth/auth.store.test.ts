import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import type { AuthenticatedIdentity } from '@/shared/types';

const login = vi.fn();
const logout = vi.fn();
const currentIdentity = vi.fn();

vi.mock('./api/auth.service', () => ({
  authService: {
    login: (...args: unknown[]) => login(...args),
    logout: (...args: unknown[]) => logout(...args),
    currentIdentity: (...args: unknown[]) => currentIdentity(...args),
  },
}));

const { useAuthStore } = await import('./auth.store');

const IDENTITY: AuthenticatedIdentity = {
  user: { id: 'u1', email: 'admin@test', status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
  profile: { id: 'p1', userId: 'u1', fullName: 'Test Admin', displayName: 'Test', avatarUrl: null, phone: null },
  role: 'admin',
  permissions: ['students.view', 'students.create'],
};

function futureSession() {
  return { accessToken: 'token-1', expiresAt: new Date(Date.now() + 3_600_000).toISOString() };
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    status: 'unauthenticated',
    session: null,
    identity: null,
    permissionSet: new Set(),
    error: null,
  });
});

describe('auth store', () => {
  it('fetches identity from the backend after login rather than trusting the login response', async () => {
    login.mockResolvedValue(futureSession());
    currentIdentity.mockResolvedValue(IDENTITY);

    await useAuthStore.getState().login({ email: 'admin@test', password: 'password' });

    expect(currentIdentity).toHaveBeenCalledTimes(1);
    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.identity).toEqual(IDENTITY);
    expect(state.permissionSet.has('students.create')).toBe(true);
  });

  it('leaves no session behind when login fails', async () => {
    login.mockRejectedValue(
      new ApiError({ kind: 'unauthorized', message: 'Bad credentials', status: 401 }),
    );

    await expect(
      useAuthStore.getState().login({ email: 'admin@test', password: 'wrong' }),
    ).rejects.toBeInstanceOf(ApiError);

    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.session).toBeNull();
    expect(state.identity).toBeNull();
    expect(state.error).toBe('Bad credentials');
    expect(window.localStorage.getItem('maven-erp.session')).toBeNull();
  });

  it('discards the session when the identity call fails after a successful login', async () => {
    login.mockResolvedValue(futureSession());
    currentIdentity.mockRejectedValue(
      new ApiError({ kind: 'server', message: 'boom', status: 500 }),
    );

    await expect(
      useAuthStore.getState().login({ email: 'admin@test', password: 'password' }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().permissionSet.size).toBe(0);
  });

  it('restores a persisted session by revalidating it with the backend', async () => {
    window.localStorage.setItem('maven-erp.session', JSON.stringify(futureSession()));
    currentIdentity.mockResolvedValue(IDENTITY);

    await useAuthStore.getState().restore();

    expect(currentIdentity).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('ends as unauthenticated when the stored credential is rejected', async () => {
    window.localStorage.setItem('maven-erp.session', JSON.stringify(futureSession()));
    currentIdentity.mockRejectedValue(
      new ApiError({ kind: 'unauthorized', message: 'expired', status: 401 }),
    );

    await useAuthStore.getState().restore();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(window.localStorage.getItem('maven-erp.session')).toBeNull();
  });

  it('does not call the backend when there is nothing stored', async () => {
    await useAuthStore.getState().restore();

    expect(currentIdentity).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('clears identity and permissions on logout even if the API call fails', async () => {
    login.mockResolvedValue(futureSession());
    currentIdentity.mockResolvedValue(IDENTITY);
    await useAuthStore.getState().login({ email: 'admin@test', password: 'password' });

    logout.mockRejectedValue(new ApiError({ kind: 'server', message: 'boom', status: 500 }));
    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.identity).toBeNull();
    expect(state.permissionSet.size).toBe(0);
    expect(window.localStorage.getItem('maven-erp.session')).toBeNull();
  });

  it('expires the session centrally and explains why', async () => {
    login.mockResolvedValue(futureSession());
    currentIdentity.mockResolvedValue(IDENTITY);
    await useAuthStore.getState().login({ email: 'admin@test', password: 'password' });

    useAuthStore.getState().expireSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.error).toMatch(/expired/i);
  });
});
