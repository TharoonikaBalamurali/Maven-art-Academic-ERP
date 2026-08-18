import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { renderWithProviders, signIn } from '@/test/render';
import type { StudentDetail } from './types';

const useStudent = vi.fn();
vi.mock('./hooks/useStudents', () => ({
  useStudent: (...args: unknown[]) => useStudent(...args),
}));

const { StudentDetailPage } = await import('./components/StudentDetailPage');

const DETAIL: StudentDetail = {
  id: 'stu-001',
  registerNo: 'MAA20260001',
  name: 'Nithya Balan',
  status: 'active',
  courseId: 'crs-bfa',
  course: 'Bachelor of Fine Arts',
  courseCode: 'BFA',
  batchId: 'bat-bfa-1a',
  batch: 'BFA Year 1 · A',
  section: 'A',
  personal: {
    dateOfBirth: '2005-04-12',
    email: 'nithya.balan@student.mavenart.test',
    phone: '+91 98000 12345',
    address: '12, Gallery Road, Chennai',
    bloodGroup: 'O+',
    admissionDate: '2024-07-15',
  },
  academic: {
    course: 'Bachelor of Fine Arts',
    courseCode: 'BFA',
    batch: 'BFA Year 1 · A',
    section: 'A',
    year: '1st Year',
    enrollmentStatus: 'Enrolled',
  },
  parents: [
    { id: 'p1', name: 'Mr. Ramesh Balan', relation: 'Father', phone: '+91 97000 11111', email: 'parent.balan@mavenart.test' },
  ],
  enrollment: { course: 'Bachelor of Fine Arts', batch: 'BFA Year 1 · A', status: 'Active', startDate: '2024-08-01', endDate: null },
  summary: {
    attendance: { percent: 92, present: 55, total: 60 },
    fees: { total: 90000, paid: 54000, pending: 36000, status: 'partial' },
    progress: { lastSubject: 'Life Drawing', grade: 'A' },
    certificates: { count: 1 },
  },
};

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/management/students/:studentId" element={<StudentDetailPage />} />
    </Routes>,
    { route },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useStudent.mockReturnValue({ isPending: false, isError: false, error: null, data: DETAIL, refetch: vi.fn() });
});

describe('StudentDetailPage', () => {
  it('shows the identity header and all eight tabs (§14.1)', () => {
    signIn('admin', ['students.view']);
    renderAt('/management/students/stu-001');

    expect(screen.getByRole('heading', { level: 1, name: 'Nithya Balan' })).toBeInTheDocument();
    for (const tab of ['Personal', 'Academic', 'Parents', 'Enrollment', 'Attendance', 'Fees', 'Progress', 'Certificates']) {
      expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument();
    }
    // Personal tab is the default panel.
    expect(screen.getByText('nithya.balan@student.mavenart.test')).toBeInTheDocument();
  });

  it('opens the tab named in the URL (deep link)', () => {
    signIn('admin', ['students.view', 'payments.view']);
    renderAt('/management/students/stu-001?tab=fees');

    expect(screen.getByRole('tab', { name: 'Fees' })).toHaveAttribute('aria-selected', 'true');
    // Backend-provided fee figures, formatted; not computed in the frontend.
    expect(screen.getByText('₹90,000')).toBeInTheDocument();
    expect(screen.getByText('Partial')).toBeInTheDocument();
  });

  it('switches tabs on click and reveals that panel', async () => {
    const user = userEvent.setup();
    signIn('admin', ['students.view', 'attendance.view']);
    renderAt('/management/students/stu-001');

    await user.click(screen.getByRole('tab', { name: 'Attendance' }));
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('55/60')).toBeInTheDocument();
  });

  it('gates the cross-module link on that module’s permission', () => {
    signIn('admin', ['students.view']); // no payments.view
    renderAt('/management/students/stu-001?tab=fees');
    expect(screen.queryByRole('link', { name: /open fee record/i })).not.toBeInTheDocument();
  });

  it('gates the Edit action on students.update', () => {
    signIn('faculty', ['students.view']);
    const { unmount } = renderAt('/management/students/stu-001');
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    unmount();

    signIn('admin', ['students.view', 'students.update']);
    renderAt('/management/students/stu-001');
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/management/students/stu-001/edit',
    );
  });

  it('shows a not-found state for an unknown student', () => {
    useStudent.mockReturnValue({
      isPending: false,
      isError: true,
      error: new ApiError({ kind: 'not_found', message: 'The requested information could not be found.', status: 404 }),
      data: undefined,
      refetch: vi.fn(),
    });
    signIn('admin', ['students.view']);
    renderAt('/management/students/stu-999');

    expect(screen.getByText('Not found')).toBeInTheDocument();
  });
});
