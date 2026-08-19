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
});
