import type { IsoDateString, KnownOr } from '@/shared/types';

/**
 * Student/Parent portal types (§7, §8, §37).
 *
 * All portal data is SCOPED BY THE BACKEND to the authenticated student — or,
 * for a parent, to the selected linked child (§8). The frontend never widens
 * that scope; it renders what the backend returns for "me". Amounts, attendance
 * percentages and grades are backend-authoritative (finance/academic invariants).
 *
 * TBD — BACKEND CONTRACT: the selected-child header and field shapes are provisional.
 */
export interface PortalStudentRef {
  name: string;
  registerNo: string;
  course: string;
  batch: string;
}

/** One class in "today's schedule" — status positions it on the timeline. */
export interface PortalScheduleItem {
  id: string;
  subject: string;
  time: string;
  room: string;
  status: KnownOr<'done' | 'now' | 'upcoming'>;
}

/** An upcoming exam / deadline / event on the dashboard feed. */
export interface PortalActivity {
  id: string;
  title: string;
  date: IsoDateString;
  meta: string;
}

/** A small "smart reminder" card, optionally linking into a module. */
export interface PortalReminder {
  id: string;
  label: string;
  detail: string;
  to?: string;
}

/** A recent assessment result for the dashboard performance strip. */
export interface PortalRecentGrade {
  id: string;
  assessment: string;
  grade: string;
}

export interface PortalOverview {
  student: PortalStudentRef;
  attendance: { percentage: number; present: number; total: number } | null;
  /** Backend-authoritative fee figures (displayed verbatim). */
  fees: { assigned: number; paid: number; outstanding: number; status: string } | null;
  nextClass: { subject: string; day: string; time: string; room: string } | null;
  latestGrade: { assessment: string; grade: string } | null;
  /** Count of items awaiting the student (assignments, forms, unpaid dues). */
  pendingTasks: number;
  todaySchedule: PortalScheduleItem[];
  upcomingActivities: PortalActivity[];
  reminders: PortalReminder[];
  recentGrades: PortalRecentGrade[];
}

export interface PortalProfile {
  name: string;
  registerNo: string;
  email: string;
  phone: string;
  dateOfBirth: IsoDateString | null;
  address: string;
  course: string;
  batch: string;
  admittedOn: IsoDateString | null;
  guardianName: string;
  guardianPhone: string;
}

/* ------------------------------------------------------------------ */
/* Academic group (§7) — Course, Timetable, Attendance, Progress.     */
/* All scoped by the backend to the caller / selected child.          */
/* ------------------------------------------------------------------ */

export interface PortalCourse {
  course: string;
  code: string;
  batch: string;
  facultyName: string;
  startedOn: IsoDateString | null;
  subjects: { name: string; faculty: string }[];
}

export interface PortalTimetableSession {
  subject: string;
  time: string;
  room: string;
  faculty: string;
}

export interface PortalTimetableDay {
  day: string;
  sessions: PortalTimetableSession[];
}

export interface PortalTimetable {
  week: PortalTimetableDay[];
}

export type PortalAttendanceStatus = KnownOr<'present' | 'absent' | 'late'>;

export interface PortalAttendanceRecord {
  date: IsoDateString;
  subject: string;
  status: PortalAttendanceStatus;
}

export interface PortalAttendance {
  /** Backend-computed — never derived on the client. */
  percentage: number;
  present: number;
  total: number;
  recent: PortalAttendanceRecord[];
}

export type PortalProgressStatus = KnownOr<'graded' | 'pending' | 'absent'>;

export interface PortalProgressRecord {
  id: string;
  assessment: string;
  type: string;
  score: number | null;
  maxScore: number;
  /** Backend-computed grade and result — displayed verbatim. */
  grade: string | null;
  result: string | null;
  status: PortalProgressStatus;
  date: IsoDateString | null;
}

export interface PortalProgress {
  records: PortalProgressRecord[];
}

/* ------------------------------------------------------------------ */
/* Finance group (§7) — Fees, Payments, Certificates.                 */
/* Amounts and receipts are backend-authoritative (finance invariant).*/
/* ------------------------------------------------------------------ */

export type PortalInstallmentStatus = KnownOr<'paid' | 'due' | 'upcoming' | 'overdue'>;

export interface PortalInstallment {
  label: string;
  amount: number;
  dueDate: IsoDateString | null;
  status: PortalInstallmentStatus;
}

export interface PortalFees {
  /** All figures are backend-authoritative — never computed on the client. */
  assigned: number;
  paid: number;
  outstanding: number;
  status: string;
  installments: PortalInstallment[];
}

export type PortalPaymentStatus = KnownOr<'recorded' | 'pending' | 'failed' | 'refunded'>;

export interface PortalPaymentRecord {
  id: string;
  amount: number;
  method: string;
  date: IsoDateString | null;
  receiptNo: string | null;
  status: PortalPaymentStatus;
}

export interface PortalPayments {
  records: PortalPaymentRecord[];
}

export type PortalCertificateStatus = KnownOr<'issued' | 'requested' | 'revoked'>;

export interface PortalCertificateRecord {
  id: string;
  certificateNo: string;
  type: string;
  issuedAt: IsoDateString | null;
  status: PortalCertificateStatus;
}

export interface PortalCertificates {
  records: PortalCertificateRecord[];
}

/* ------------------------------------------------------------------ */
/* Parent child switcher (§8).                                        */
/* ------------------------------------------------------------------ */

export interface PortalChild {
  id: string;
  name: string;
  course: string;
  batch: string;
}

export interface PortalChildren {
  children: PortalChild[];
}

/** Optional child scope sent with every portal request (parent switcher, §8). */
export interface PortalScopeQuery {
  student?: string;
}

/* ------------------------------------------------------------------ */
/* Online fee payment (Razorpay).                                     */
/* ------------------------------------------------------------------ */

/** The channels the checkout offers. */
export type PortalPaymentChannel = KnownOr<'card' | 'upi' | 'netbanking'>;

/**
 * A Razorpay order created by the backend. `keyId` is the publishable key —
 * present only when a real gateway is configured; empty in the sandbox, which
 * tells the client to run the demonstration flow instead of opening Checkout.
 *
 * TBD — BACKEND CONTRACT: the backend creates the order server-side with its
 * secret key and returns these fields.
 */
export interface PortalPayOrder {
  orderId: string;
  /** Amount in paise, as Razorpay expects. */
  amount: number;
  currency: string;
  keyId: string;
}

/** Payload the client sends to verify + record a completed payment. */
export interface PortalPayVerifyInput {
  orderId: string;
  /** Amount in rupees actually paid. */
  amount: number;
  method: PortalPaymentChannel;
  razorpayPaymentId: string;
  razorpaySignature: string;
  student?: string;
}

/** The backend's result after verifying the signature and recording the payment. */
export interface PortalPayResult {
  paymentId: string;
  receiptNo: string;
  status: string;
  /** The updated fee summary, so the UI reflects the new balance immediately. */
  fees: PortalFees;
}
