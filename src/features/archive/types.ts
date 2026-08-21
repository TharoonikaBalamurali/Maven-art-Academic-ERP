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

/**
 * A passed-out / closed student in the archive.
 *
 * The full leaving record the institution must be able to produce years later:
 * which group they studied, what they scored in the board examination, and the
 * remarks recorded at exit. Marks and percentage are BACKEND-COMPUTED results —
 * the frontend never calculates or re-derives them (§ academic invariant).
 */
export interface ArchivedStudent {
  id: Id;
  name: string;
  registerNo: string;
  admissionNo: string;
  rollNo: string;
  /** The group / stream studied, e.g. "Fine Arts — Painting". */
  group: string;
  section: string;
  outcome: ArchivedOutcome;
  effectiveDate: IsoDateString;
  tcNumber: string;
  destination: string;
  /** Board examination result, as reported by the backend. */
  boardExam: BoardExamResult | null;
  remarks: string;
}

/** A board examination result — authoritative, from the backend. */
export interface BoardExamResult {
  examName: string;
  year: string;
  /** Backend-computed percentage; displayed verbatim. */
  percentage: number;
  grade: string;
  result: string;
  /** Per-subject marks, when the backend supplies them. */
  subjects: { subject: string; marks: number; maxMarks: number; grade: string }[];
}

/** Students grouped by the section they passed out from, with its headcount. */
export interface ArchivedSection {
  section: string;
  /** Backend-provided headcount for the section. */
  studentCount: number;
  students: ArchivedStudent[];
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
  /** Backend-computed batch average of the board percentage. */
  averagePercentage: number | null;
  /** The passed-out roster, grouped by section with a count each. */
  sections: ArchivedSection[];
  students: ArchivedStudent[];
}

/** One passed-out student's full record, with the batch it belongs to. */
export interface ArchivedStudentDetail extends ArchivedStudent {
  batchId: Id;
  batch: string;
  course: string;
  academicYear: string;
}
