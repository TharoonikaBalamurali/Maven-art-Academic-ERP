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
};

const faculty: FacultyData = {
  authority: 'faculty',
  kpis: { todaysClasses: 3, assignedBatches: 2, pendingAttendance: 1, studentCount: 60 },
  todaysSchedule: [
    { id: 'c1', batch: 'BFA Year 1 · A', subject: 'Life Drawing', room: 'Studio 2', start: '09:00', end: '10:30' },
  ],
  pendingAttendance: [{ id: 'p1', batch: 'BFA Year 1 · A', subject: 'Art History', date: '2026-08-18' }],
  recentAttendance: [
    { id: 'r1', batch: 'BFA Year 1 · A', subject: 'Life Drawing', date: '2026-08-17', present: 30, total: 32 },
  ],
};

describe('AdminDashboard', () => {
  it('shows operational figures formatted for the institution', () => {
    signIn('admin', ['students.view', 'payments.view', 'attendance.view', 'admissions.view', 'applications.review']);
    renderWithProviders(<AdminDashboard data={admin} />);

    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getAllByText('146').length).toBeGreaterThan(0);
    expect(screen.getAllByText('92%').length).toBeGreaterThan(0);
    expect(screen.getByText('Neha Krishnan')).toBeInTheDocument();
    // New sections are present and permission-gated.
    expect(screen.getByRole('heading', { name: 'Action centre' })).toBeInTheDocument();
    expect(screen.getByText('Applications to review')).toBeInTheDocument();
  });

  it('hides the collection tile from an admin without payments.view', () => {
    signIn('admin', ['students.view']);
    renderWithProviders(<AdminDashboard data={admin} />);

    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.queryByText('Collection (This Month)')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent admissions')).not.toBeInTheDocument();
  });
});

describe('AccountsDashboard', () => {
  it('is finance-first: collection tiles and the transactions table', () => {
    signIn('accounts', ['payments.view', 'outstanding.view', 'installments.view']);
    renderWithProviders(<AccountsDashboard data={accounts} />);

    expect(screen.getByText("Today's Collection")).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent transactions' })).toBeInTheDocument();
    expect(screen.getByText('Arjun Menon')).toBeInTheDocument();
    // Currency is formatted, not a raw number.
    expect(screen.getAllByText(/₹/).length).toBeGreaterThan(0);
  });
});

describe('FacultyDashboard', () => {
  it("shows the faculty member's own schedule and attendance", () => {
    signIn('faculty', ['batches.view', 'attendance.view', 'attendance.mark', 'students.view', 'timetable.view']);
    renderWithProviders(<FacultyDashboard data={faculty} />);

    expect(screen.getByRole('heading', { name: "Today's schedule" })).toBeInTheDocument();
    // "Life Drawing" legitimately appears in both the schedule and the recent
    // attendance table — its presence, not uniqueness, is what matters.
    expect(screen.getAllByText('Life Drawing').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Attendance to mark' })).toBeInTheDocument();
  });

  it('hides the mark-attendance widget from faculty without attendance.mark', () => {
    signIn('faculty', ['batches.view', 'attendance.view', 'students.view']);
    renderWithProviders(<FacultyDashboard data={faculty} />);

    expect(screen.getByText("Today's schedule")).toBeInTheDocument();
    expect(screen.queryByText('Attendance to mark')).not.toBeInTheDocument();
  });
});
