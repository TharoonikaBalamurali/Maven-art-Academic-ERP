import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import { renderWithProviders, signIn } from '@/test/render';
import type { Paginated } from '@/shared/types';
import type { CourseDetail, CourseListItem } from './types';

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

describe('courses mock API', () => {
  it('requires courses.view', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/courses' }), loginAs('student@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('lists courses with batch and student counts', () => {
    const page = handleMockRequest(request({ method: 'GET', path: '/courses' }), admin()) as Paginated<CourseListItem>;
    expect(page.data.length).toBeGreaterThan(0);
    expect(page.data[0]!.code).toBeTruthy();
  });

  it('searches by code and name', () => {
    const page = handleMockRequest(
      request({ method: 'GET', path: '/courses', query: { search: 'bfa' } }),
      admin(),
    ) as Paginated<CourseListItem>;
    expect(page.data.some((c) => c.code === 'BFA')).toBe(true);
  });

  it('returns a detail with its batches (§19)', () => {
    const detail = handleMockRequest(request({ method: 'GET', path: '/courses/crs-bfa' }), admin()) as CourseDetail;
    expect(detail.code).toBe('BFA');
    expect(detail.batches.length).toBe(detail.batchCount);
  });

  it('404s an unknown course', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/courses/nope' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});

const useCourse = vi.fn();
vi.mock('./hooks/useCourses', () => ({
  useCourse: () => useCourse(),
  useCourses: vi.fn(),
}));
const { CourseDetailPage } = await import('./components/CourseDetailPage');

const DETAIL: CourseDetail = {
  id: 'crs-bfa',
  code: 'BFA',
  name: 'Bachelor of Fine Arts',
  batchCount: 2,
  studentCount: 16,
  batches: [
    { id: 'bat-bfa-1a', name: 'BFA Year 1 · A', section: 'A', faculty: 'Suresh Iyer', studentCount: 8, active: true },
  ],
};

describe('CourseDetailPage', () => {
  it('shows the course and its batches linking to the batch', () => {
    useCourse.mockReturnValue({ isPending: false, isError: false, error: null, data: DETAIL, refetch: vi.fn() });
    signIn('admin', ['courses.view']);
    renderWithProviders(
      <Routes>
        <Route path="/management/courses/:courseId" element={<CourseDetailPage />} />
      </Routes>,
      { route: '/management/courses/crs-bfa' },
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Bachelor of Fine Arts' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'BFA Year 1 · A' })).toHaveAttribute('href', '/management/batches/bat-bfa-1a');
  });
});
