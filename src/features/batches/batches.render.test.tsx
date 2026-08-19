import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { BatchDetail } from './types';

const useBatch = vi.fn();
vi.mock('./hooks/useBatches', () => ({
  useBatch: () => useBatch(),
  useBatches: vi.fn(),
}));

const { BatchDetailPage } = await import('./components/BatchDetailPage');

const DETAIL: BatchDetail = {
  id: 'bat-bfa-1a',
  name: 'BFA Year 1 · A',
  section: 'A',
  active: true,
  course: { id: 'crs-bfa', code: 'BFA', name: 'Bachelor of Fine Arts' },
  faculty: { id: 'u-faculty', name: 'Suresh Iyer' },
  studentCount: 2,
  schedule: [
    { id: 'cls-1', subject: 'Life Drawing', room: 'Studio 2', start: '09:00', end: '10:30', facultyId: 'u-faculty', faculty: 'Suresh Iyer' },
  ],
  students: [
    { id: 'stu-001', registerNo: 'MAA20260001', name: 'Nithya Balan', status: 'active' },
    { id: 'stu-007', registerNo: 'MAA20260007', name: 'Sneha Kulkarni', status: 'on_leave' },
  ],
};

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/management/batches/:batchId" element={<BatchDetailPage />} />
    </Routes>,
    { route },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useBatch.mockReturnValue({ isPending: false, isError: false, error: null, data: DETAIL, refetch: vi.fn() });
});

describe('BatchDetailPage', () => {
  it('keeps course, faculty, section and enrolment as distinct facts (§19)', () => {
    signIn('admin', ['batches.view']);
    renderAt('/management/batches/bat-bfa-1a');

    expect(screen.getByRole('heading', { level: 1, name: 'BFA Year 1 · A' })).toBeInTheDocument();
    expect(screen.getByText('Bachelor of Fine Arts')).toBeInTheDocument();
    expect(screen.getByText('Suresh Iyer')).toBeInTheDocument();
  });

  it('shows Students and Schedule tabs; students link to their record', () => {
    signIn('admin', ['batches.view']);
    renderAt('/management/batches/bat-bfa-1a');

    expect(screen.getByRole('tab', { name: /Students/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Schedule' })).toBeInTheDocument();

    const studentLink = screen.getByRole('link', { name: 'Nithya Balan' });
    expect(studentLink).toHaveAttribute('href', '/management/students/stu-001');
  });

  it('opens the Schedule tab from the URL and shows the class slot', () => {
    signIn('admin', ['batches.view']);
    renderAt('/management/batches/bat-bfa-1a?tab=schedule');

    expect(screen.getByRole('tab', { name: 'Schedule' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Life Drawing')).toBeInTheDocument();
    expect(screen.getByText('Studio 2')).toBeInTheDocument();
  });

  it('switches to Schedule on click', async () => {
    const user = userEvent.setup();
    signIn('admin', ['batches.view']);
    renderAt('/management/batches/bat-bfa-1a');

    await user.click(screen.getByRole('tab', { name: 'Schedule' }));
    expect(screen.getByText('Life Drawing')).toBeInTheDocument();
  });
});
