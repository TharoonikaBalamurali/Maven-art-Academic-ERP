import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { SearchResponse } from './types';

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
const search = (q: string, token: string) =>
  handleMockRequest(request({ method: 'GET', path: '/search', query: { q } }), token) as SearchResponse;

describe('global search mock API (§ search)', () => {
  it('requires a session', () => {
    expect(() => handleMockRequest(request({ method: 'GET', path: '/search', query: { q: 'ab' } }), null)).toThrowError(
      expect.objectContaining({ kind: 'unauthorized' }),
    );
  });

  it('returns nothing below two characters (no query on every keystroke)', () => {
    expect(search('a', loginAs('admin@mavenart.test')).results).toEqual([]);
  });

  it('finds a student by name', () => {
    const results = search('Nithya', loginAs('admin@mavenart.test')).results;
    const student = results.find((r) => r.kind === 'student');
    expect(student?.title).toContain('Nithya');
    expect(student?.to).toMatch(/^\/management\/students\//);
  });

  it('finds a student by admission number and by roll number', () => {
    const admin = loginAs('admin@mavenart.test');
    // Take a real student's identifiers, then search by each.
    const seed = search('Nithya', admin).results.find((r) => r.kind === 'student');
    expect(seed?.admissionNo).toBeTruthy();
    expect(seed?.rollNo).toBeTruthy();

    const byAdmission = search(seed!.admissionNo!, admin).results;
    expect(byAdmission.some((r) => r.id === seed!.id)).toBe(true);

    const byRoll = search(seed!.rollNo!, admin).results;
    expect(byRoll.some((r) => r.id === seed!.id)).toBe(true);
  });

  it('carries the identifiers a result row needs', () => {
    const student = search('Nithya', loginAs('admin@mavenart.test')).results.find((r) => r.kind === 'student');
    expect(student?.registerNo).toBeTruthy();
    expect(student?.subtitle).toBeTruthy();
    expect(student?.status).toBeTruthy();
    // photoUrl is present as a field (null when unset) so the row can fall back to initials.
    expect('photoUrl' in (student ?? {})).toBe(true);
  });

  it('scopes result kinds to the caller’s permissions', () => {
    // Accounts holds students.view but not faculty/courses/batches.
    const accounts = search('a', loginAs('accounts@mavenart.test'));
    expect(accounts.results).toEqual([]); // below the minimum length

    const accountsKinds = new Set(search('Bachelor', loginAs('accounts@mavenart.test')).results.map((r) => r.kind));
    expect(accountsKinds.has('course')).toBe(false);

    const adminKinds = new Set(search('Bachelor', loginAs('admin@mavenart.test')).results.map((r) => r.kind));
    expect(adminKinds.has('course')).toBe(true);
  });

  it('returns no student results for a role without students.view', () => {
    // Student/parent portal roles hold no management read permissions.
    const kinds = new Set(search('Nithya', loginAs('parent@mavenart.test')).results.map((r) => r.kind));
    expect(kinds.has('student')).toBe(false);
  });
});
