import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiError } from '@/lib/api';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import { resetAttendance } from '@/mocks/attendance-data';
import type { AttendanceClass, AttendanceRoster } from './types';

function request(partial: Partial<ApiRequest> & Pick<ApiRequest, 'method' | 'path'>): ApiRequest {
  return { auth: true, timeoutMs: 1000, ...partial };
}

function loginAs(email: string): string {
  const result = handleMockRequest(
    request({ method: 'POST', path: '/auth/login', auth: false, body: { email, password: 'password' } }),
    null,
  ) as { session: { accessToken: string } };
  return result.session.accessToken;
}

const faculty = () => loginAs('faculty@mavenart.test');

function classesFor(token: string): AttendanceClass[] {
  return handleMockRequest(request({ method: 'GET', path: '/attendance/classes' }), token) as AttendanceClass[];
}

beforeEach(() => resetAttendance());

describe('attendance mock API', () => {
  it('returns only the faculty member’s own scheduled classes (§6)', () => {
    const classes = classesFor(faculty());
    expect(classes.length).toBeGreaterThan(0);
    // The seeded faculty teaches BFA batches; nothing they are not assigned to.
    expect(classes.every((c) => c.batch.startsWith('BFA'))).toBe(true);
  });

  it('gives an administrator no classes to mark — they are assigned none', () => {
    // Admin holds attendance.view but is not scheduled to teach.
    expect(classesFor(loginAs('admin@mavenart.test'))).toEqual([]);
  });

  it('refuses the class list without attendance.view', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/attendance/classes' }), loginAs('accounts@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('loads the roster for an assigned class', () => {
    const token = faculty();
    const first = classesFor(token)[0]!;
    const roster = handleMockRequest(
      request({ method: 'GET', path: `/attendance/classes/${first.id}` }),
      token,
    ) as AttendanceRoster;

    expect(roster.scheduledClass.id).toBe(first.id);
    expect(roster.students.length).toBe(first.studentCount);
    // Everyone defaults to present before marking.
    expect(roster.students.every((s) => s.mark === 'present')).toBe(true);
  });

  it('forbids the roster of a class the faculty is not assigned to (§6)', () => {
    // cls-2 (Typography) belongs to another faculty member.
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/attendance/classes/cls-2' }), faculty()),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('404s an unknown class', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/attendance/classes/cls-none' }), faculty()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });

  it('records a submission and reflects it on re-fetch', () => {
    const token = faculty();
    const first = classesFor(token)[0]!;
    const roster = handleMockRequest(
      request({ method: 'GET', path: `/attendance/classes/${first.id}` }),
      token,
    ) as AttendanceRoster;
    const [absentee, ...present] = roster.students;

    const saved = handleMockRequest(
      request({
        method: 'POST',
        path: `/attendance/classes/${first.id}`,
        body: { present: present.map((s) => s.id), absent: [absentee!.id] },
      }),
      token,
    ) as AttendanceRoster;

    expect(saved.scheduledClass.marked).toBe(true);
    expect(saved.students.find((s) => s.id === absentee!.id)?.mark).toBe('absent');

    // The class list now shows it as marked.
    expect(classesFor(token).find((c) => c.id === first.id)?.marked).toBe(true);
  });

  it('forbids submitting attendance for an unassigned class (§6)', () => {
    expect(() =>
      handleMockRequest(
        request({ method: 'POST', path: '/attendance/classes/cls-2', body: { present: [], absent: [] } }),
        faculty(),
      ),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('refuses submission without attendance.mark, even for an admin', () => {
    // Admin can view but not mark; the mark permission is required to submit.
    const token = loginAs('admin@mavenart.test');
    try {
      handleMockRequest(
        request({ method: 'POST', path: '/attendance/classes/cls-1', body: { present: [], absent: [] } }),
        token,
      );
      throw new Error('expected a rejection');
    } catch (error) {
      expect((error as ApiError).kind).toBe('forbidden');
    }
  });
});
