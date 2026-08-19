import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Application types (§16).
 *
 * Application → Review → Admission Decision. As with enquiries, the backend
 * owns the state machine and advertises which actions are valid now; the UI
 * renders a button only when the backend offers it and the user is permitted.
 * The exact state machine comes from the backend.
 *
 * TBD — BACKEND CONTRACT: stage/action names are provisional.
 */
export type ApplicationStage = KnownOr<'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'>;

export type ApplicationAction = KnownOr<'submit' | 'start_review' | 'approve' | 'reject'>;

export const APPLICATION_STAGE_LABEL: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export interface ApplicationListItem {
  id: Id;
  applicant: string;
  programme: string;
  stage: ApplicationStage;
  submittedAt: IsoDateString | null;
}

export interface ApplicationDetail {
  id: Id;
  applicant: string;
  email: string;
  phone: string;
  programme: string;
  priorEducation: string;
  portfolioUrl: string;
  stage: ApplicationStage;
  submittedAt: IsoDateString | null;
  /** The enquiry this application came from, if converted (§15). */
  enquiryId: Id | null;
  /** Actions the backend currently permits (§16). */
  availableActions: ApplicationAction[];
  /** Reviewer's decision note, once decided. */
  decisionNote: string | null;
  /** Set once approved; references the created admission. */
  admissionId: Id | null;
}
