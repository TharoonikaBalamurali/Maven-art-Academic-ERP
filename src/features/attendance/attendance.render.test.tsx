import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, signIn } from '@/test/render';
import type { AttendanceClass, AttendanceRoster } from './types';

const useTodaysClasses = vi.fn();
const useAttendanceRoster = vi.fn();
const mutateAsync = vi.fn();

vi.mock('./hooks/useAttendance', () => ({
  useTodaysClasses: () => useTodaysClasses(),
  useAttendanceRoster: () => useAttendanceRoster(),
  useSubmitAttendance: () => ({ mutateAsync, isPending: false }),
}));

const { AttendancePage } = await import('./components/AttendancePage');

const CLASSES: AttendanceClass[] = [
  { id: 'cls-1', batchId: 'bat-bfa-1a', batch: 'BFA Year 1 · A', subject: 'Life Drawing', room: 'Studio 2', start: '09:00', end: '10:30', date: '2026-08-18', studentCount: 2, marked: false },
  { id: 'cls-3', batchId: 'bat-bfa-2a', batch: 'BFA Year 2 · A', subject: 'Colour Theory', room: 'Studio 1', start: '11:00', end: '12:30', date: '2026-08-18', studentCount: 2, marked: true },
];

const ROSTER: AttendanceRoster = {
  scheduledClass: CLASSES[0]!,
  students: [
    { id: 'stu-001', registerNo: 'MAA20260001', name: 'Nithya Balan', mark: 'present' },
    { id: 'stu-007', registerNo: 'MAA20260007', name: 'Sneha Kulkarni', mark: 'present' },
  ],
};

function classesResult(data: AttendanceClass[]) {
  return { isPending: false, isError: false, error: null, data, refetch: vi.fn() };
}
function rosterResult(data: AttendanceRoster | undefined) {
  return { isPending: false, isError: false, error: null, data, refetch: vi.fn() };
}

beforeEach(() => {
  vi.clearAllMocks();
  useTodaysClasses.mockReturnValue(classesResult(CLASSES));
  useAttendanceRoster.mockReturnValue(rosterResult(ROSTER));
});

describe('AttendancePage', () => {
  it('lists only the faculty’s own classes — there is no batch picker', () => {
    signIn('faculty', ['attendance.view', 'attendance.mark']);
    renderWithProviders(<AttendancePage />, { route: '/management/attendance' });

    expect(screen.getByText('Life Drawing')).toBeInTheDocument();
    expect(screen.getByText('Colour Theory')).toBeInTheDocument();
    // No free-form batch/class selector — only the assigned classes are shown.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    // Prompt until a class is chosen.
    expect(screen.getByText(/Select a class/i)).toBeInTheDocument();
  });

  it('shows an empty state when the user has no classes to mark', () => {
    useTodaysClasses.mockReturnValue(classesResult([]));
    signIn('admin', ['attendance.view']);
    renderWithProviders(<AttendancePage />, { route: '/management/attendance' });

    expect(screen.getByText('No classes to mark today')).toBeInTheDocument();
  });

  it('loads the roster with present/absent controls for a marker', () => {
    signIn('faculty', ['attendance.view', 'attendance.mark']);
    renderWithProviders(<AttendancePage />, { route: '/management/attendance?class=cls-1' });

    expect(screen.getByText('Nithya Balan')).toBeInTheDocument();
    expect(screen.getAllByRole('radiogroup').length).toBe(2);
    expect(screen.getByRole('button', { name: /submit attendance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark all present/i })).toBeInTheDocument();
  });

  it('submits the marks as present/absent id lists', async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(ROSTER);
    signIn('faculty', ['attendance.view', 'attendance.mark']);
    renderWithProviders(<AttendancePage />, { route: '/management/attendance?class=cls-1' });

    // Mark the first student absent.
    const firstRow = screen.getByText('Nithya Balan').closest('li')!;
    await user.click(within(firstRow).getByRole('radio', { name: 'Absent' }));

    await user.click(screen.getByRole('button', { name: /submit attendance/i }));

    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith({ present: ['stu-007'], absent: ['stu-001'] });
  });

  it('is read-only for a viewer without attendance.mark', () => {
    signIn('admin', ['attendance.view']);
    renderWithProviders(<AttendancePage />, { route: '/management/attendance?class=cls-1' });

    expect(screen.queryByRole('button', { name: /submit attendance/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    // Marks shown as read-only badges instead.
    expect(screen.getAllByText('Present').length).toBeGreaterThan(0);
  });
});
