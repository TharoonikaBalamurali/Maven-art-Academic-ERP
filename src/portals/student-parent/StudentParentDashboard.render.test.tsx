import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, signIn } from '@/test/render';
import type { PortalOverview } from '@/features/portal/types';

const usePortalOverview = vi.fn();
const useNotifications = vi.fn();

vi.mock('@/features/portal/hooks/usePortal', () => ({
  usePortalOverview: () => usePortalOverview(),
}));
vi.mock('@/features/notifications/hooks/useNotifications', () => ({
  useNotifications: () => useNotifications(),
}));

const { StudentParentDashboard } = await import('./pages/StudentParentDashboard');

function overview(overrides: Partial<PortalOverview> = {}): PortalOverview {
  return {
    student: { name: 'Nithya Balan', registerNo: 'MAA20260001', course: 'Bachelor of Fine Arts', batch: 'BFA Year 1 · A' },
    attendance: { percentage: 92, present: 118, total: 128 },
    fees: { assigned: 158000, paid: 60000, outstanding: 98000, status: 'partial' },
    nextClass: { subject: 'Foundation Drawing', day: 'Monday', time: '09:00 – 10:30', room: 'Studio 2' },
    latestGrade: { assessment: 'Foundation Drawing — Midterm', grade: 'A+' },
    pendingTasks: 3,
    todaySchedule: [
      { id: 't1', subject: 'Art History', time: '11:00 – 12:00', room: 'Room 4', status: 'now' },
    ],
    upcomingActivities: [{ id: 'a1', title: 'Art History — Quiz', date: '2026-08-22', meta: 'Room 4' }],
    reminders: [{ id: 'r1', label: 'Next class', detail: 'Art History', to: '/portal/timetable' }],
    recentGrades: [{ id: 'g1', assessment: 'Foundation Drawing — Midterm', grade: 'A+' }],
    ...overrides,
  };
}

function renderDashboard() {
  return renderWithProviders(
    <Routes>
      <Route path="/portal" element={<StudentParentDashboard />} />
    </Routes>,
    { route: '/portal' },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useNotifications.mockReturnValue({ data: { data: [{ id: 'n1', category: 'academic', title: 'Grades published', body: '', read: false, createdAt: '2026-08-19T10:00:00Z' }] } });
});

describe('StudentParentDashboard', () => {
  it('greets the student and shows their scoped figures and feeds', () => {
    usePortalOverview.mockReturnValue({ data: overview(), isPending: false, isError: false, refetch: vi.fn() });
    signIn('student', ['portal.dashboard.view', 'portal.attendance.view', 'portal.fees.view', 'portal.progress.view', 'portal.timetable.view', 'notifications.view']);
    renderDashboard();

    // Greeting hero (name comes from the signed-in identity's display name).
    expect(screen.getByRole('heading', { level: 1, name: /Test/ })).toBeInTheDocument();
    // Backend figures rendered verbatim.
    expect(screen.getAllByText('92%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('₹98,000').length).toBeGreaterThan(0);
    // Today's schedule marks the current class.
    expect(screen.getByText('Now')).toBeInTheDocument();
    // Feeds present.
    expect(screen.getByText('Art History — Quiz')).toBeInTheDocument();
    expect(screen.getByText('Grades published')).toBeInTheDocument();
  });

  it('hides the fees section from a caller without portal.fees.view', () => {
    usePortalOverview.mockReturnValue({ data: overview(), isPending: false, isError: false, refetch: vi.fn() });
    signIn('student', ['portal.dashboard.view', 'portal.progress.view']);
    renderDashboard();

    expect(screen.queryByText('Fee summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Fees due')).not.toBeInTheDocument();
  });

  it('shows the parent child switcher when portal.children.view is held', () => {
    usePortalOverview.mockReturnValue({ data: overview(), isPending: false, isError: false, refetch: vi.fn() });
    signIn('parent', ['portal.dashboard.view', 'portal.children.view']);
    renderDashboard();

    expect(screen.getByText(/Viewing/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Switch' })).toHaveAttribute('href', '/portal/children');
  });
});
