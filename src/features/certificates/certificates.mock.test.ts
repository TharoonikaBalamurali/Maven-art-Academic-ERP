import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import { resetCertificates } from '@/mocks/certificates-data';
import type { CertificateDetail } from './types';

beforeEach(() => resetCertificates());

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

describe('certificates mock API (§27)', () => {
  it('requires certificates.view to read', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/certificates' }), loginAs('accounts@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('issues a certificate with a backend-assigned number (certificates.issue)', () => {
    const created = handleMockRequest(
      request({
        method: 'POST',
        path: '/certificates',
        body: { student: 'Kabir Menon', type: 'course_completion', course: 'Visual Communication & Design' },
      }),
      admin(),
    ) as CertificateDetail;

    expect(created.id).toMatch(/^cert-/);
    expect(created.certificateNo).toMatch(/^MA\/CERT\//);
    expect(created.status).toBe('issued');
    expect(created.issuedBy).toBeTruthy(); // stamped from the identity, not the client

    const fetched = handleMockRequest(request({ method: 'GET', path: `/certificates/${created.id}` }), admin());
    expect((fetched as CertificateDetail).student).toBe('Kabir Menon');
  });

  it('refuses to issue without certificates.issue', () => {
    // Faculty holds neither certificates.view nor issue.
    expect(() =>
      handleMockRequest(
        request({ method: 'POST', path: '/certificates', body: { student: 'X', type: 'bonafide' } }),
        loginAs('faculty@mavenart.test'),
      ),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('rejects an invalid issue payload (422)', () => {
    expect(() =>
      handleMockRequest(request({ method: 'POST', path: '/certificates', body: { student: '' } }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'validation' }));
  });

  it('filters by status', () => {
    const requested = handleMockRequest(
      request({ method: 'GET', path: '/certificates', query: { status: 'requested' } }),
      admin(),
    ) as { data: { status: string }[] };
    expect(requested.data.every((c) => c.status === 'requested')).toBe(true);
  });

  it('404s an unknown certificate', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/certificates/cert-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
