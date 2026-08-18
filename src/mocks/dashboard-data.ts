import type {
  AccountsDashboard,
  AdminDashboard,
  DashboardClass,
  DashboardSummary,
  FacultyDashboard,
} from '@/features/dashboard/types';
import type { Role } from '@/shared/types';
import {
  batchName,
  FACULTY_ACCOUNT_ID,
  FINANCE,
  PENDING_APPLICATIONS,
  PENDING_ENQUIRIES,
  SEED_BATCHES,
  SEED_CLASSES_TODAY,
  SEED_RECENT_ADMISSIONS,
  SEED_RECENT_ATTENDANCE,
  SEED_STUDENTS,
  SEED_TRANSACTIONS,
  SEED_UPCOMING_INSTALLMENTS,
  TODAYS_ATTENDANCE_PCT,
  TOTAL_ENROLLED,
} from './seed';

/**
 * Derives each authority's dashboard summary from the shared seed, so every
 * figure is internally consistent (e.g. "Total Students" equals the seeded
 * roster). Mock-only; a real backend computes these.
 */

function toClass(seed: (typeof SEED_CLASSES_TODAY)[number]): DashboardClass {
  return {
    id: seed.id,
    batch: batchName(seed.batchId),
    subject: seed.subject,
    room: seed.room,
    start: seed.start,
    end: seed.end,
  };
}

function adminSummary(): AdminDashboard {
  return {
    authority: 'admin',
    kpis: {
      totalStudents: TOTAL_ENROLLED,
      activeBatches: SEED_BATCHES.filter((b) => b.active).length,
      todaysAttendancePct: TODAYS_ATTENDANCE_PCT,
      pendingEnquiries: PENDING_ENQUIRIES,
      pendingApplications: PENDING_APPLICATIONS,
      feeCollectionThisMonth: FINANCE.monthlyCollection,
      outstandingFees: FINANCE.outstandingTotal,
    },
    recentAdmissions: SEED_RECENT_ADMISSIONS.map((a) => ({ ...a })),
    upcomingClasses: SEED_CLASSES_TODAY.slice(0, 5).map(toClass),
  };
}

function accountsSummary(): AccountsDashboard {
  return {
    authority: 'accounts',
    kpis: {
      todaysCollection: FINANCE.todaysCollection,
      monthlyCollection: FINANCE.monthlyCollection,
      outstandingFees: FINANCE.outstandingTotal,
      pendingPayments: FINANCE.pendingPaymentsCount,
    },
    recentTransactions: SEED_TRANSACTIONS.map((t) => ({ ...t })),
    upcomingInstallments: SEED_UPCOMING_INSTALLMENTS.map((i) => ({ ...i })),
  };
}

function facultySummary(): FacultyDashboard {
  // Only classes and batches assigned to the faculty account (§6): faculty see
  // their own teaching load, never a global view.
  const myClasses = SEED_CLASSES_TODAY.filter((c) => c.facultyId === FACULTY_ACCOUNT_ID);
  const myBatches = SEED_BATCHES.filter((b) => b.facultyId === FACULTY_ACCOUNT_ID);
  const myBatchIds = new Set(myBatches.map((b) => b.id));
  const studentCount = SEED_STUDENTS.filter((s) => myBatchIds.has(s.batchId)).length;

  // A class has "pending attendance" once it has ended today and has no record.
  const pending = myClasses
    .filter((c) => !SEED_RECENT_ATTENDANCE.some((a) => a.batchId === c.batchId && a.subject === c.subject))
    .map((c) => ({ id: c.id, batch: batchName(c.batchId), subject: c.subject, date: '2026-08-18' }));

  return {
    authority: 'faculty',
    kpis: {
      todaysClasses: myClasses.length,
      assignedBatches: myBatches.length,
      pendingAttendance: pending.length,
      studentCount,
    },
    todaysSchedule: myClasses.map(toClass),
    pendingAttendance: pending,
    recentAttendance: SEED_RECENT_ATTENDANCE.filter((a) => myBatchIds.has(a.batchId)).map((a) => ({
      id: a.id,
      batch: batchName(a.batchId),
      subject: a.subject,
      date: a.date,
      present: a.present,
      total: a.total,
    })),
  };
}

export function buildDashboardSummary(role: Role): DashboardSummary | null {
  switch (role) {
    case 'admin':
      return adminSummary();
    case 'accounts':
      return accountsSummary();
    case 'faculty':
      return facultySummary();
    default:
      // Student/Parent have their own portal dashboard (Phase 6).
      return null;
  }
}
