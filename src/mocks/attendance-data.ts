import type {
  AttendanceClass,
  AttendanceRoster,
  AttendanceRosterStudent,
  AttendanceSubmission,
} from '@/features/attendance/types';
import { batchName, SEED_CLASSES_TODAY, SEED_STUDENTS } from './seed';

/**
 * Attendance mock (§21).
 *
 * The defining rule: only the faculty assigned to a class may see or mark its
 * roster (§6). That is enforced HERE, server-side — `rosterFor` and
 * `submitAttendance` reject a class that does not belong to the caller. The UI
 * is never trusted to scope this; it only ever receives the caller's own
 * classes from `todaysClassesFor`.
 *
 * Submitted marks are held in memory for the session (demonstration only).
 */

interface StoredMarks {
  present: Set<string>;
  absent: Set<string>;
}

const submitted = new Map<string, StoredMarks>();

const TODAY = '2026-08-18';

function studentsInBatch(batchId: string): AttendanceRosterStudent[] {
  return SEED_STUDENTS.filter((s) => s.batchId === batchId).map((s) => ({
    id: s.id,
    registerNo: s.registerNo,
    name: s.name,
    mark: 'present',
  }));
}

function toClass(seed: (typeof SEED_CLASSES_TODAY)[number]): AttendanceClass {
  return {
    id: seed.id,
    batchId: seed.batchId,
    batch: batchName(seed.batchId),
    subject: seed.subject,
    room: seed.room,
    start: seed.start,
    end: seed.end,
    date: TODAY,
    studentCount: SEED_STUDENTS.filter((s) => s.batchId === seed.batchId).length,
    marked: submitted.has(seed.id),
  };
}

/** Only the classes this user is scheduled to teach today (§6). */
export function todaysClassesFor(userId: string): AttendanceClass[] {
  return SEED_CLASSES_TODAY.filter((c) => c.facultyId === userId).map(toClass);
}

export type AttendanceResult =
  | { kind: 'ok'; roster: AttendanceRoster }
  | { kind: 'not_found' }
  | { kind: 'forbidden' };

function buildRoster(seed: (typeof SEED_CLASSES_TODAY)[number]): AttendanceRoster {
  const stored = submitted.get(seed.id);
  const students = studentsInBatch(seed.batchId).map((student) => ({
    ...student,
    mark: stored ? (stored.absent.has(student.id) ? ('absent' as const) : ('present' as const)) : student.mark,
  }));
  return { scheduledClass: toClass(seed), students };
}

export function rosterFor(classId: string, userId: string): AttendanceResult {
  const seed = SEED_CLASSES_TODAY.find((c) => c.id === classId);
  if (!seed) return { kind: 'not_found' };
  // The authorization boundary: not your class, not your roster.
  if (seed.facultyId !== userId) return { kind: 'forbidden' };
  return { kind: 'ok', roster: buildRoster(seed) };
}

export function submitAttendance(
  classId: string,
  userId: string,
  submission: AttendanceSubmission,
): AttendanceResult {
  const seed = SEED_CLASSES_TODAY.find((c) => c.id === classId);
  if (!seed) return { kind: 'not_found' };
  if (seed.facultyId !== userId) return { kind: 'forbidden' };

  submitted.set(classId, {
    present: new Set(submission.present ?? []),
    absent: new Set(submission.absent ?? []),
  });
  return { kind: 'ok', roster: buildRoster(seed) };
}

/** Test hook: clear submitted marks between cases. */
export function resetAttendance(): void {
  submitted.clear();
}
