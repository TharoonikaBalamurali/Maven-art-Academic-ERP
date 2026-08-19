import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { ReceiptDetail } from './types';

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

function get(id: string, token = admin()): ReceiptDetail {
  return handleMockRequest(request({ method: 'GET', path: `/receipts/${id}` }), token) as ReceiptDetail;
}

describe('receipts mock API (§24)', () => {
  it('requires receipts.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/receipts' }), loginAs('faculty@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('accounts can read receipts', () => {
    const result = handleMockRequest(request({ method: 'GET', path: '/receipts' }), loginAs('accounts@mavenart.test')) as {
      total: number;
    };
    expect(result.total).toBeGreaterThan(0);
  });

  it('reports the backend receipt number, amount and payment link', () => {
    const detail = get('rcpt-701');
    expect(detail.receiptNo).toBe('MA/2026/0701');
    expect(detail.amount).toBe(130000);
    expect(detail.paymentId).toBe('pay-901');
    expect(detail.feeAssignmentId).toBe('fa-501');
  });

  it('searches by receipt number', () => {
    const result = handleMockRequest(
      request({ method: 'GET', path: '/receipts', query: { search: 'MA/2026/0703' } }),
      admin(),
    ) as { data: { id: string }[] };
    expect(result.data.map((r) => r.id)).toContain('rcpt-703');
  });

  it('404s an unknown receipt', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/receipts/rcpt-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
