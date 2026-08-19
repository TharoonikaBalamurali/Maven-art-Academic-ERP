import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import { resetAdmissions } from '@/mocks/admissions-data';
import { resetApplications } from '@/mocks/applications-data';
import type { AdmissionDetail } from './types';

beforeEach(() => {
  resetAdmissions();
  resetApplications();
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

function get(id: string, token = admin()): AdmissionDetail {
  return handleMockRequest(request({ method: 'GET', path: `/admissions/${id}` }), token) as AdmissionDetail;
}
function post(path: string, token = admin(), body?: unknown): AdmissionDetail {
  return handleMockRequest(request({ method: 'POST', path, body }), token) as AdmissionDetail;
}

describe('admissions mock API (state machine, §17)', () => {
  it('requires admissions.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/admissions' }), loginAs('student@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('advertises actions per stage', () => {
    expect(get('adm-500').availableActions).toEqual(['confirm', 'cancel']); // offered
    expect(get('adm-497').availableActions).toEqual(['enroll', 'cancel']); // confirmed
    expect(get('adm-495').availableActions).toEqual([]); // enrolled (terminal)
    expect(get('adm-493').availableActions).toEqual([]); // cancelled (terminal)
  });

  it('requires admissions.approve to act', () => {
    // Admin holds approve; a user without it (faculty) is refused.
    expect(() => post('/admissions/adm-500/confirm', loginAs('faculty@mavenart.test'))).toThrowError(
      expect.objectContaining({ kind: 'forbidden' }),
    );
  });

  it('walks offered → confirmed → enrolled, creating an enrollment', () => {
    expect(post('/admissions/adm-500/confirm').stage).toBe('confirmed');

    const enrolled = post('/admissions/adm-500/enroll', admin(), { note: 'Seat accepted.' });
    expect(enrolled.stage).toBe('enrolled');
    expect(enrolled.enrollmentId).toMatch(/^enr-/);
    expect(enrolled.availableActions).toEqual([]);
  });

  it('can cancel an offered admission with a note', () => {
    const cancelled = post('/admissions/adm-499/cancel', admin(), { note: 'Applicant withdrew.' });
    expect(cancelled.stage).toBe('cancelled');
    expect(cancelled.note).toBe('Applicant withdrew.');
  });

  it('rejects an illegal transition with 409 — the backend owns the machine (§17)', () => {
    // adm-495 is already enrolled; enrolling again is not legal.
    expect(() => post('/admissions/adm-495/enroll')).toThrowError(
      expect.objectContaining({ kind: 'conflict', status: 409 }),
    );
    // Cannot enrol straight from "offered" without confirming.
    expect(() => post('/admissions/adm-500/enroll')).toThrowError(
      expect.objectContaining({ kind: 'conflict' }),
    );
  });

  it('creates an admission when an application is approved (§16 → §17 handoff)', () => {
    // app-115 is under_review in the applications seed; approving it should
    // create a matching admission that resolves via the admissions endpoint.
    const approved = handleMockRequest(
      request({ method: 'POST', path: '/applications/app-115/approve', body: { note: 'Admit.' } }),
      admin(),
    ) as { admissionId: string };
    expect(approved.admissionId).toMatch(/^adm-/);

    const admission = get(approved.admissionId);
    expect(admission.stage).toBe('offered');
    expect(admission.applicationId).toBe('app-115');
    expect(admission.availableActions).toEqual(['confirm', 'cancel']);
  });

  it('filters the list by stage', () => {
    const confirmed = handleMockRequest(
      request({ method: 'GET', path: '/admissions', query: { stage: 'confirmed' } }),
      admin(),
    ) as { data: { stage: string }[] };
    expect(confirmed.data.every((a) => a.stage === 'confirmed')).toBe(true);
  });

  it('404s an unknown admission', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/admissions/adm-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
