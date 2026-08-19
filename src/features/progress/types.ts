import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Academic progress types (§26).
 *
 * A progress record is one assessment result for a student. The raw score is
 * captured data, but the GRADE and any pass/fail RESULT are computed by the
 * backend — the frontend never derives a grade from score/maxScore or decides
 * a result (academic invariant, mirrors the finance invariants).
 *
 * TBD — BACKEND CONTRACT: grade scale, status names and assessment types are
 * provisional.
 */
export type ProgressStatus = KnownOr<'graded' | 'pending' | 'absent'>;

export const PROGRESS_STATUS_LABEL: Record<string, string> = {
  graded: 'Graded',
  pending: 'Pending',
  absent: 'Absent',
};

export interface ProgressListItem {
  id: Id;
  student: string;
  assessment: string;
  course: string;
  /** Raw captured score; null until graded. */
  score: number | null;
  maxScore: number;
  /** Backend-computed grade — never derived on the client. */
  grade: string | null;
  status: ProgressStatus;
}

export interface ProgressDetail {
  id: Id;
  student: string;
  course: string;
  batch: string;
  assessment: string;
  assessmentType: string;
  score: number | null;
  maxScore: number;
  /** Backend-computed grade and result — displayed verbatim. */
  grade: string | null;
  result: string | null;
  status: ProgressStatus;
  assessedOn: IsoDateString | null;
  faculty: string;
  remarks: string | null;
}
