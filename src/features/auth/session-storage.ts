import type { Session } from '@/shared/types';

const STORAGE_KEY = 'maven-erp.session';

/**
 * Persists ONLY the session credential — never the role, never the permissions,
 * never the profile.
 *
 * Specification §39 forbids trusting role information from local storage. On
 * every reload the identity is re-fetched from `/auth/me`, so tampering with
 * storage can at most produce an invalid token, which the backend rejects.
 *
 * TBD — BACKEND CONTRACT: if the backend issues an httpOnly cookie instead of a
 * bearer token, `read()` returns null, `hasStoredSession()` is replaced by an
 * optimistic restore attempt, and nothing else in the app changes.
 */
export const sessionStorage = {
  read(): Session | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return null;

      const record = parsed as Partial<Session>;
      if (typeof record.expiresAt !== 'string') return null;
      if (Number.isNaN(Date.parse(record.expiresAt))) return null;
      if (Date.parse(record.expiresAt) <= Date.now()) {
        // Expired before we even started — do not attempt to use it.
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return {
        expiresAt: record.expiresAt,
        ...(typeof record.accessToken === 'string' ? { accessToken: record.accessToken } : {}),
      };
    } catch {
      // Corrupt or unavailable storage must never break application startup.
      return null;
    }
  },

  write(session: Session): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Private-mode / quota failures degrade to a session that ends on reload.
    }
  },

  clear(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing useful to do.
    }
  },
};
