import type { Id, IsoDateString, Role } from '@/shared/types';

/**
 * Dashboard summary types (§13).
 *
 * A discriminated union on `authority`: the backend returns the summary shaped
 * for the caller's role, and the UI narrows on `authority` to render the right
 * dashboard. Each authority gets a purpose-built payload — Admin operational,
 * Accounts financial, Faculty academic — rather than one generic bag of
 * widgets.
 *
 * TBD — BACKEND CONTRACT: field names are provisional. Authoritative figures
 * (counts, balances, percentages) are computed by the backend; the frontend
 * only displays them.
 */

export interface DashboardClass {
  id: Id;
  batch: string;
  subject: string;
  room: string;
  /** 24h "HH:MM". */
  start: string;
  end: string;
}

export interface AdminDashboard {
  authority: 'admin';
  kpis: {
    totalStudents: number;
    activeBatches: number;
    todaysAttendancePct: number;
    pendingEnquiries: number;
    pendingApplications: number;
    feeCollectionThisMonth: number;
    outstandingFees: number;
  };
  recentAdmissions: { id: Id; name: string; programme: string; admittedAt: IsoDateString }[];
  upcomingClasses: DashboardClass[];
}

export interface AccountsDashboard {
  authority: 'accounts';
  kpis: {
    todaysCollection: number;
    monthlyCollection: number;
    outstandingFees: number;
    pendingPayments: number;
  };
  recentTransactions: {
    id: Id;
    student: string;
    registerNo: string;
    amount: number;
    method: string;
    at: IsoDateString;
  }[];
  upcomingInstallments: {
    id: Id;
    student: string;
    registerNo: string;
    amount: number;
    dueOn: IsoDateString;
  }[];
}

export interface FacultyDashboard {
  authority: 'faculty';
  kpis: {
    todaysClasses: number;
    assignedBatches: number;
    pendingAttendance: number;
    studentCount: number;
  };
  todaysSchedule: DashboardClass[];
  pendingAttendance: { id: Id; batch: string; subject: string; date: IsoDateString }[];
  recentAttendance: {
    id: Id;
    batch: string;
    subject: string;
    date: IsoDateString;
    present: number;
    total: number;
  }[];
}

export type DashboardSummary = AdminDashboard | AccountsDashboard | FacultyDashboard;

/** Which management roles have a dashboard shape. */
export const DASHBOARD_AUTHORITIES: readonly Role[] = ['admin', 'accounts', 'faculty'];
