import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
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
  it('lays the week out as one table with a shared set of columns', () => {
    usePortalTimetable.mockReturnValue({ isPending: false, isError: false, error: null, data: timetable, refetch: vi.fn() });
    signIn('student', ['portal.timetable.view']);
    renderPage();

    const table = screen.getByRole('table', { name: /weekly class schedule/i });
    for (const column of ['Time', 'Subject', 'Faculty', 'Room']) {
      expect(within(table).getByRole('columnheader', { name: column })).toBeInTheDocument();
    }
  });

  it('groups each day’s sessions under the day, with its class count', () => {
    usePortalTimetable.mockReturnValue({ isPending: false, isError: false, error: null, data: timetable, refetch: vi.fn() });
    signIn('student', ['portal.timetable.view']);
    renderPage();

    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('2 classes')).toBeInTheDocument();
    expect(screen.getByText('Life Drawing')).toBeInTheDocument();
    expect(screen.getByText('Meera Krishnan')).toBeInTheDocument();
    expect(screen.getByText('Studio 1')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 10:30')).toBeInTheDocument();
  });

  it('shows a free day as an empty row rather than omitting it', () => {
    usePortalTimetable.mockReturnValue({ isPending: false, isError: false, error: null, data: timetable, refetch: vi.fn() });
    signIn('student', ['portal.timetable.view']);
    renderPage();

    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('No classes')).toBeInTheDocument();
    expect(screen.getByText('No classes scheduled.')).toBeInTheDocument();
  });
});
