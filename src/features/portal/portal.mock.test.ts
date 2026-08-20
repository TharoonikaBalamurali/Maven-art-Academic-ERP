import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { PortalOverview, PortalProfile } from './types';

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
const student = () => loginAs('student@mavenart.test');
const parent = () => loginAs('parent@mavenart.test');
const get = (path: string, token: string) => handleMockRequest(request({ method: 'GET', path }), token);

describe('portal mock API (§7, §8)', () => {
  it('requires portal.dashboard.view for the overview (a management role is refused)', () => {
    expect(() => get('/portal/overview', loginAs('faculty@mavenart.test'))).toThrowError(
      expect.objectContaining({ kind: 'forbidden' }),
    );
  });

  it('returns the caller-scoped overview for a student', () => {
    const overview = get('/portal/overview', student()) as PortalOverview;
    expect(overview.student.registerNo).toBe('MAA20260001');
    expect(overview.attendance?.percentage).toBe(92);
    expect(overview.fees?.outstanding).toBe(98000);
    // Dashboard feeds are backend-provided and scoped to the caller.
    expect(overview.fees?.paid).toBe(60000);
    expect(overview.todaySchedule.some((s) => s.status === 'now')).toBe(true);
    expect(overview.upcomingActivities.length).toBeGreaterThan(0);
    expect(overview.reminders.length).toBeGreaterThan(0);
    expect(overview.recentGrades.length).toBeGreaterThan(0);
  });

  it('gives a parent the same portal overview scope (selected child, §8)', () => {
    const overview = get('/portal/overview', parent()) as PortalOverview;
    expect(overview.student.name).toBe('Nithya Balan');
  });

  it('requires portal.profile.view for the profile', () => {
    // A management role holds none of the portal permissions.
    expect(() => get('/portal/profile', loginAs('admin@mavenart.test'))).toThrowError(
      expect.objectContaining({ kind: 'forbidden' }),
    );
  });

  it('returns the student profile with guardian details', () => {
    const profile = get('/portal/profile', student()) as PortalProfile;
    expect(profile.name).toBe('Nithya Balan');
    expect(profile.guardianName).toBe('Balan Muthu');
  });

  it('scopes the academic group to the caller and enforces each permission', () => {
    const course = get('/portal/course', student()) as { subjects: unknown[] };
    expect(course.subjects.length).toBeGreaterThan(0);

    const timetable = get('/portal/timetable', student()) as { week: { day: string }[] };
    expect(timetable.week.map((d) => d.day)).toContain('Monday');

    const attendance = get('/portal/attendance', student()) as { percentage: number; recent: unknown[] };
    expect(attendance.percentage).toBe(92);
    expect(attendance.recent.length).toBeGreaterThan(0);

    const progress = get('/portal/progress', student()) as { records: { grade: string | null }[] };
    expect(progress.records.some((r) => r.grade === 'A+')).toBe(true);
  });

  it('refuses the academic endpoints for a management role', () => {
    expect(() => get('/portal/progress', loginAs('faculty@mavenart.test'))).toThrowError(
      expect.objectContaining({ kind: 'forbidden' }),
    );
  });

  it('returns the caller-scoped finance group with backend figures', () => {
    const fees = get('/portal/fees', student()) as { assigned: number; outstanding: number; installments: unknown[] };
    expect(fees.assigned).toBe(158000);
    expect(fees.outstanding).toBe(98000);
    expect(fees.installments.length).toBe(3);

    const payments = get('/portal/payments', student()) as { records: { receiptNo: string | null }[] };
    expect(payments.records[0]?.receiptNo).toBe('MA/2026/0960');

    const certs = get('/portal/certificates', student()) as { records: { certificateNo: string }[] };
    expect(certs.records.some((c) => c.certificateNo === 'MA/CERT/2026/0403')).toBe(true);
  });

  it('refuses the finance endpoints for a management role', () => {
    expect(() => get('/portal/fees', loginAs('accounts@mavenart.test'))).toThrowError(
      expect.objectContaining({ kind: 'forbidden' }),
    );
  });

  it('lists the parent\'s linked children (portal.children.view) and refuses a student', () => {
    const children = get('/portal/children', parent()) as { children: { id: string; name: string }[] };
    expect(children.children.map((c) => c.name)).toEqual(['Nithya Balan', 'Arjun Balan']);

    expect(() => get('/portal/children', student())).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('re-scopes portal data to the selected child (§8)', () => {
    // No scope → the first child (Nithya); with the second child selected → Arjun.
    const nithya = handleMockRequest(request({ method: 'GET', path: '/portal/overview' }), parent()) as PortalOverview;
    expect(nithya.student.name).toBe('Nithya Balan');
    expect(nithya.fees?.outstanding).toBe(98000);

    const arjun = handleMockRequest(
      request({ method: 'GET', path: '/portal/overview', query: { student: 'stu-050' } }),
      parent(),
    ) as PortalOverview;
    expect(arjun.student.name).toBe('Arjun Balan');
    expect(arjun.fees?.outstanding).toBe(0);

    const arjunFees = handleMockRequest(
      request({ method: 'GET', path: '/portal/fees', query: { student: 'stu-050' } }),
      parent(),
    ) as { assigned: number; status: string };
    expect(arjunFees.assigned).toBe(130000);
    expect(arjunFees.status).toBe('paid');
  });

  it('pays fees online: creates an order, verifies, and reduces the balance (§ Razorpay)', () => {
    // Order creation returns a sandbox order (empty keyId → client runs sandbox).
    const order = handleMockRequest(
      request({ method: 'POST', path: '/portal/payments/order', body: { amount: 40000 } }),
      student(),
    ) as { orderId: string; amount: number; currency: string; keyId: string };
    expect(order.orderId).toMatch(/^order_/);
    expect(order.amount).toBe(4_000_000); // paise
    expect(order.currency).toBe('INR');
    expect(order.keyId).toBe('');

    const before = (handleMockRequest(request({ method: 'GET', path: '/portal/fees' }), student()) as { outstanding: number }).outstanding;

    const result = handleMockRequest(
      request({
        method: 'POST',
        path: '/portal/payments/verify',
        body: { orderId: order.orderId, amount: 40000, method: 'upi', razorpayPaymentId: 'pay_sandbox_1', razorpaySignature: 'sandbox' },
      }),
      student(),
    ) as { paymentId: string; receiptNo: string; status: string; fees: { outstanding: number } };

    expect(result.status).toBe('recorded');
    expect(result.receiptNo).toMatch(/^MA\//);
    expect(result.fees.outstanding).toBe(before - 40000);

    // The payment now appears in the caller's payment history.
    const payments = handleMockRequest(request({ method: 'GET', path: '/portal/payments' }), student()) as {
      records: { method: string; amount: number }[];
    };
    expect(payments.records.some((p) => p.method === 'upi' && p.amount === 40000)).toBe(true);
  });

  it('rejects an invalid pay order (422)', () => {
    expect(() =>
      handleMockRequest(request({ method: 'POST', path: '/portal/payments/order', body: { amount: 0 } }), student()),
    ).toThrowError(expect.objectContaining({ kind: 'validation' }));
  });
});
