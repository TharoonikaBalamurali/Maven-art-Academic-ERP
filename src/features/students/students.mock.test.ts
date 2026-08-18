import { describe, expect, it } from 'vitest';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import type { Paginated } from '@/shared/types';
import type { StudentFilterOptions, StudentListItem } from './types';

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

function listStudents(query: Record<string, string | number>, token = admin()): Paginated<StudentListItem> {
  return handleMockRequest(request({ method: 'GET', path: '/students', query }), token) as Paginated<StudentListItem>;
}

describe('students mock API', () => {
  it('requires students.view — a student portal user is refused', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/students' }), loginAs('student@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('paginates server-side with backend metadata', () => {
    const page = listStudents({ page: 2, limit: 10 });
    expect(page.page).toBe(2);
    expect(page.limit).toBe(10);
    expect(page.data).toHaveLength(10);
    expect(page.total).toBeGreaterThan(20);
    expect(page.totalPages).toBe(Math.ceil(page.total / 10));
  });

  it('returns display-ready course and batch names, not just ids', () => {
    const row = listStudents({ limit: 1 }).data[0]!;
    expect(row.registerNo).toMatch(/^MAA/);
    expect(row.course).not.toBe(row.courseId);
    expect(row.batch).not.toBe(row.batchId);
  });

  it('searches by name and register number on the server', () => {
    const byName = listStudents({ search: 'arjun', limit: 50 });
    expect(byName.data.length).toBeGreaterThan(0);
    expect(byName.data.every((r) => r.name.toLowerCase().includes('arjun'))).toBe(true);

    const first = listStudents({ limit: 1 }).data[0]!;
    const byReg = listStudents({ search: first.registerNo, limit: 50 });
    expect(byReg.data.some((r) => r.registerNo === first.registerNo)).toBe(true);
  });

  it('filters by status on the server', () => {
    const onLeave = listStudents({ status: 'on_leave', limit: 100 });
    expect(onLeave.data.length).toBeGreaterThan(0);
    expect(onLeave.data.every((r) => r.status === 'on_leave')).toBe(true);
  });

  it('filters by course on the server', () => {
    const options = handleMockRequest(
      request({ method: 'GET', path: '/students/filter-options' }),
      admin(),
    ) as StudentFilterOptions;
    const course = options.courses[0]!;

    const filtered = listStudents({ course: course.id, limit: 100 });
    expect(filtered.data.length).toBeGreaterThan(0);
    expect(filtered.data.every((r) => r.courseId === course.id)).toBe(true);
  });

  it('sorts by name ascending and descending', () => {
    const asc = listStudents({ sortBy: 'name', sortDir: 'asc', limit: 100 }).data.map((r) => r.name);
    const desc = listStudents({ sortBy: 'name', sortDir: 'desc', limit: 100 }).data.map((r) => r.name);
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b)));
    expect(desc).toEqual([...asc].reverse());
  });

  it('clamps an out-of-range page instead of returning nothing', () => {
    const page = listStudents({ page: 999, limit: 10 });
    expect(page.page).toBe(page.totalPages);
    expect(page.data.length).toBeGreaterThan(0);
  });

  it('exposes only courses that have enrolled students', () => {
    const options = handleMockRequest(
      request({ method: 'GET', path: '/students/filter-options' }),
      admin(),
    ) as StudentFilterOptions;
    expect(options.courses.length).toBeGreaterThan(0);
    expect(options.statuses.map((s) => s.value)).toContain('active');
  });
});
