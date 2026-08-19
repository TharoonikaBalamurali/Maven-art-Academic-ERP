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

export interface PortalOverview {
  student: PortalStudentRef;
  attendance: { percentage: number; present: number; total: number } | null;
  fees: { outstanding: number; status: string } | null;
  nextClass: { subject: string; day: string; time: string; room: string } | null;
  latestGrade: { assessment: string; grade: string } | null;
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
