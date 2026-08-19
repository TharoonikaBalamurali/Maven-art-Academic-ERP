import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Enrollment types (§18).
 *
 * An enrollment places an admitted applicant into a course and batch. It is
 * created when an admission is enrolled (§17 → §18 handoff). The backend owns
 * the enrollment's status; the frontend only displays it. A manual "new
 * enrollment" flow and any status transitions are gated by the backend.
 *
 * TBD — BACKEND CONTRACT: status names, the create payload (available courses/
 * batches for a student) and any status transitions are provisional.
 */
export type EnrollmentStatus = KnownOr<'active' | 'completed' | 'withdrawn'>;

export const ENROLLMENT_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
};

export interface EnrollmentListItem {
  id: Id;
  student: string;
  course: string;
  batch: string;
  status: EnrollmentStatus;
  enrolledAt: IsoDateString | null;
}

export interface EnrollmentDetail {
  id: Id;
  student: string;
  course: string;
  batch: string;
  status: EnrollmentStatus;
  enrolledAt: IsoDateString | null;
  /** The admission this enrollment came from (§17). */
  admissionId: Id | null;
  note: string | null;
}
