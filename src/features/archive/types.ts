import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Institutional archive (§ archive).
 *
 * The permanent record of batches that have passed out and of students whose
 * admission has been closed. Kept separate from the active roster so current
 * operations are never cluttered by history, while the institution retains
 * everything it must be able to produce years later.
 *
 * TBD — BACKEND CONTRACT: provisional field names.
 */
export interface ArchivedBatchListItem {
  id: Id;
  name: string;
  course: string;
  courseCode: string;
  section: string;
  academicYear: string;
  completedOn: IsoDateString | null;
  /** Backend-provided outcome counts — never computed on the client. */
  totalStudents: number;
  completed: number;
  transferred: number;
  withdrawn: number;
}

export type ArchivedOutcome = KnownOr<'completed' | 'transferred' | 'withdrawn'>;

export interface ArchivedStudent {
  id: Id;
  name: string;
  registerNo: string;
  admissionNo: string;
  outcome: ArchivedOutcome;
  effectiveDate: IsoDateString;
  tcNumber: string;
  destination: string;
}

/** A closed student record, listed independently of its batch. */
export interface ClosedStudentRecord extends ArchivedStudent {
  course: string;
  batch: string;
  section: string;
  reason: string;
  closedOn: IsoDateString;
}

export interface ArchivedBatchDetail extends ArchivedBatchListItem {
  facultyName: string;
  startedOn: IsoDateString | null;
  students: ArchivedStudent[];
}
