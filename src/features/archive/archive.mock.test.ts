import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { ArchivedBatchDetail, ArchivedStudentDetail } from './types';
import type { TimetableSlot } from '@/features/timetable/types';

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
const get = (path: string, token: string) => handleMockRequest(request({ method: 'GET', path }), token);

describe('archive: passed-out batch roster (§ archive)', () => {
  it('groups the leaving roster by section with a headcount each', () => {
    const batch = get('/archive/batches/bat-bfa-2023a', admin()) as ArchivedBatchDetail;

    expect(batch.sections.length).toBeGreaterThan(1);
    for (const section of batch.sections) {
      expect(section.studentCount).toBe(section.students.length);
      expect(section.students.length).toBeGreaterThan(0);
    }
    // The batch total reconciles with the sections.
    const summed = batch.sections.reduce((n, s) => n + s.studentCount, 0);
    expect(batch.totalStudents).toBe(summed);
  });

  it('carries each student’s group, board percentage and remarks', () => {
    const batch = get('/archive/batches/bat-bfa-2023a', admin()) as ArchivedBatchDetail;
    const student = batch.students.find((s) => s.boardExam !== null);

    expect(student?.name).toBeTruthy();
    expect(student?.group).toBeTruthy();
    expect(student?.rollNo).toBeTruthy();
    expect(student?.remarks).toBeTruthy();
    expect(student?.boardExam?.percentage).toBeGreaterThan(0);
    expect(student?.boardExam?.grade).toBeTruthy();
    expect(student?.boardExam?.subjects.length).toBeGreaterThan(0);
  });

  it('reports a backend-computed batch average', () => {
    const batch = get('/archive/batches/bat-bfa-2023a', admin()) as ArchivedBatchDetail;
    expect(batch.averagePercentage).not.toBeNull();
    expect(batch.averagePercentage!).toBeGreaterThan(0);
    expect(batch.averagePercentage!).toBeLessThanOrEqual(100);
  });

  it('opens one passed-out student’s full leaving record', () => {
    const batch = get('/archive/batches/bat-bfa-2023a', admin()) as ArchivedBatchDetail;
    const id = batch.students[0]!.id;

    const student = get(`/archive/students/${id}`, admin()) as ArchivedStudentDetail;
    expect(student.name).toBeTruthy();
    expect(student.batch).toBe(batch.name);
    expect(student.academicYear).toBe(batch.academicYear);
    expect(student.tcNumber).toMatch(/^TC\//);
    // Per-subject marks are present and each carries its own grade.
    expect(student.boardExam?.subjects.every((s) => s.marks > 0 && s.grade)).toBe(true);
  });

  it('404s an unknown archived student', () => {
    expect(() => get('/archive/students/alum-nope', admin())).toThrowError(
      expect.objectContaining({ kind: 'not_found' }),
    );
  });
});

describe('timetable scheduling (§ scheduling)', () => {
  const slot = {
    day: 'Sat', batchId: 'bat-bfa-1a', subject: 'Weekend Studio',
    room: 'Studio 1', start: '09:00', end: '11:00', facultyId: 'u-faculty',
  };

  it('requires timetable.manage to schedule', () => {
    expect(() =>
      handleMockRequest(request({ method: 'POST', path: '/timetable', body: slot }), loginAs('faculty@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('schedules a class and assigns the faculty member', () => {
    const created = handleMockRequest(request({ method: 'POST', path: '/timetable', body: slot }), admin()) as TimetableSlot;
    expect(created.id).toMatch(/^tt-/);
    expect(created.subject).toBe('Weekend Studio');
    // Display names are resolved by the backend.
    expect(created.faculty).toBeTruthy();
    expect(created.batch).toBeTruthy();
  });

  it('rejects a faculty double-booking with 409 — a backend rule', () => {
    // Same faculty, same day, overlapping time as an existing Monday class.
    expect(() =>
      handleMockRequest(
        request({
          method: 'POST',
          path: '/timetable',
          body: { day: 'Mon', batchId: 'bat-scul-1a', subject: 'Clash Test', room: 'Ceramics', start: '09:30', end: '10:15', facultyId: 'u-faculty' },
        }),
        admin(),
      ),
    ).toThrowError(expect.objectContaining({ kind: 'conflict', status: 409 }));
  });

  it('rejects an inverted time range', () => {
    expect(() =>
      handleMockRequest(
        request({ method: 'POST', path: '/timetable', body: { ...slot, day: 'Sat', start: '12:00', end: '11:00' } }),
        admin(),
      ),
    ).toThrowError(expect.objectContaining({ kind: 'conflict' }));
  });

  it('reschedules and then removes a slot', () => {
    const created = handleMockRequest(
      request({ method: 'POST', path: '/timetable', body: { ...slot, subject: 'Temp Class', start: '14:00', end: '15:00' } }),
      admin(),
    ) as TimetableSlot;

    const updated = handleMockRequest(
      request({ method: 'PUT', path: `/timetable/${created.id}`, body: { ...slot, subject: 'Renamed Class', start: '14:00', end: '15:00' } }),
      admin(),
    ) as TimetableSlot;
    expect(updated.subject).toBe('Renamed Class');

    const removed = handleMockRequest(request({ method: 'DELETE', path: `/timetable/${created.id}` }), admin()) as { ok: boolean };
    expect(removed.ok).toBe(true);

    expect(() =>
      handleMockRequest(request({ method: 'DELETE', path: `/timetable/${created.id}` }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });

  it('offers every batch, faculty member and room for scheduling', () => {
    const options = get('/timetable/options', admin()) as { batches: unknown[]; faculty: unknown[]; rooms: unknown[] };
    expect(options.batches.length).toBeGreaterThan(0);
    expect(options.faculty.length).toBeGreaterThan(0);
    expect(options.rooms.length).toBeGreaterThan(0);
  });
});
