import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import { resetPayments } from '@/mocks/payments-data';
import type { PaymentDetail } from './types';

beforeEach(() => resetPayments());

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
const accounts = () => loginAs('accounts@mavenart.test');
const admin = () => loginAs('admin@mavenart.test');

describe('payments mock API (§22)', () => {
  it('requires payments.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/payments' }), loginAs('faculty@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('lets accounts read the recorded transactions', () => {
    const result = handleMockRequest(request({ method: 'GET', path: '/payments' }), accounts()) as { total: number };
    expect(result.total).toBeGreaterThan(0);
  });

  it('records a payment and issues a receipt (payments.create)', () => {
    const created = handleMockRequest(
      request({
        method: 'POST',
        path: '/payments',
        body: { student: 'Neha Krishnan', feeAssignmentId: 'fa-503', amount: 60000, method: 'upi', paidAt: '2026-08-19' },
      }),
      accounts(),
    ) as PaymentDetail;

    expect(created.id).toMatch(/^pay-/);
    expect(created.status).toBe('recorded');
    expect(created.receiptId).toMatch(/^rcpt-/);
    expect(created.amount).toBe(60000);

    // The recorded payment is now retrievable.
    const fetched = handleMockRequest(request({ method: 'GET', path: `/payments/${created.id}` }), accounts());
    expect((fetched as PaymentDetail).student).toBe('Neha Krishnan');
  });

  it('refuses to record without payments.create — admin can view but not record', () => {
    // Admin holds payments.view but not payments.create.
    expect(() =>
      handleMockRequest(
        request({ method: 'POST', path: '/payments', body: { student: 'X', amount: 100, method: 'cash', paidAt: '2026-08-19' } }),
        admin(),
      ),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('rejects an invalid record payload (422)', () => {
    expect(() =>
      handleMockRequest(
        request({ method: 'POST', path: '/payments', body: { student: '', amount: 0, method: 'cash', paidAt: '' } }),
        accounts(),
      ),
    ).toThrowError(expect.objectContaining({ kind: 'validation' }));
  });

  it('filters the list by status', () => {
    const pending = handleMockRequest(
      request({ method: 'GET', path: '/payments', query: { status: 'pending' } }),
      accounts(),
    ) as { data: { status: string }[] };
    expect(pending.data.every((p) => p.status === 'pending')).toBe(true);
  });

  it('404s an unknown payment', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/payments/pay-none' }), accounts()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
