import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { PortalTimetable } from './types';

const usePortalTimetable = vi.fn();

vi.mock('./hooks/usePortal', () => ({
  usePortalTimetable: () => usePortalTimetable(),
}));

const { PortalTimetablePage } = await import('./components/PortalTimetablePage');

const timetable: PortalTimetable = {
  week: [
    {
      day: 'Monday',
      sessions: [
        { subject: 'Life Drawing', time: '09:00 – 10:30', faculty: 'Meera Krishnan', room: 'Studio 1' },
        { subject: 'Art History', time: '11:00 – 12:00', faculty: 'Arun Prasad', room: 'Lecture Hall' },
      ],
    },
    { day: 'Tuesday', sessions: [] },
  ],
};

beforeEach(() => vi.clearAllMocks());

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/portal/timetable" element={<PortalTimetablePage />} />
    </Routes>,
    { route: '/portal/timetable' },
  );
}

describe('PortalTimetablePage (§7)', () => {
  it('lays each day out as its own column, headed by the day and class count', () => {
    usePortalTimetable.mockReturnValue({ isPending: false, isError: false, error: null, data: timetable, refetch: vi.fn() });
    signIn('student', ['portal.timetable.view']);
    renderPage();

    // Each day is a labelled region (accessible section).
    expect(screen.getByRole('region', { name: 'Monday' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Tuesday' })).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('shows each class as a card with subject, time, room and faculty', () => {
    usePortalTimetable.mockReturnValue({ isPending: false, isError: false, error: null, data: timetable, refetch: vi.fn() });
    signIn('student', ['portal.timetable.view']);
    renderPage();

    expect(screen.getByText('Life Drawing')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 10:30')).toBeInTheDocument();
    expect(screen.getByText('Studio 1')).toBeInTheDocument();
    expect(screen.getByText('Meera Krishnan')).toBeInTheDocument();
  });

  it('keeps a free day in the board with a no-classes note', () => {
    usePortalTimetable.mockReturnValue({ isPending: false, isError: false, error: null, data: timetable, refetch: vi.fn() });
    signIn('student', ['portal.timetable.view']);
    renderPage();

    const tuesday = screen.getByRole('region', { name: 'Tuesday' });
    expect(tuesday).toHaveTextContent('No classes');
  });
});
