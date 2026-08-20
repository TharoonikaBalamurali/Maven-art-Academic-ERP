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
  courseCode,
  courseName,
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
  SEED_TIMETABLE,
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Demonstration monthly series — a real backend aggregates these.
const ADMISSIONS_TREND = [
  [32, 12], [26, 9], [18, 7], [30, 14], [12, 5], [22, 8],
  [41, 18], [28, 11], [34, 15], [26, 12], [17, 6], [23, 10],
];
const COLLECTIONS_TREND = [
  [2.9, 3.4], [2.4, 2.9], [1.8, 2.2], [2.6, 2.9], [1.2, 1.8], [2.2, 2.4],
  [3.6, 3.9], [2.8, 3.1], [3.2, 3.4], [2.6, 2.9], [1.7, 2.1], [2.3, 2.6],
];

const DASHBOARD_EVENTS = [
  { id: 'ev-1', date: '2026-08-22', title: 'Art History — Quiz' },
  { id: 'ev-2', date: '2026-08-24', title: 'Parent–teacher meeting' },
  { id: 'ev-3', date: '2026-08-28', title: 'Annual function' },
  { id: 'ev-4', date: '2026-09-05', title: 'Sports competition' },
];

const TOP_PERFORMERS = {
  week: [
    { id: 'tp-1', name: 'Neha Krishnan', registerNo: 'MAA20260018', className: 'BFA Year 1 · A', score: 98.7 },
    { id: 'tp-2', name: 'Aisha Rahman', registerNo: 'MAA20260014', className: 'Photography · A', score: 98.2 },
    { id: 'tp-3', name: 'Kabir Menon', registerNo: 'MAA20260024', className: 'VCD Year 1 · B', score: 97.0 },
  ],
  month: [
    { id: 'tp-4', name: 'Priya Iyer', registerNo: 'MAA20260009', className: 'BFA Year 2 · A', score: 96.4 },
    { id: 'tp-1', name: 'Neha Krishnan', registerNo: 'MAA20260018', className: 'BFA Year 1 · A', score: 95.8 },
    { id: 'tp-5', name: 'Rahul Verma', registerNo: 'MAA20260021', className: 'VCD Year 1 · B', score: 94.9 },
  ],
  year: [
    { id: 'tp-6', name: 'Arjun Reddy', registerNo: 'MAA20260003', className: 'BFA Year 3 · A', score: 93.1 },
    { id: 'tp-4', name: 'Priya Iyer', registerNo: 'MAA20260009', className: 'BFA Year 2 · A', score: 92.6 },
    { id: 'tp-2', name: 'Aisha Rahman', registerNo: 'MAA20260014', className: 'Photography · A', score: 91.7 },
  ],
};

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
    admissionsTrend: MONTHS.map((month, i) => ({
      month,
      enquiries: ADMISSIONS_TREND[i]?.[0] ?? 0,
      admissions: ADMISSIONS_TREND[i]?.[1] ?? 0,
    })),
    events: DASHBOARD_EVENTS.map((e) => ({ ...e })),
    topPerformers: {
      week: TOP_PERFORMERS.week.map((p) => ({ ...p })),
      month: TOP_PERFORMERS.month.map((p) => ({ ...p })),
      year: TOP_PERFORMERS.year.map((p) => ({ ...p })),
    },
    attendanceRings: { students: TODAYS_ATTENDANCE_PCT, faculty: 96 },
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
    collectionsTrend: MONTHS.map((month, i) => ({
      month,
      // Stored in whole rupees; the chart formats to lakhs/thousands.
      collected: Math.round((COLLECTIONS_TREND[i]?.[0] ?? 0) * 1_000_000),
      billed: Math.round((COLLECTIONS_TREND[i]?.[1] ?? 0) * 1_000_000),
    })),
    events: SEED_UPCOMING_INSTALLMENTS.map((inst) => ({
      id: `fev-${inst.id}`,
      date: inst.dueOn,
      title: `Installment due · ${inst.student}`,
    })),
    collectionRate: 84,
  };
}

function minutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh ?? 0) * 60 + (em ?? 0) - ((sh ?? 0) * 60 + (sm ?? 0));
}

// Deterministic coverage per batch — echoes the reference's 6/8, 3/8 feel.
const BATCH_COVERAGE: Record<string, { covered: number; total: number; nextUp: string }> = {
  'bat-bfa-1a': { covered: 6, total: 8, nextUp: 'Advanced Figure Composition' },
  'bat-bfa-2a': { covered: 3, total: 8, nextUp: 'Etching & Intaglio' },
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DAY_STATUS: Record<string, 'done' | 'now' | 'upcoming'> = {
  Mon: 'done',
  Tue: 'done',
  Wed: 'now',
  Thu: 'upcoming',
  Fri: 'upcoming',
};

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

  const recentAttendance = SEED_RECENT_ATTENDANCE.filter((a) => myBatchIds.has(a.batchId)).map((a) => ({
    id: a.id,
    batch: batchName(a.batchId),
    subject: a.subject,
    date: a.date,
    present: a.present,
    total: a.total,
  }));

  const attendanceRate = recentAttendance.length
    ? Math.round((recentAttendance.reduce((s, a) => s + a.present / a.total, 0) / recentAttendance.length) * 100)
    : 0;

  const teachingMinutesToday = myClasses.reduce((s, c) => s + minutes(c.start, c.end), 0);

  // Batch coverage cards (the "subject progress" of the reference).
  const batches = myBatches.map((b) => {
    const subjects = [...new Set(SEED_TIMETABLE.filter((t) => t.batchId === b.id && t.facultyId === FACULTY_ACCOUNT_ID).map((t) => t.subject))];
    const cov = BATCH_COVERAGE[b.id] ?? { covered: 4, total: 8, nextUp: 'Next module' };
    return {
      id: b.id,
      name: b.name,
      course: `${courseCode(b.courseId)} — ${courseName(b.courseId)}`,
      section: b.section,
      subjects: subjects.length ? subjects : ['Studio practice'],
      covered: cov.covered,
      total: cov.total,
      nextUp: cov.nextUp,
      studentCount: SEED_STUDENTS.filter((s) => s.batchId === b.id).length,
    };
  });

  // Today's activity cards: first class done, one in progress, the rest upcoming.
  const todaysActivity = myClasses.map((c, i) => {
    const total = SEED_STUDENTS.filter((s) => s.batchId === c.batchId).length || 24;
    const status: 'done' | 'now' | 'upcoming' = i === 0 ? 'done' : i === 1 ? 'now' : 'upcoming';
    const done = status === 'done' ? total : status === 'now' ? Math.round(total * 0.6) : 0;
    return { id: c.id, subject: c.subject, batch: batchName(c.batchId), status, minutes: minutes(c.start, c.end), done, total };
  });

  // Weekly board: this faculty's timetable grouped by day.
  const weeklyActivity = WEEK_DAYS.map((day) => {
    const slots = SEED_TIMETABLE.filter((t) => t.day === day && t.facultyId === FACULTY_ACCOUNT_ID);
    return {
      day,
      totalMinutes: slots.reduce((s, t) => s + minutes(t.start, t.end), 0),
      items: slots.map((t) => ({ id: t.id, subject: t.subject, batch: batchName(t.batchId), status: DAY_STATUS[day] ?? 'upcoming' })),
    };
  }).filter((d) => d.items.length > 0);

  return {
    authority: 'faculty',
    kpis: {
      todaysClasses: myClasses.length,
      assignedBatches: myBatches.length,
      pendingAttendance: pending.length,
      studentCount,
      attendanceRate,
      teachingMinutesToday,
    },
    batches,
    todaysActivity,
    weeklyActivity,
    todaysSchedule: myClasses.map(toClass),
    pendingAttendance: pending,
    recentAttendance,
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
