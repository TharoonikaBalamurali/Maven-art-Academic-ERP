import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import { resetEnrollments } from '@/mocks/enrollments-data';
import { resetAdmissions } from '@/mocks/admissions-data';
import type { EnrollmentDetail } from './types';

beforeEach(() => {
  resetEnrollments();
  resetAdmissions();
});

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

function get(id: string, token = admin()): EnrollmentDetail {
  return handleMockRequest(request({ method: 'GET', path: `/enrollments/${id}` }), token) as EnrollmentDetail;
}

describe('enrollments mock API (§18)', () => {
  it('requires enrollments.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/enrollments' }), loginAs('student@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('reads an enrollment with its admission provenance', () => {
    const detail = get('enr-330');
    expect(detail.student).toBe('Aisha Rahman');
    expect(detail.status).toBe('active');
    expect(detail.admissionId).toBe('adm-495');
  });

  it('filters the list by status', () => {
    const completed = handleMockRequest(
      request({ method: 'GET', path: '/enrollments', query: { status: 'completed' } }),
      admin(),
    ) as { data: { status: string }[] };
    expect(completed.data.length).toBeGreaterThan(0);
    expect(completed.data.every((e) => e.status === 'completed')).toBe(true);
  });

  it('searches across student, course and batch', () => {
    const byBatch = handleMockRequest(
      request({ method: 'GET', path: '/enrollments', query: { search: 'PH-2026-A' } }),
      admin(),
    ) as { data: { id: string }[] };
    expect(byBatch.data.map((e) => e.id)).toContain('enr-330');
  });

  it('creates an enrollment when an admission is enrolled (§17 → §18 handoff)', () => {
    // adm-497 is confirmed in the admissions seed; enrolling it should create a
    // matching enrollment that resolves via the enrollments endpoint.
    const enrolled = handleMockRequest(
      request({ method: 'POST', path: '/admissions/adm-497/enroll', body: { note: 'Enrol.' } }),
      admin(),
    ) as { enrollmentId: string };
    expect(enrolled.enrollmentId).toMatch(/^enr-/);

    const enrollment = get(enrolled.enrollmentId);
    expect(enrollment.student).toBe('Kabir Menon');
    expect(enrollment.status).toBe('active');
    expect(enrollment.admissionId).toBe('adm-497');
  });

  it('404s an unknown enrollment', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/enrollments/enr-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
