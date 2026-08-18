import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, signIn } from '@/test/render';
import type { Paginated } from '@/shared/types';
import type { StudentFilterOptions, StudentListItem } from './types';

const useStudents = vi.fn();
const useStudentFilterOptions = vi.fn();

vi.mock('./hooks/useStudents', () => ({
  useStudents: (...args: unknown[]) => useStudents(...args),
  useStudentFilterOptions: (...args: unknown[]) => useStudentFilterOptions(...args),
}));

const { StudentsPage } = await import('./components/StudentsPage');

const ROWS: StudentListItem[] = [
  {
    id: 'stu-001',
    registerNo: 'MAA20260001',
    name: 'Nithya Balan',
    courseId: 'crs-bfa',
    course: 'Bachelor of Fine Arts',
    courseCode: 'BFA',
    batchId: 'bat-bfa-1a',
    batch: 'BFA Year 1 · A',
    section: 'A',
    status: 'active',
  },
  {
    id: 'stu-002',
    registerNo: 'MAA20260004',
    name: 'Farhan Sheikh',
    courseId: 'crs-vcd',
    course: 'Visual Communication & Design',
    courseCode: 'VCD',
    batchId: 'bat-vcd-1a',
    batch: 'VCD Year 1 · A',
    section: 'A',
    status: 'on_leave',
  },
];

function page(overrides: Partial<Paginated<StudentListItem>> = {}) {
  return {
    isPending: false,
    isError: false,
    error: null,
    data: { data: ROWS, page: 1, limit: 10, total: 2, totalPages: 1, ...overrides },
    refetch: vi.fn(),
  };
}

const filterOptions: StudentFilterOptions = {
  courses: [{ id: 'crs-bfa', name: 'Bachelor of Fine Arts' }],
  batches: [{ id: 'bat-bfa-1a', name: 'BFA Year 1 · A', courseId: 'crs-bfa' }],
  sections: ['A', 'B', 'C'],
  statuses: [{ value: 'active', label: 'Active' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  useStudents.mockReturnValue(page());
  useStudentFilterOptions.mockReturnValue({ data: filterOptions, isPending: false });
});

describe('StudentsPage', () => {
  it('renders the §14.1 columns and rows', () => {
    signIn('admin', ['students.view']);
    renderWithProviders(<StudentsPage />);

    for (const header of ['Register No.', 'Name', 'Course', 'Batch', 'Section', 'Status']) {
      expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument();
    }
    // Row content appears in both the desktop table and the mobile card list
    // (one is CSS-hidden), so assert presence, not uniqueness.
    expect(screen.getAllByText('Nithya Balan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MAA20260001').length).toBeGreaterThan(0);
    expect(screen.getAllByText('On leave').length).toBeGreaterThan(0);
    expect(screen.getByText('2 total')).toBeInTheDocument();
  });

  it('shows the New student action only with students.create', () => {
    signIn('admin', ['students.view']);
    const { unmount } = renderWithProviders(<StudentsPage />);
    expect(screen.queryByRole('link', { name: /new student/i })).not.toBeInTheDocument();
    unmount();

    signIn('admin', ['students.view', 'students.create']);
    renderWithProviders(<StudentsPage />);
    expect(screen.getByRole('link', { name: /new student/i })).toHaveAttribute('href', '/management/students/new');
  });

  it('shows the Edit row action only with students.update', () => {
    signIn('faculty', ['students.view']);
    const { unmount } = renderWithProviders(<StudentsPage />);
    expect(screen.getAllByRole('link', { name: 'View' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    unmount();

    signIn('admin', ['students.view', 'students.update']);
    renderWithProviders(<StudentsPage />);
    expect(screen.getAllByRole('link', { name: 'Edit' }).length).toBeGreaterThan(0);
  });

  it('links a row to its detail route', () => {
    signIn('admin', ['students.view']);
    renderWithProviders(<StudentsPage />);
    const view = screen.getAllByRole('link', { name: 'View' })[0];
    expect(view).toHaveAttribute('href', '/management/students/stu-001');
  });

  it('shows the empty state when there are no students and no filters', () => {
    useStudents.mockReturnValue(page({ data: [], total: 0 }));
    signIn('admin', ['students.view']);
    renderWithProviders(<StudentsPage />);
    expect(screen.getByText('No students yet')).toBeInTheDocument();
  });
});
