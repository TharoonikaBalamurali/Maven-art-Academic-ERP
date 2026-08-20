import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, signIn } from '@/test/render';
import { AccountsDashboard } from './components/AccountsDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import type {
  AccountsDashboard as AccountsData,
  AdminDashboard as AdminData,
  FacultyDashboard as FacultyData,
} from './types';

const admin: AdminData = {
  authority: 'admin',
  kpis: {
    totalStudents: 146,
    activeBatches: 5,
    todaysAttendancePct: 92,
    pendingEnquiries: 7,
    pendingApplications: 4,
    feeCollectionThisMonth: 2760000,
    outstandingFees: 1425000,
  },
  students: { total: 146, active: 132, newThisMonth: 9, onLeave: 6, transferred: 3, withdrawn: 3, completed: 2 },
  academics: { totalCourses: 5, activeCourses: 5, totalBatches: 6, activeBatches: 5, classesToday: 5 },
  faculty: { total: 4, active: 4, teachingToday: 3, attendancePending: 2 },
  admissions: {
    newEnquiries: 7,
    followUpsDue: 3,
    pendingApplications: 4,
    underReview: 2,
    approved: 3,
    rejected: 1,
    recentAdmissions: 3,
    pendingEnrollment: 2,
  },
  finance: {
    todaysCollection: 184500,
    monthlyCollection: 2760000,
    outstandingTotal: 1425000,
    studentsWithOutstanding: 4,
    pendingPayments: 12,
    installmentsDue: 3,
    overdueInstallments: 1,
  },
  attendance: {
    todaysPct: 92,
    present: 110,
    absent: 6,
    onLeave: 4,
    classesConducted: 4,
    classesRemaining: 1,
    pendingSubmission: 2,
  },
  studentAffairs: { disciplineOpen: 2, disciplineUnderReview: 1, disciplineActionRequired: 1, leavePending: 3, odPending: 2 },
  documents: { certificatesIssued: 4, certificateRequests: 1 },
  communication: { activeAnnouncements: 2, scheduledAnnouncements: 1, draftAnnouncements: 1 },
  actionCentre: [
    { id: 'ac-app', label: 'Applications to review', count: 4, priority: 'high', permission: 'applications.review', to: '/management/applications' },
    { id: 'ac-disc', label: 'Discipline cases needing action', count: 1, priority: 'high', permission: 'discipline.view' },
  ],
  recentActivity: [
    { id: 'act1', action: 'payment.record', entity: 'pay-903', actor: 'Devi Krishnan', at: '2026-08-19T10:24:00+05:30' },
  ],
  recentAdmissions: [{ id: 'a1', name: 'Neha Krishnan', programme: 'BFA', admittedAt: '2026-08-14' }],
  upcomingClasses: [
    { id: 'c1', batch: 'BFA Year 1 · A', subject: 'Life Drawing', room: 'Studio 2', start: '09:00', end: '10:30' },
  ],
  admissionsTrend: [
    { month: 'Jan', enquiries: 32, admissions: 12 },
    { month: 'Feb', enquiries: 26, admissions: 9 },
  ],
  events: [{ id: 'ev1', date: '2026-08-24', title: 'Parent–teacher meeting' }],
  topPerformers: {
    week: [{ id: 'tp1', name: 'Neha Krishnan', registerNo: 'MAA20260018', className: 'BFA Year 1 · A', score: 98.7 }],
    month: [{ id: 'tp2', name: 'Priya Iyer', registerNo: 'MAA20260009', className: 'BFA Year 2 · A', score: 96.4 }],
    year: [{ id: 'tp3', name: 'Arjun Reddy', registerNo: 'MAA20260003', className: 'BFA Year 3 · A', score: 93.1 }],
  },
  attendanceRings: { students: 92, faculty: 96 },
};

const accounts: AccountsData = {
  authority: 'accounts',
  kpis: { todaysCollection: 184500, monthlyCollection: 2760000, outstandingFees: 1425000, pendingPayments: 12 },
  recentTransactions: [
    { id: 't1', student: 'Arjun Menon', registerNo: 'MAA20260002', amount: 45000, method: 'UPI', at: '2026-08-18T10:24:00.000Z' },
  ],
  upcomingInstallments: [
    { id: 'i1', student: 'Farhan Sheikh', registerNo: 'MAA20260004', amount: 45000, dueOn: '2026-08-25' },
  ],
  collectionsTrend: [
    { month: 'Jan', collected: 2900000, billed: 3400000 },
    { month: 'Feb', collected: 2400000, billed: 2900000 },
  ],
  events: [{ id: 'fev1', date: '2026-08-25', title: 'Installment due · Farhan Sheikh' }],
  collectionRate: 84,
};

