import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import { resetApplications } from '@/mocks/applications-data';
import type { ApplicationDetail } from './types';

beforeEach(() => resetApplications());

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

function get(id: string, token = admin()): ApplicationDetail {
  return handleMockRequest(request({ method: 'GET', path: `/applications/${id}` }), token) as ApplicationDetail;
}
function post(path: string, token = admin(), body?: unknown): ApplicationDetail {
  return handleMockRequest(request({ method: 'POST', path, body }), token) as ApplicationDetail;
}

describe('applications mock API (state machine, §16)', () => {
  it('requires applications.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/applications' }), loginAs('student@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('advertises actions per stage', () => {
    expect(get('app-116').availableActions).toEqual(['submit']); // draft
    expect(get('app-120').availableActions).toEqual(['start_review']); // submitted
    expect(get('app-119').availableActions).toEqual(['approve', 'reject']); // under_review
    expect(get('app-118').availableActions).toEqual([]); // approved (terminal)
    expect(get('app-117').availableActions).toEqual([]); // rejected (terminal)
  });

  it('requires applications.review to act', () => {
    // Admin holds review; a user without it (faculty) is refused.
    expect(() => post('/applications/app-120/start-review', loginAs('faculty@mavenart.test'))).toThrowError(
      expect.objectContaining({ kind: 'forbidden' }),
    );
  });

  it('walks draft → submitted → under_review → approved, creating an admission', () => {
    expect(post('/applications/app-116/submit').stage).toBe('submitted');
    expect(post('/applications/app-116/start-review').stage).toBe('under_review');

    const approved = post('/applications/app-116/approve', admin(), { note: 'Strong portfolio.' });
    expect(approved.stage).toBe('approved');
    expect(approved.admissionId).toMatch(/^adm-/);
    expect(approved.decisionNote).toBe('Strong portfolio.');
    expect(approved.availableActions).toEqual([]);
  });

  it('can reject an under-review application with a note', () => {
    const rejected = post('/applications/app-119/reject', admin(), { note: 'Does not meet the criteria.' });
    expect(rejected.stage).toBe('rejected');
    expect(rejected.decisionNote).toBe('Does not meet the criteria.');
  });

  it('rejects an illegal transition with 409 — the backend owns the machine (§16)', () => {
    // app-118 is already approved; approving again is not legal.
    expect(() => post('/applications/app-118/approve')).toThrowError(
      expect.objectContaining({ kind: 'conflict', status: 409 }),
    );
    // Cannot approve straight from "submitted" without starting review.
    expect(() => post('/applications/app-120/approve')).toThrowError(
      expect.objectContaining({ kind: 'conflict' }),
    );
  });

  it('filters the list by stage', () => {
    const underReview = handleMockRequest(
      request({ method: 'GET', path: '/applications', query: { stage: 'under_review' } }),
      admin(),
    ) as { data: { stage: string }[] };
    expect(underReview.data.every((a) => a.stage === 'under_review')).toBe(true);
  });

  it('404s an unknown application', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/applications/app-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
