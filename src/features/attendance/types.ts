import type { Id } from '@/shared/types';

/**
 * Attendance workflow types (§21).
 *
 * The flow is Faculty → Assigned Batch → Scheduled Class → Student List → Mark.
 * The frontend never chooses which batches a faculty member may mark — the
 * backend returns only the caller's scheduled classes, and re-verifies
 * authorization on submit (§6). "Only assigned faculty may mark attendance" is
 * a backend rule; the UI merely reflects it.
 *
 * TBD — BACKEND CONTRACT: field names are provisional.
 */
export type AttendanceMark = 'present' | 'absent';

export interface AttendanceClass {
  id: Id;
  batchId: Id;
  batch: string;
  subject: string;
  room: string;
  /** 24h "HH:MM". */
  start: string;
  end: string;
  date: string;
  studentCount: number;
  /** Whether attendance for this class has already been submitted today. */
  marked: boolean;
}

export interface AttendanceRosterStudent {
  id: Id;
  registerNo: string;
  name: string;
  /** The current/last mark; defaults to present for an unmarked class. */
  mark: AttendanceMark;
}

export interface AttendanceRoster {
  scheduledClass: AttendanceClass;
  students: AttendanceRosterStudent[];
}

/** Payload the faculty submits: which students were present / absent. */
export interface AttendanceSubmission {
  present: Id[];
  absent: Id[];
}
