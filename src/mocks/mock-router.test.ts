import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import type { ApiRequest } from '@/lib/api/types';
import type { Paginated } from '@/shared/types';
import { handleMockRequest } from './mock-router';

function request(partial: Partial<ApiRequest> & Pick<ApiRequest, 'method' | 'path'>): ApiRequest {
  return { auth: true, timeoutMs: 1000, ...partial };
}

function loginAs(email: string): string {
  const result = handleMockRequest(
    request({ method: 'POST', path: '/auth/login', auth: false, body: { email, password: 'password' } }),
    null,
  ) as { session: { accessToken: string } };
  return result.session.accessToken;
}

describe('mock API', () => {
  it('rejects unknown routes with a 404 so missing handlers are obvious', () => {
    expect(() => handleMockRequest(request({ method: 'GET', path: '/nope' }), null)).toThrowError(
      expect.objectContaining({ kind: 'not_found' }),
    );
  });

  it('rejects bad credentials without revealing whether the account exists', () => {
    try {
      handleMockRequest(
        request({
          method: 'POST',
          path: '/auth/login',
          auth: false,
          body: { email: 'nobody@mavenart.test', password: 'wrong' },
        }),
        null,
      );
      throw new Error('expected a rejection');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(401);
      expect((error as ApiError).message).not.toMatch(/exist|unknown user/i);
    }
  });

  it('returns 422 with field errors for an incomplete login', () => {
    try {
      handleMockRequest(
        request({ method: 'POST', path: '/auth/login', auth: false, body: { email: '' } }),
        null,
      );
      throw new Error('expected a rejection');
    } catch (error) {
      expect((error as ApiError).kind).toBe('validation');
      expect((error as ApiError).fieldErrors.email).toBeDefined();
      expect((error as ApiError).fieldErrors.password).toBeDefined();
    }
  });

  it('refuses protected endpoints without a session', () => {
    expect(() => handleMockRequest(request({ method: 'GET', path: '/auth/me' }), null)).toThrowError(
      expect.objectContaining({ kind: 'unauthorized' }),
    );
  });

  it('rejects an expired token', () => {
    const expired = `mock.u-admin.${Date.now() - 1000}`;
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/auth/me' }), expired),
    ).toThrowError(expect.objectContaining({ kind: 'unauthorized' }));
  });

  it('returns identity, role and permissions together', () => {
    const token = loginAs('admin@mavenart.test');
    const me = handleMockRequest(request({ method: 'GET', path: '/auth/me' }), token) as {
      role: string;
      permissions: string[];
    };

    expect(me.role).toBe('admin');
    expect(me.permissions).toContain('students.create');
  });

  it('serves notifications to every role — they are centralised (§25)', () => {
    for (const email of [
      'admin@mavenart.test',
      'accounts@mavenart.test',
      'faculty@mavenart.test',
      'student@mavenart.test',
      'parent@mavenart.test',
    ]) {
      const page = handleMockRequest(
        request({ method: 'GET', path: '/notifications' }),
        loginAs(email),
      ) as Paginated<unknown>;
      expect(page.data.length).toBeGreaterThan(0);
    }
  });

  it('scopes permissions to the role the backend assigned', () => {
    const facultyToken = loginAs('faculty@mavenart.test');
    const me = handleMockRequest(request({ method: 'GET', path: '/auth/me' }), facultyToken) as {
      permissions: string[];
    };

    expect(me.permissions).toContain('attendance.mark');
    expect(me.permissions).not.toContain('students.create');
    expect(me.permissions).not.toContain('audit.view');
  });

  it('paginates server-side and reports backend metadata', () => {
    const token = loginAs('student@mavenart.test');
    const page = handleMockRequest(
      request({ method: 'GET', path: '/notifications', query: { page: 2, limit: 10 } }),
      token,
    ) as Paginated<{ id: string }>;

    expect(page.page).toBe(2);
    expect(page.limit).toBe(10);
    expect(page.data).toHaveLength(10);
    expect(page.total).toBeGreaterThan(10);
    expect(page.totalPages).toBe(Math.ceil(page.total / 10));
  });

  it('clamps a page beyond the last one instead of returning nothing', () => {
    const token = loginAs('student@mavenart.test');
    const page = handleMockRequest(
      request({ method: 'GET', path: '/notifications', query: { page: 999, limit: 10 } }),
      token,
    ) as Paginated<{ id: string }>;

    expect(page.page).toBe(page.totalPages);
    expect(page.data.length).toBeGreaterThan(0);
  });

  it('filters and searches on the server', () => {
    const token = loginAs('student@mavenart.test');
    const page = handleMockRequest(
      request({ method: 'GET', path: '/notifications', query: { category: 'fees', limit: 50 } }),
      token,
    ) as Paginated<{ category: string }>;

    expect(page.data.length).toBeGreaterThan(0);
    expect(page.data.every((row) => row.category === 'fees')).toBe(true);
  });

  it('can be forced into each data state for browser verification', () => {
    const token = loginAs('student@mavenart.test');

    const empty = handleMockRequest(
      request({ method: 'GET', path: '/notifications', query: { demoState: 'empty' } }),
      token,
    ) as Paginated<unknown>;
    expect(empty.data).toHaveLength(0);
    expect(empty.total).toBe(0);

    for (const [state, kind] of [
      ['error', 'server'],
      ['forbidden', 'forbidden'],
      ['not_found', 'not_found'],
    ] as const) {
      expect(() =>
        handleMockRequest(
          request({ method: 'GET', path: '/notifications', query: { demoState: state } }),
          token,
        ),
      ).toThrowError(expect.objectContaining({ kind }));
    }
  });
});
