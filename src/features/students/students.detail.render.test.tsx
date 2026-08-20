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
  useUpdateStudentPhoto: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { StudentDetailPage } = await import('./components/StudentDetailPage');

const DETAIL: StudentDetail = {
  id: 'stu-001',
  registerNo: 'MAA20260001',
  admissionNo: 'ADM/2026/1001',
  rollNo: 'BFA-A-01',
  name: 'Nithya Balan',
  photoUrl: null,
  status: 'active',
  joiningDate: '2024-07-20',
  courseId: 'crs-bfa',
  course: 'Bachelor of Fine Arts',
  courseCode: 'BFA',
  batchId: 'bat-bfa-1a',
  batch: 'BFA Year 1 · A',
  section: 'A',
  personal: {
    firstName: 'Nithya',
    middleName: '',
    lastName: 'Balan',
    dateOfBirth: '2005-04-12',
    age: 20,
    gender: 'female',
    email: 'nithya.balan@student.mavenart.test',
    phone: '+91 98000 12345',
    alternatePhone: '',
    address: {
      line1: '12, Gallery Road',
      line2: '',
      area: 'Besant Nagar',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      postalCode: '600090',
    },
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
    {
      id: 'p1',
      parentId: 'par-201',
      name: 'Mr. Ramesh Balan',
      relation: 'Father',
      phone: '+91 97000 11111',
      alternatePhone: '+91 96000 22222',
      email: 'parent.balan@mavenart.test',
      occupation: 'Architect',
      professionalAddress: '3, Commerce Towers, Chennai',
      residentialAddress: '12, Gallery Road, Chennai',
      isEmergencyContact: true,
      guardianStatus: 'Primary guardian',
    },
  ],
  siblings: [
    { id: 's1', name: 'Kabir Balan', relation: 'Brother', dateOfBirth: '2010-05-15', institution: 'Maven Art Academy', className: 'Grade 8' },
  ],
  medical: { foodAllergies: 'Peanuts', otherAllergies: '', accessibility: '', emergencyContact: '+91 90000 33333', notes: '' },
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
  it('shows the identity header and the 360° tabs (§14.1)', () => {
    signIn('admin', ['students.view']);
    renderAt('/management/students/stu-001');

    expect(screen.getByRole('heading', { level: 1, name: 'Nithya Balan' })).toBeInTheDocument();
    // Key identifiers in the profile header.
    expect(screen.getByText('ADM/2026/1001')).toBeInTheDocument();
    expect(screen.getByText('BFA-A-01')).toBeInTheDocument();
    for (const tab of ['Biodata', 'Admission', 'Parent / Guardian', 'Family', 'Academic', 'Attendance', 'Fees', 'Progress', 'Certificates']) {
      expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument();
    }
    // Biodata is the default panel — the student's email is shown there.
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
