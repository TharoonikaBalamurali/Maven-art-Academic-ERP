import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Enquiry types (§15–§18).
 *
 * The pipeline is Enquiry → Application → Admission → Enrollment. The frontend
 * must NOT assume which transitions are valid: the backend owns the state
 * machine and tells the client which actions are currently available. So the
 * detail carries `availableActions`, and the UI renders a button for an action
 * only when the backend offers it AND the user holds the permission. The
 * frontend never decides a transition (§15, §16).
 *
 * TBD — BACKEND CONTRACT: stage and action names are provisional; the real
 * state machine comes from the backend.
 */
export type EnquiryStage = KnownOr<'new' | 'contacted' | 'qualified' | 'converted' | 'closed'>;

export type EnquiryAction = KnownOr<'log_followup' | 'convert' | 'close' | 'reopen'>;

export const ENQUIRY_STAGE_LABEL: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  closed: 'Closed',
};

export interface EnquiryListItem {
  id: Id;
  name: string;
  programme: string;
  stage: EnquiryStage;
  receivedAt: IsoDateString;
  lastActivityAt: IsoDateString;
}

export interface EnquiryFollowup {
  id: Id;
  note: string;
  author: string;
  at: IsoDateString;
}

export interface EnquiryDetail {
  id: Id;
  name: string;
  email: string;
  phone: string;
  programme: string;
  source: string;
  stage: EnquiryStage;
  receivedAt: IsoDateString;
  /** Actions the backend currently permits for this enquiry (§16). */
  availableActions: EnquiryAction[];
  followups: EnquiryFollowup[];
  /** Set once converted; references the created application. */
  applicationId: Id | null;
}
