import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { InstallmentDetail } from './types';

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

function get(id: string, token = admin()): InstallmentDetail {
  return handleMockRequest(request({ method: 'GET', path: `/installments/${id}` }), token) as InstallmentDetail;
}

describe('installments mock API (§21)', () => {
  it('requires installments.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/installments' }), loginAs('faculty@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('reports the installment amount and status from the backend', () => {
    const detail = get('inst-611');
    expect(detail.amount).toBe(51000);
    expect(detail.status).toBe('paid');
    expect(detail.sequence).toBe(1);
    expect(detail.totalCount).toBe(3);
    expect(detail.feeAssignmentId).toBe('fa-502');
  });

  it('filters the list by status', () => {
    const overdue = handleMockRequest(
      request({ method: 'GET', path: '/installments', query: { status: 'overdue' } }),
      admin(),
    ) as { data: { status: string }[] };
    expect(overdue.data.length).toBeGreaterThan(0);
    expect(overdue.data.every((i) => i.status === 'overdue')).toBe(true);
  });

  it('searches by student', () => {
    const result = handleMockRequest(
      request({ method: 'GET', path: '/installments', query: { search: 'Sameer' } }),
      admin(),
    ) as { data: { id: string }[] };
    expect(result.data.map((i) => i.id)).toContain('inst-618');
  });

  it('404s an unknown installment', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/installments/inst-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
