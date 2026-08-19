import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { TimetableOptions, TimetableSlot } from './types';

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

const admin = () => loginAs('admin@mavenart.test');

function timetable(query: Record<string, string> = {}, token = admin()): TimetableSlot[] {
  return handleMockRequest(request({ method: 'GET', path: '/timetable', query }), token) as TimetableSlot[];
}

describe('timetable mock API', () => {
  it('requires timetable.view', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/timetable' }), loginAs('accounts@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('returns the full week with resolved batch and faculty names', () => {
    const slots = timetable();
    expect(slots.length).toBeGreaterThan(10);
    const first = slots[0]!;
    expect(first.batch).not.toBe(first.batchId);
    expect(first.faculty).not.toBe(first.facultyId);
    expect(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).toContain(first.day);
  });

  it('filters by batch on the server (Batch view)', () => {
    const slots = timetable({ batchId: 'bat-bfa-1a' });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.batchId === 'bat-bfa-1a')).toBe(true);
  });

  it('filters by faculty on the server (Faculty view)', () => {
    const slots = timetable({ facultyId: 'u-faculty' });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.facultyId === 'u-faculty')).toBe(true);
  });

  it('filters by room on the server (Room view)', () => {
    const slots = timetable({ room: 'Design Lab' });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.room === 'Design Lab')).toBe(true);
  });

  it('combines filters', () => {
    const slots = timetable({ facultyId: 'u-faculty', batchId: 'bat-bfa-1a' });
    expect(slots.every((s) => s.facultyId === 'u-faculty' && s.batchId === 'bat-bfa-1a')).toBe(true);
  });

  it('exposes filter options limited to what appears in the schedule', () => {
    const options = handleMockRequest(
      request({ method: 'GET', path: '/timetable/options' }),
      admin(),
    ) as TimetableOptions;
    expect(options.batches.length).toBeGreaterThan(0);
    expect(options.faculty.length).toBeGreaterThan(0);
    expect(options.rooms.length).toBeGreaterThan(0);
  });

  it('does not resolve /timetable/options to the list endpoint', () => {
    const options = handleMockRequest(
      request({ method: 'GET', path: '/timetable/options' }),
      admin(),
    ) as TimetableOptions;
    expect(Array.isArray((options as unknown as TimetableSlot[]))).toBe(false);
    expect(options.rooms).toBeDefined();
  });
});
