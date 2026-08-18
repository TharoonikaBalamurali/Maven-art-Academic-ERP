import { describe, expect, it } from 'vitest';
import { sessionStorage } from './session-storage';

const KEY = 'maven-erp.session';

function future(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

describe('session storage', () => {
  it('round-trips a valid session', () => {
    const session = { accessToken: 'abc', expiresAt: future(60) };
    sessionStorage.write(session);
    expect(sessionStorage.read()).toEqual(session);
  });

  it('supports a cookie-based session with no token', () => {
    sessionStorage.write({ expiresAt: future(60) });
    expect(sessionStorage.read()?.accessToken).toBeUndefined();
  });

  it('discards an expired session instead of returning it', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ accessToken: 'abc', expiresAt: new Date(Date.now() - 1000).toISOString() }),
    );
    expect(sessionStorage.read()).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('ignores corrupt storage rather than breaking startup', () => {
    window.localStorage.setItem(KEY, 'not json at all');
    expect(sessionStorage.read()).toBeNull();
  });

  it('ignores a payload missing the expiry', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ accessToken: 'abc' }));
    expect(sessionStorage.read()).toBeNull();
  });

  it('never persists role or permission information', () => {
    // Specification §39: role data in local storage must not be trusted, so it
    // is not written in the first place.
    sessionStorage.write({ accessToken: 'abc', expiresAt: future(60) });
    const raw = window.localStorage.getItem(KEY) ?? '';
    expect(raw).not.toMatch(/role|permission|admin/i);
  });

  it('clears on request', () => {
    sessionStorage.write({ accessToken: 'abc', expiresAt: future(60) });
    sessionStorage.clear();
    expect(sessionStorage.read()).toBeNull();
  });
});
