import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import { resetEnquiries } from '@/mocks/enquiries-data';
import type { EnquiryDetail } from './types';

beforeEach(() => resetEnquiries());

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

function get(id: string, token = admin()): EnquiryDetail {
  return handleMockRequest(request({ method: 'GET', path: `/enquiries/${id}` }), token) as EnquiryDetail;
}
function post(path: string, token = admin(), body?: unknown): EnquiryDetail {
  return handleMockRequest(request({ method: 'POST', path, body }), token) as EnquiryDetail;
}

describe('enquiries mock API (state machine)', () => {
  it('requires enquiries.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/enquiries' }), loginAs('student@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('advertises actions appropriate to each stage', () => {
    // new / contacted / qualified can be worked on.
    expect(get('enq-041').availableActions).toEqual(
      expect.arrayContaining(['log_followup', 'convert', 'close']),
    );
    // converted is terminal — no actions.
    expect(get('enq-036').availableActions).toEqual([]);
    // closed can only be reopened.
    expect(get('enq-035').availableActions).toEqual(['reopen']);
  });

  it('convert requires enquiries.update', () => {
    // A viewer without update permission cannot convert. (Faculty lacks it.)
    expect(() => post('/enquiries/enq-039/convert', loginAs('faculty@mavenart.test'))).toThrowError(
      expect.objectContaining({ kind: 'forbidden' }),
    );
  });

  it('converts a qualified enquiry and links the created application', () => {
    const before = get('enq-038');
    expect(before.stage).toBe('qualified');

    const after = post('/enquiries/enq-038/convert');
    expect(after.stage).toBe('converted');
    expect(after.applicationId).toMatch(/^app-/);
    // Now terminal — the UI will show no further actions.
    expect(after.availableActions).toEqual([]);
  });

  it('rejects an illegal transition with 409 — the backend owns the machine (§15)', () => {
    // enq-036 is already converted; converting again is not legal.
    expect(() => post('/enquiries/enq-036/convert')).toThrowError(
      expect.objectContaining({ kind: 'conflict', status: 409 }),
    );
  });

  it('advances a new enquiry to contacted when a follow-up is logged', () => {
    const before = get('enq-039');
    expect(before.stage).toBe('new');

    const after = post('/enquiries/enq-039/followups', admin(), { note: 'Spoke to the applicant.' });
    expect(after.stage).toBe('contacted');
    expect(after.followups[0]?.note).toBe('Spoke to the applicant.');
  });

  it('validates that a follow-up note is present (422)', () => {
    expect(() => post('/enquiries/enq-041/followups', admin(), { note: '' })).toThrowError(
      expect.objectContaining({ kind: 'validation' }),
    );
  });

  it('reopens a closed enquiry and refuses to reopen a non-closed one', () => {
    const reopened = post('/enquiries/enq-035/reopen');
    expect(reopened.stage).toBe('new');

    // enq-041 is not closed; reopen is not a legal action for it.
    expect(() => post('/enquiries/enq-041/reopen')).toThrowError(
      expect.objectContaining({ kind: 'conflict' }),
    );
  });

  it('filters the list by stage', () => {
    const closed = handleMockRequest(
      request({ method: 'GET', path: '/enquiries', query: { stage: 'closed' } }),
      admin(),
    ) as { data: { stage: string }[] };
    expect(closed.data.every((e) => e.stage === 'closed')).toBe(true);
  });
});
