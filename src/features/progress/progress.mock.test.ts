import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { ProgressDetail } from './types';

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
const faculty = () => loginAs('faculty@mavenart.test');

function get(id: string, token = faculty()): ProgressDetail {
  return handleMockRequest(request({ method: 'GET', path: `/progress/${id}` }), token) as ProgressDetail;
}

describe('academic progress mock API (§26)', () => {
  it('requires progress.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/progress' }), loginAs('accounts@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('faculty and admin can read progress', () => {
    const asFaculty = handleMockRequest(request({ method: 'GET', path: '/progress' }), faculty()) as { total: number };
    const asAdmin = handleMockRequest(request({ method: 'GET', path: '/progress' }), loginAs('admin@mavenart.test')) as {
      total: number;
    };
    expect(asFaculty.total).toBeGreaterThan(0);
    expect(asAdmin.total).toBe(asFaculty.total);
  });

  it('reports the backend grade and result, not a client derivation', () => {
    const detail = get('prg-806'); // 58/100 → backend grade C, Pass
    expect(detail.grade).toBe('C');
    expect(detail.result).toBe('Pass');
    expect(detail.score).toBe(58);
  });

  it('leaves grade and result null for a pending record', () => {
    const detail = get('prg-804');
    expect(detail.status).toBe('pending');
    expect(detail.score).toBeNull();
    expect(detail.grade).toBeNull();
    expect(detail.result).toBeNull();
  });

  it('filters by status', () => {
    const absent = handleMockRequest(
      request({ method: 'GET', path: '/progress', query: { status: 'absent' } }),
      faculty(),
    ) as { data: { status: string }[] };
    expect(absent.data.every((p) => p.status === 'absent')).toBe(true);
  });

  it('404s an unknown progress record', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/progress/prg-none' }), faculty()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
