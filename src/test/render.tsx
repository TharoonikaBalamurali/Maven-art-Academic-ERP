import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/auth.store';
import { toPermissionSet } from '@/features/auth/permissions';
import type { AuthenticatedIdentity, PermissionKey, Role } from '@/shared/types';

export function makeIdentity(
  role: Role,
  permissions: readonly PermissionKey[],
): AuthenticatedIdentity {
  return {
    user: { id: `u-${role}`, email: `${role}@test`, status: 'active', createdAt: '2026-01-01T00:00:00.000Z' },
    profile: {
      id: `p-${role}`,
      userId: `u-${role}`,
      fullName: 'Test User',
      displayName: 'Test',
      avatarUrl: null,
      phone: null,
    },
    role,
    permissions,
  };
}

/** Seeds the auth store as if the backend had returned this identity. */
export function signIn(role: Role, permissions: readonly PermissionKey[]): void {
  useAuthStore.setState({
    status: 'authenticated',
    session: { accessToken: 't', expiresAt: new Date(Date.now() + 3_600_000).toISOString() },
    identity: makeIdentity(role, permissions),
    permissionSet: toPermissionSet(permissions),
    error: null,
  });
}

export function signOut(): void {
  useAuthStore.setState({
    status: 'unauthenticated',
    session: null,
    identity: null,
    permissionSet: new Set(),
    error: null,
  });
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
