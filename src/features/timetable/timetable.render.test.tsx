import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, signIn } from '@/test/render';
import type { TimetableOptions, TimetableSlot } from './types';

const useTimetable = vi.fn();
const useTimetableOptions = vi.fn();

vi.mock('./hooks/useTimetable', () => ({
  useTimetable: () => useTimetable(),
  useTimetableOptions: () => useTimetableOptions(),
}));

const { TimetablePage } = await import('./components/TimetablePage');

const SLOTS: TimetableSlot[] = [
  { id: 'tt-01', day: 'Mon', batchId: 'bat-bfa-1a', batch: 'BFA Year 1 · A', subject: 'Life Drawing', room: 'Studio 2', start: '09:00', end: '10:30', facultyId: 'u-faculty', faculty: 'Suresh Iyer' },
  { id: 'tt-03', day: 'Mon', batchId: 'bat-bfa-2a', batch: 'BFA Year 2 · A', subject: 'Colour Theory', room: 'Studio 1', start: '11:00', end: '12:30', facultyId: 'u-faculty', faculty: 'Suresh Iyer' },
  { id: 'tt-11', day: 'Thu', batchId: 'bat-vcd-1a', batch: 'VCD Year 1 · A', subject: 'Typography', room: 'Design Lab', start: '09:00', end: '10:30', facultyId: 'fac-002', faculty: 'Meera Nair' },
];

const OPTIONS: TimetableOptions = {
  batches: [{ id: 'bat-bfa-1a', name: 'BFA Year 1 · A' }],
  faculty: [{ id: 'u-faculty', name: 'Suresh Iyer' }],
  rooms: ['Studio 1', 'Studio 2', 'Design Lab'],
};

function timetableResult(data: TimetableSlot[]) {
  return { isPending: false, isError: false, error: null, data, refetch: vi.fn() };
}

beforeEach(() => {
  vi.clearAllMocks();
  useTimetable.mockReturnValue(timetableResult(SLOTS));
  useTimetableOptions.mockReturnValue({ data: OPTIONS, isPending: false });
});

describe('TimetablePage', () => {
  it('lays out the five weekday columns', () => {
    signIn('admin', ['timetable.view']);
    renderWithProviders(<TimetablePage />, { route: '/management/timetable' });

    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      expect(screen.getByRole('region', { name: day })).toBeInTheDocument();
    }
  });

  it('places each class under its day with time, batch, room and faculty', () => {
    signIn('admin', ['timetable.view']);
    renderWithProviders(<TimetablePage />, { route: '/management/timetable' });

    const monday = screen.getByRole('region', { name: 'Monday' });
    expect(monday).toHaveTextContent('Life Drawing');
    expect(monday).toHaveTextContent('Colour Theory');
    expect(monday).toHaveTextContent('Studio 2');

    const thursday = screen.getByRole('region', { name: 'Thursday' });
    expect(thursday).toHaveTextContent('Typography');
    // Tuesday has nothing scheduled.
    expect(screen.getByRole('region', { name: 'Tuesday' })).toHaveTextContent('No classes');
  });

  it('offers batch, faculty and room filters', () => {
    signIn('admin', ['timetable.view']);
    renderWithProviders(<TimetablePage />, { route: '/management/timetable' });

    expect(screen.getByLabelText('Batch')).toBeInTheDocument();
    expect(screen.getByLabelText('Faculty')).toBeInTheDocument();
    expect(screen.getByLabelText('Room')).toBeInTheDocument();
  });

  it('shows an empty state when the schedule (or filter) yields nothing', () => {
    useTimetable.mockReturnValue(timetableResult([]));
    signIn('admin', ['timetable.view']);
    renderWithProviders(<TimetablePage />, { route: '/management/timetable?room=Ceramics' });

    expect(screen.getByText('No classes scheduled')).toBeInTheDocument();
    expect(screen.getByText(/No classes match the selected filters/i)).toBeInTheDocument();
  });
});
