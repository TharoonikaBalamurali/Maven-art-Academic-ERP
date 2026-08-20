import type { Id, IsoDateString, KnownOr, Role } from '@/shared/types';

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

/** A dated item for the dashboard calendar / events list. */
export interface DashboardEvent {
  id: Id;
  date: IsoDateString;
  title: string;
}

/** One month of the admissions trend chart. */
export interface AdmissionsTrendPoint {
  month: string;
  enquiries: number;
  admissions: number;
}

/** One month of the collections trend chart (Finance). */
export interface CollectionsTrendPoint {
  month: string;
  collected: number;
  billed: number;
}

/** A ranked student on the Top Performers board. */
export interface TopPerformer {
  id: Id;
  name: string;
  registerNo: string;
  className: string;
  /** Backend-computed score/percentage, displayed verbatim. */
  score: number;
}

/**
 * An item in the Admin action centre.
 *
 * The BACKEND decides what needs attention and how urgent it is; the frontend
 * only renders and links. `permission` lets the UI hide an item the caller may
 * not act on, and `to` is omitted when the destination module does not exist
 * yet (the count is still worth surfacing).
 */
export interface AdminActionItem {
  id: Id;
  label: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  /** Permission required to see/act on this item. */
  permission: string;
  /** Destination module; omitted while a module is pending. */
  to?: string;
}

/** One entry of the backend's administrative audit trail (§18). */
export interface AdminActivityEntry {
  id: Id;
  action: string;
  entity: string;
  actor: string;
  at: IsoDateString;
}

export interface AdminDashboard {
  authority: 'admin';
  /**
   * Headline KPIs kept from the original contract so existing consumers and
   * tests continue to work; the grouped sections below add the detail.
   */
  kpis: {
    totalStudents: number;
    activeBatches: number;
    todaysAttendancePct: number;
    pendingEnquiries: number;
    pendingApplications: number;
    feeCollectionThisMonth: number;
    outstandingFees: number;
  };

  /** Student population by lifecycle status (§5, §6). */
  students: {
    total: number;
    active: number;
    newThisMonth: number;
    onLeave: number;
    transferred: number;
    withdrawn: number;
    completed: number;
  };

  /** Academic structure (§10). */
  academics: {
    totalCourses: number;
    activeCourses: number;
    totalBatches: number;
    activeBatches: number;
    classesToday: number;
  };

  /** Faculty operations (§11). Counts only — no private faculty data. */
  faculty: {
    total: number;
    active: number;
    teachingToday: number;
    attendancePending: number;
  };

  /** Admissions pipeline (§8, §9). */
  admissions: {
    newEnquiries: number;
    followUpsDue: number;
    pendingApplications: number;
    underReview: number;
    approved: number;
    rejected: number;
    recentAdmissions: number;
    pendingEnrollment: number;
  };

  /** Institution-level finance visibility (§13) — not the Accounts dashboard. */
  finance: {
    todaysCollection: number;
    monthlyCollection: number;
    outstandingTotal: number;
    studentsWithOutstanding: number;
    pendingPayments: number;
    installmentsDue: number;
    overdueInstallments: number;
  };

  /** Attendance overview (§12). */
  attendance: {
    todaysPct: number;
    present: number;
    absent: number;
    onLeave: number;
    classesConducted: number;
    classesRemaining: number;
    pendingSubmission: number;
  };

  /**
   * Student affairs (§ discipline, leave/OD). Summary counts only — sensitive
   * case detail is never surfaced on a dashboard card (§31).
   */
  studentAffairs: {
    disciplineOpen: number;
    disciplineUnderReview: number;
    disciplineActionRequired: number;
    leavePending: number;
    odPending: number;
  };

  /** Certificates and institutional communication (§15, §16). */
  documents: { certificatesIssued: number; certificateRequests: number };
  communication: { activeAnnouncements: number; scheduledAnnouncements: number; draftAnnouncements: number };

  actionCentre: AdminActionItem[];
  recentActivity: AdminActivityEntry[];
  recentAdmissions: { id: Id; name: string; programme: string; admittedAt: IsoDateString }[];
  upcomingClasses: DashboardClass[];

  /** Visual dashboard feeds. */
  admissionsTrend: AdmissionsTrendPoint[];
  events: DashboardEvent[];
  topPerformers: { week: TopPerformer[]; month: TopPerformer[]; year: TopPerformer[] };
  attendanceRings: { students: number; faculty: number };
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

  /** Visual dashboard feeds. */
  collectionsTrend: CollectionsTrendPoint[];
  events: DashboardEvent[];
  /** Backend-computed collection rate (%), displayed verbatim. */
  collectionRate: number;
}

export type FacultyActivityStatus = KnownOr<'done' | 'now' | 'upcoming'>;

/** Syllabus coverage for a batch the faculty member teaches. */
export interface FacultyBatchProgress {
  id: Id;
  name: string;
  course: string;
  section: string;
  subjects: string[];
  /** Backend-provided coverage; the client never computes it. */
  covered: number;
  total: number;
  nextUp: string;
  studentCount: number;
}

/** One of today's classes as an activity card. */
export interface FacultyTodayActivity {
  id: Id;
  subject: string;
  batch: string;
  status: FacultyActivityStatus;
  minutes: number;
  /** Attendance marked so far / expected. */
  done: number;
  total: number;
}

/** A day column in the weekly activity board. */
export interface FacultyWeekDay {
  day: string;
  totalMinutes: number;
  items: { id: Id; subject: string; batch: string; status: FacultyActivityStatus }[];
}

export interface FacultyDashboard {
  authority: 'faculty';
  kpis: {
    todaysClasses: number;
    assignedBatches: number;
    pendingAttendance: number;
    studentCount: number;
    /** Backend-computed average attendance across recent sessions. */
    attendanceRate: number;
    /** Total scheduled teaching minutes today. */
    teachingMinutesToday: number;
  };
  batches: FacultyBatchProgress[];
  todaysActivity: FacultyTodayActivity[];
  weeklyActivity: FacultyWeekDay[];
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
