import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';

function request(partial: Partial<ApiRequest> & Pick<ApiRequest, 'method' | 'path'>): ApiRequest {
  return { auth: true, timeoutMs: 1000, ...partial };
}
function loginAs(email: string): string {
  const r = handleMockRequest(
    request({ method: 'POST', path: '/auth/login', auth: false, body: { email, password: 'password' } }),
    null,
  ) as { session: { accessToken: string } };
  return r.session.accessToken;
}
const admin = () => loginAs('admin@mavenart.test');
const get = (path: string, token = admin()) => handleMockRequest(request({ method: 'GET', path }), token);

describe('parents mock API (§ Phase 2)', () => {
  it('requires parents.view', () => {
    expect(() => get('/parents', loginAs('faculty@mavenart.test'))).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });
  it('lists parents and reads a detail with linked students', () => {
    expect((get('/parents') as { total: number }).total).toBeGreaterThan(0);
    const detail = get('/parents/par-206') as { students: unknown[] };
    expect(detail.students.length).toBe(2);
  });
  it('404s an unknown parent', () => {
    expect(() => get('/parents/par-none')).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});

describe('users mock API (§ administration)', () => {
  it('requires users.view (accounts is refused)', () => {
    expect(() => get('/users', loginAs('accounts@mavenart.test'))).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });
  it('lists and filters by role', () => {
    expect((get('/users') as { total: number }).total).toBeGreaterThan(0);
    const filtered = handleMockRequest(request({ method: 'GET', path: '/users', query: { role: 'faculty' } }), admin()) as {
      data: { role: string }[];
    };
    expect(filtered.data.every((u) => u.role === 'faculty')).toBe(true);
  });
  it('reads a user detail', () => {
    expect((get('/users/u-admin') as { email: string }).email).toBe('admin@mavenart.test');
  });
});

describe('roles mock API (§ administration, §12)', () => {
  it('requires roles.view', () => {
    expect(() => get('/roles', loginAs('faculty@mavenart.test'))).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });
  it('lists roles and reads grouped permissions', () => {
    expect((get('/roles') as { total: number }).total).toBe(5);
    const detail = get('/roles/admin') as { groups: { permissions: string[] }[] };
    expect(detail.groups.length).toBeGreaterThan(0);
  });
});

describe('audit mock API (§ administration)', () => {
  it('requires audit.view', () => {
    expect(() => get('/audit', loginAs('accounts@mavenart.test'))).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });
  it('lists entries and reads a detail with ip', () => {
    expect((get('/audit') as { total: number }).total).toBeGreaterThan(0);
    expect((get('/audit/aud-1201') as { ip: string }).ip).toBeTruthy();
  });
});

describe('settings mock API (§ administration)', () => {
  it('requires settings.view', () => {
    expect(() => get('/settings', loginAs('faculty@mavenart.test'))).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });
  it('returns configuration sections', () => {
    const settings = get('/settings') as { institution: string; sections: unknown[] };
    expect(settings.institution).toBe('Maven Art Academy');
    expect(settings.sections.length).toBeGreaterThan(0);
  });
});