const faculty: FacultyData = {
  authority: 'faculty',
  kpis: { todaysClasses: 3, assignedBatches: 2, pendingAttendance: 1, studentCount: 60, attendanceRate: 91, teachingMinutesToday: 270 },
  batches: [
    { id: 'bat-bfa-1a', name: 'BFA Year 1 · A', course: 'BFA — Bachelor of Fine Arts', section: 'A', subjects: ['Life Drawing', 'Art History'], covered: 6, total: 8, nextUp: 'Advanced Figure Composition', studentCount: 32 },
  ],
  todaysActivity: [
    { id: 'c1', subject: 'Life Drawing', batch: 'BFA Year 1 · A', status: 'now', minutes: 90, done: 20, total: 32 },
  ],
  weeklyActivity: [
    { day: 'Mon', totalMinutes: 150, items: [{ id: 'tt-01', subject: 'Life Drawing', batch: 'BFA Year 1 · A', status: 'done' }] },
  ],
  todaysSchedule: [
    { id: 'c1', batch: 'BFA Year 1 · A', subject: 'Life Drawing', room: 'Studio 2', start: '09:00', end: '10:30' },
  ],
  pendingAttendance: [{ id: 'p1', batch: 'BFA Year 1 · A', subject: 'Art History', date: '2026-08-18' }],
  recentAttendance: [
    { id: 'r1', batch: 'BFA Year 1 · A', subject: 'Life Drawing', date: '2026-08-17', present: 30, total: 32 },
  ],
};

describe('AdminDashboard', () => {
  it('shows headline tiles, the trend chart, performers and the action centre', () => {
    signIn('admin', ['students.view', 'payments.view', 'attendance.view', 'admissions.view', 'applications.review', 'progress.view']);
    renderWithProviders(<AdminDashboard data={admin} />);

    expect(screen.getAllByText('Students').length).toBeGreaterThan(0);
    expect(screen.getAllByText('146').length).toBeGreaterThan(0);
    // Attendance ring shows the backend percentage.
    expect(screen.getAllByText('92%').length).toBeGreaterThan(0);
    // Top performers board (progress.view).
    expect(screen.getByRole('heading', { name: 'Top performers' })).toBeInTheDocument();
    expect(screen.getByText('Neha Krishnan')).toBeInTheDocument();
    // Trend chart + action centre.
    expect(screen.getByRole('heading', { name: 'Admissions trend' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Action centre' })).toBeInTheDocument();
    expect(screen.getByText('Applications to review')).toBeInTheDocument();
  });

  it('hides the collection tile and performers from an admin without those permissions', () => {
    signIn('admin', ['students.view']);
    renderWithProviders(<AdminDashboard data={admin} />);

    expect(screen.getAllByText('Students').length).toBeGreaterThan(0);
    expect(screen.queryByText('Collection (month)')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Top performers' })).not.toBeInTheDocument();
  });
});

describe('AccountsDashboard', () => {
  it('is finance-first: collection tiles and the transactions table', () => {
    signIn('accounts', ['payments.view', 'outstanding.view', 'installments.view']);
    renderWithProviders(<AccountsDashboard data={accounts} />);

    expect(screen.getByText("Today's collection")).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Collections' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent transactions' })).toBeInTheDocument();
    expect(screen.getByText('Arjun Menon')).toBeInTheDocument();
    // Currency is formatted, not a raw number.
    expect(screen.getAllByText(/₹/).length).toBeGreaterThan(0);
  });
});

describe('FacultyDashboard', () => {
  it("shows the faculty member's KPIs, batch coverage and today's activity", () => {
    signIn('faculty', ['batches.view', 'attendance.view', 'attendance.mark', 'students.view', 'timetable.view']);
    renderWithProviders(<FacultyDashboard data={faculty} />);

    // Headline teaching KPIs.
    expect(screen.getByText('Attendance rate')).toBeInTheDocument();
    expect(screen.getByText('91%')).toBeInTheDocument();
    // Batch coverage card + today's activity.
    expect(screen.getAllByText('BFA Year 1 · A').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: "Today's activity" })).toBeInTheDocument();
    expect(screen.getAllByText('Life Drawing').length).toBeGreaterThan(0);
    // Mark-attendance action (attendance.mark) and the weekly board (timetable.view).
    expect(screen.getByRole('link', { name: 'Mark attendance' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Weekly activity' })).toBeInTheDocument();
  });

  it('hides mark-attendance and the weekly board without those permissions', () => {
    signIn('faculty', ['batches.view', 'attendance.view', 'students.view']);
    renderWithProviders(<FacultyDashboard data={faculty} />);

    expect(screen.getByRole('heading', { name: "Today's activity" })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mark attendance' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Weekly activity' })).not.toBeInTheDocument();
  });
});
