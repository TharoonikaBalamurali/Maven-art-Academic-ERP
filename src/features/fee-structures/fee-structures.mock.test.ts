import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { FeeStructureDetail } from './types';

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

function get(id: string, token = admin()): FeeStructureDetail {
  return handleMockRequest(request({ method: 'GET', path: `/fee-structures/${id}` }), token) as FeeStructureDetail;
}

describe('fee structures mock API (§19)', () => {
  it('requires fee_structures.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/fee-structures' }), loginAs('faculty@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('accounts can read fee structures', () => {
    const result = handleMockRequest(
      request({ method: 'GET', path: '/fee-structures' }),
      loginAs('accounts@mavenart.test'),
    ) as { total: number };
    expect(result.total).toBeGreaterThan(0);
  });

  it('reports the backend total verbatim, not summed on read', () => {
    const detail = get('fs-bfa-2026');
    // The seeded backend total is authoritative; the frontend must not recompute it.
    expect(detail.total).toBe(158000);
    expect(detail.components).toHaveLength(4);
  });

  it('filters the list by status', () => {
    const drafts = handleMockRequest(
      request({ method: 'GET', path: '/fee-structures', query: { status: 'draft' } }),
      admin(),
    ) as { data: { status: string }[] };
    expect(drafts.data.length).toBeGreaterThan(0);
    expect(drafts.data.every((f) => f.status === 'draft')).toBe(true);
  });

  it('searches by course', () => {
    const bfa = handleMockRequest(
      request({ method: 'GET', path: '/fee-structures', query: { search: 'BFA' } }),
      admin(),
    ) as { data: { id: string }[] };
    expect(bfa.data.map((f) => f.id)).toContain('fs-bfa-2026');
  });

  it('404s an unknown fee structure', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/fee-structures/fs-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
