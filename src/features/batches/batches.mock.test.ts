import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { Paginated } from '@/shared/types';
import type { BatchDetail, BatchListItem } from './types';

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

function list(query: Record<string, string | number> = {}): Paginated<BatchListItem> {
  return handleMockRequest(request({ method: 'GET', path: '/batches', query }), admin()) as Paginated<BatchListItem>;
}

describe('batches mock API', () => {
  it('requires batches.view', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/batches' }), loginAs('accounts@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('lists batches with resolved course and faculty names', () => {
    const first = list({ limit: 50 }).data[0]!;
    expect(first.course).not.toBe(first.courseId);
    expect(first.faculty).not.toBe(first.facultyId);
    expect(first.studentCount).toBeGreaterThan(0);
  });

  it('filters by course and by status on the server', () => {
    const byCourse = list({ course: 'crs-bfa', limit: 50 });
    expect(byCourse.data.length).toBeGreaterThan(0);
    expect(byCourse.data.every((b) => b.courseId === 'crs-bfa')).toBe(true);

    const inactive = list({ status: 'inactive', limit: 50 });
    expect(inactive.data.every((b) => b.active === false)).toBe(true);
  });

  it('sorts by student count', () => {
    const counts = list({ sortBy: 'students', sortDir: 'asc', limit: 50 }).data.map((b) => b.studentCount);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
  });

  it('returns a relational detail: course, faculty, schedule and roster kept separate (§19)', () => {
    const id = list({ limit: 1 }).data[0]!.id;
    const detail = handleMockRequest(request({ method: 'GET', path: `/batches/${id}` }), admin()) as BatchDetail;

    expect(detail.course.name).toBeTruthy();
    expect(detail.faculty.name).toBeTruthy();
    expect(Array.isArray(detail.schedule)).toBe(true);
    expect(detail.students.length).toBe(detail.studentCount);
    // Every rostered student really belongs to this batch's roster.
    expect(detail.students.every((s) => s.registerNo.startsWith('MAA'))).toBe(true);
  });

  it('404s an unknown batch', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/batches/bat-none' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});
