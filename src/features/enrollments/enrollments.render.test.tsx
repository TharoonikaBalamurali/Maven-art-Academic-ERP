import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { EnrollmentDetail } from './types';

const useEnrollment = vi.fn();

vi.mock('./hooks/useEnrollments', () => ({
  useEnrollment: () => useEnrollment(),
  useEnrollments: vi.fn(),
}));

const { EnrollmentDetailPage } = await import('./components/EnrollmentDetailPage');

function detail(overrides: Partial<EnrollmentDetail> = {}): EnrollmentDetail {
  return {
    id: 'enr-330',
    student: 'Aisha Rahman',
    course: 'Photography',
    batch: 'PH-2026-A',
    status: 'active',
    enrolledAt: '2026-08-06',
    admissionId: 'adm-495',
    note: null,
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/management/enrollments/:enrollmentId" element={<EnrollmentDetailPage />} />
    </Routes>,
    { route: '/management/enrollments/enr-330' },
  );
}

beforeEach(() => vi.clearAllMocks());

describe('EnrollmentDetailPage (§18)', () => {
  it('renders the enrollment record and its status', () => {
    useEnrollment.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['enrollments.view']);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Aisha Rahman' })).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('PH-2026-A')).toBeInTheDocument();
  });

  it('links back to the source admission', () => {
    useEnrollment.mockReturnValue({ isPending: false, isError: false, error: null, data: detail(), refetch: vi.fn() });
    signIn('admin', ['enrollments.view']);
    renderPage();

    expect(screen.getByRole('link', { name: 'adm-495' })).toHaveAttribute(
      'href',
      '/management/admissions/adm-495',
    );
  });

  it('shows a dash for an unassigned batch', () => {
    useEnrollment.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      data: detail({ batch: 'Unassigned', status: 'active' }),
      refetch: vi.fn(),
    });
    signIn('admin', ['enrollments.view']);
    renderPage();

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });
});
