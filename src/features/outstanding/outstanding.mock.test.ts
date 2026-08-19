import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { OutstandingDetail } from './types';

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

function get(id: string, token = admin()): OutstandingDetail {
  return handleMockRequest(request({ method: 'GET', path: `/outstanding/${id}` }), token) as OutstandingDetail;
}

describe('outstanding fees mock API (§23)', () => {
  it('requires outstanding.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/outstanding' }), loginAs('faculty@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('accounts can read the outstanding report', () => {
    const result = handleMockRequest(request({ method: 'GET', path: '/outstanding' }), loginAs('accounts@mavenart.test')) as {
      total: number;
    };
    expect(result.total).toBeGreaterThan(0);
  });

  it('reports outstanding and overdue as backend figures', () => {
    const detail = get('out-506');
    expect(detail.outstandingAmount).toBe(150000);
    expect(detail.overdueAmount).toBe(150000);
    expect(detail.severity).toBe('overdue');
    expect(detail.feeAssignmentId).toBe('fa-506');
  });

  it('filters by severity', () => {
    const overdue = handleMockRequest(
      request({ method: 'GET', path: '/outstanding', query: { severity: 'overdue' } }),
      admin(),
    ) as { data: { severity: string }[] };
    expect(overdue.data.length).toBeGreaterThan(0);
    expect(overdue.data.every((o) => o.severity === 'overdue')).toBe(true);
  });

  it('404s an unknown outstanding record', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/outstanding/out-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
