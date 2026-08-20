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
  SEED_COURSES,
  SEED_FACULTY,
  SEED_RECENT_ADMISSIONS,
  SEED_RECENT_ATTENDANCE,
  SEED_STUDENTS,
  SEED_TRANSACTIONS,
  SEED_UPCOMING_INSTALLMENTS,
  TODAYS_ATTENDANCE_PCT,
  TOTAL_ENROLLED,
} from './seed';
import { listAudit } from './audit-data';

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
  const activeBatches = SEED_BATCHES.filter((b) => b.active).length;
  const teachingToday = new Set(SEED_CLASSES_TODAY.map((c) => c.facultyId)).size;

  // Student status split — believable institutional figures that reconcile to
  // the enrolled total (a real backend computes these; the mock just keeps them
  // internally consistent).
  const students = {
    total: TOTAL_ENROLLED,
    active: TOTAL_ENROLLED - 14,
    newThisMonth: 9,
    onLeave: 6,
    transferred: 3,
    withdrawn: 3,
    completed: 2,
  };

  // Attendance cohort for today's marked classes (present+absent+leave ≈ pct).
  const attendance = {
    todaysPct: TODAYS_ATTENDANCE_PCT,
    present: 110,
    absent: 6,
    onLeave: 4,
    classesConducted: 4,
    classesRemaining: SEED_CLASSES_TODAY.length - 4,
    pendingSubmission: 2,
  };

  const admissions = {
    newEnquiries: PENDING_ENQUIRIES,
    followUpsDue: 3,
    pendingApplications: PENDING_APPLICATIONS,
    underReview: 2,
    approved: 3,
    rejected: 1,
    recentAdmissions: SEED_RECENT_ADMISSIONS.length,
    pendingEnrollment: 2,
  };

  const finance = {
    todaysCollection: FINANCE.todaysCollection,
    monthlyCollection: FINANCE.monthlyCollection,
    outstandingTotal: FINANCE.outstandingTotal,
    studentsWithOutstanding: 4,
    pendingPayments: FINANCE.pendingPaymentsCount,
    installmentsDue: SEED_UPCOMING_INSTALLMENTS.length,
    overdueInstallments: 1,
  };

  const studentAffairs = {
    disciplineOpen: 2,
    disciplineUnderReview: 1,
    disciplineActionRequired: 1,
    leavePending: 3,
    odPending: 2,
  };

  // The backend decides the action centre; the mock derives it from the same
  // figures so counts always agree with the cards above.
  const actionItems: AdminDashboard['actionCentre'] = [
    { id: 'ac-enq', label: 'Enquiries awaiting follow-up', count: admissions.followUpsDue, priority: 'high', permission: 'enquiries.view', to: '/management/enquiries' },
    { id: 'ac-app', label: 'Applications to review', count: admissions.pendingApplications, priority: 'high', permission: 'applications.review', to: '/management/applications' },
    { id: 'ac-adm', label: 'Admissions awaiting enrollment', count: admissions.pendingEnrollment, priority: 'medium', permission: 'admissions.approve', to: '/management/admissions' },
    { id: 'ac-att', label: 'Attendance not yet submitted', count: attendance.pendingSubmission, priority: 'high', permission: 'attendance.view', to: '/management/attendance' },
    { id: 'ac-out', label: 'Students with outstanding fees', count: finance.studentsWithOutstanding, priority: 'medium', permission: 'outstanding.view', to: '/management/outstanding' },
    { id: 'ac-inst', label: 'Overdue installments', count: finance.overdueInstallments, priority: 'medium', permission: 'installments.view', to: '/management/installments' },
    { id: 'ac-disc', label: 'Discipline cases needing action', count: studentAffairs.disciplineActionRequired, priority: 'high', permission: 'discipline.view' },
    { id: 'ac-leave', label: 'Leave requests pending', count: studentAffairs.leavePending, priority: 'medium', permission: 'leave.approve' },
    { id: 'ac-od', label: 'OD requests pending', count: studentAffairs.odPending, priority: 'low', permission: 'od.approve' },
    { id: 'ac-cert', label: 'Certificate requests', count: 1, priority: 'low', permission: 'certificates.issue', to: '/management/certificates' },
  ];
  const actionCentre = actionItems.filter((item) => item.count > 0);

  const recentActivity = listAudit({ page: 1, limit: 6 }).data.map((entry) => ({
    id: entry.id,
    action: entry.action,
    entity: entry.target,
    actor: entry.actor,
    at: entry.at,
  }));

  return {
    authority: 'admin',
    kpis: {
      totalStudents: TOTAL_ENROLLED,
      activeBatches,
      todaysAttendancePct: TODAYS_ATTENDANCE_PCT,
      pendingEnquiries: PENDING_ENQUIRIES,
      pendingApplications: PENDING_APPLICATIONS,
      feeCollectionThisMonth: FINANCE.monthlyCollection,
      outstandingFees: FINANCE.outstandingTotal,
    },
    students,
    academics: {
      totalCourses: SEED_COURSES.length,
      activeCourses: SEED_COURSES.length,
      totalBatches: SEED_BATCHES.length,
      activeBatches,
      classesToday: SEED_CLASSES_TODAY.length,
    },
    faculty: {
      total: SEED_FACULTY.length,
      active: SEED_FACULTY.length,
      teachingToday,
      attendancePending: attendance.pendingSubmission,
    },
    admissions,
    finance,
    attendance,
    studentAffairs,
    documents: { certificatesIssued: 4, certificateRequests: 1 },
    communication: { activeAnnouncements: 2, scheduledAnnouncements: 1, draftAnnouncements: 1 },
    actionCentre,
    recentActivity,
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
