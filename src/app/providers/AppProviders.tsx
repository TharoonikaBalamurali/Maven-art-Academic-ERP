import { useEffect, useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/app/query-client';
import { useUiStore } from '@/app/state/ui.store';
import { useAuthStore } from '@/features/auth/auth.store';
import { apiClient, setTokenProvider } from '@/lib/api';
import { Toaster } from '@/shared/ui';

/**
 * Applies the stored theme preference to the document element. `system` removes
 * the attribute so the CSS media query takes over.
 */
function ThemeEffect() {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}

/**
 * Wires the auth layer to the API client, then restores any persisted session.
 *
 * This is the one place that connects the two: the client learns how to get a
 * credential, and the auth store learns when the backend rejected one. Neither
 * imports the other's internals.
 */
function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setTokenProvider(() => useAuthStore.getState().session?.accessToken ?? null);

    // A 401 from ANY endpoint means the session is gone. Handling it centrally
    // is what keeps "session expired" out of every individual caller (§29).
    apiClient.setUnauthorizedHandler(() => {
      useAuthStore.getState().expireSession();
      queryClient.clear();
    });

    void useAuthStore.getState().restore().finally(() => setReady(true));

    return () => apiClient.setUnauthorizedHandler(null);
  }, []);

  // Routes must not render before we know whether a session exists, otherwise
  // a signed-in user reloading a deep link is bounced to /login.
  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeEffect />
      <AuthBootstrap>{children}</AuthBootstrap>
      <Toaster />
    </QueryClientProvider>
  );
}
