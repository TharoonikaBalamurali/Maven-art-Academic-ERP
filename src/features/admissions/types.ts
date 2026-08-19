import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Admission types (§17).
 *
 * An admission is created when an application is approved (§16). From there the
 * institution confirms the offer and then enrols the admitted applicant — the
 * handoff to Enrollments (§18). As everywhere in the admissions pipeline, the
 * backend owns the state machine and advertises the currently valid actions;
 * the UI only renders a button the backend offers and the user is permitted.
 *
 * TBD — BACKEND CONTRACT: stage/action names and fields are provisional.
 */
export type AdmissionStage = KnownOr<'offered' | 'confirmed' | 'enrolled' | 'cancelled'>;

export type AdmissionAction = KnownOr<'confirm' | 'enroll' | 'cancel'>;

export const ADMISSION_STAGE_LABEL: Record<string, string> = {
  offered: 'Offered',
  confirmed: 'Confirmed',
  enrolled: 'Enrolled',
  cancelled: 'Cancelled',
};

export interface AdmissionListItem {
  id: Id;
  applicant: string;
  programme: string;
  stage: AdmissionStage;
  offeredAt: IsoDateString | null;
}

export interface AdmissionDetail {
  id: Id;
  applicant: string;
  email: string;
  phone: string;
  programme: string;
  stage: AdmissionStage;
  offeredAt: IsoDateString | null;
  /** The application this admission came from (§16). */
  applicationId: Id | null;
  /** Actions the backend currently permits (§17). */
  availableActions: AdmissionAction[];
  /** Admissions officer's note, once a decision is recorded. */
  note: string | null;
  /** Set once enrolled; references the created enrollment (§18). */
  enrollmentId: Id | null;
}
