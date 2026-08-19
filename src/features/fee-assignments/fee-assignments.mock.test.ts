import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { FeeAssignmentDetail } from './types';

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

function get(id: string, token = admin()): FeeAssignmentDetail {
  return handleMockRequest(request({ method: 'GET', path: `/fee-assignments/${id}` }), token) as FeeAssignmentDetail;
}

describe('fee assignments mock API (§20)', () => {
  it('requires fee_assignments.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/fee-assignments' }), loginAs('faculty@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('accounts can read fee assignments', () => {
    const result = handleMockRequest(
      request({ method: 'GET', path: '/fee-assignments' }),
      loginAs('accounts@mavenart.test'),
    ) as { total: number };
    expect(result.total).toBeGreaterThan(0);
  });

  it('reports assigned, paid and balance as separate backend figures', () => {
    const detail = get('fa-502');
    expect(detail.assignedAmount).toBe(153000);
    expect(detail.paidAmount).toBe(51000);
    expect(detail.balance).toBe(102000);
  });

  it('filters the list by status', () => {
    const overdue = handleMockRequest(
      request({ method: 'GET', path: '/fee-assignments', query: { status: 'overdue' } }),
      admin(),
    ) as { data: { status: string }[] };
    expect(overdue.data.length).toBeGreaterThan(0);
    expect(overdue.data.every((f) => f.status === 'overdue')).toBe(true);
  });

  it('searches by student', () => {
    const result = handleMockRequest(
      request({ method: 'GET', path: '/fee-assignments', query: { search: 'Neha' } }),
      admin(),
    ) as { data: { id: string }[] };
    expect(result.data.map((f) => f.id)).toContain('fa-503');
  });

  it('404s an unknown fee assignment', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/fee-assignments/fa-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
