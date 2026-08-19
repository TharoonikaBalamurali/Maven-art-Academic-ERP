import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import type { ApiRequest } from '@/lib/api/types';
import { handleMockRequest } from '@/mocks/mock-router';
import { renderWithProviders, signIn } from '@/test/render';
import type { Paginated } from '@/shared/types';
import type { FacultyDetail, FacultyListItem } from './types';

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

describe('faculty mock API', () => {
  it('requires faculty.view', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/faculty' }), loginAs('student@mavenart.test')),
    ).toThrowError(expect.objectContaining({ kind: 'forbidden' }));
  });

  it('lists faculty with derived batch and student counts', () => {
    const page = handleMockRequest(request({ method: 'GET', path: '/faculty' }), admin()) as Paginated<FacultyListItem>;
    expect(page.data.length).toBeGreaterThan(0);
    const suresh = page.data.find((f) => f.id === 'u-faculty')!;
    expect(suresh.batchCount).toBeGreaterThan(0);
    expect(suresh.email).toContain('@');
  });

  it('returns a detail with assigned batches and subjects (§6)', () => {
    const detail = handleMockRequest(request({ method: 'GET', path: '/faculty/u-faculty' }), admin()) as FacultyDetail;
    expect(detail.batches.length).toBe(detail.batchCount);
    expect(detail.subjects.length).toBeGreaterThan(0);
  });

  it('404s an unknown faculty member', () => {
    expect(() =>
      handleMockRequest(request({ method: 'GET', path: '/faculty/nobody' }), admin()),
    ).toThrowError(expect.objectContaining({ kind: 'not_found' }));
  });
});

const useFacultyMember = vi.fn();
vi.mock('./hooks/useFaculty', () => ({
  useFacultyMember: () => useFacultyMember(),
  useFacultyList: vi.fn(),
}));
const { FacultyDetailPage } = await import('./components/FacultyDetailPage');

const DETAIL: FacultyDetail = {
  id: 'u-faculty',
  name: 'Suresh Iyer',
  email: 'suresh.iyer@faculty.mavenart.test',
  batchCount: 2,
  studentCount: 16,
  subjects: ['Life Drawing', 'Colour Theory'],
  batches: [{ id: 'bat-bfa-1a', name: 'BFA Year 1 · A', course: 'Bachelor of Fine Arts', studentCount: 8 }],
};

describe('FacultyDetailPage', () => {
  it('shows the member, subjects and assigned batches linking to the batch', () => {
    useFacultyMember.mockReturnValue({ isPending: false, isError: false, error: null, data: DETAIL, refetch: vi.fn() });
    signIn('admin', ['faculty.view']);
    renderWithProviders(
      <Routes>
        <Route path="/management/faculty/:facultyId" element={<FacultyDetailPage />} />
      </Routes>,
      { route: '/management/faculty/u-faculty' },
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Suresh Iyer' })).toBeInTheDocument();
    expect(screen.getByText('Life Drawing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'BFA Year 1 · A' })).toHaveAttribute('href', '/management/batches/bat-bfa-1a');
  });
});
