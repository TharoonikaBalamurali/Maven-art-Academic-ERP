import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Leave / OD types (§ student affairs).
 *
 * One domain covers both request kinds — they share a lifecycle and differ only
 * by `kind`. The BACKEND owns the approve/reject decision and advertises the
 * actions currently legal; the UI renders a button only when the backend offers
 * it and the caller holds the permission.
 *
 * TBD — BACKEND CONTRACT: status/action names are provisional.
 */
export type LeaveKind = KnownOr<'leave' | 'od'>;
export type LeaveStatus = KnownOr<'pending' | 'approved' | 'rejected' | 'cancelled'>;
export type LeaveAction = KnownOr<'approve' | 'reject'>;

export const LEAVE_KIND_LABEL: Record<string, string> = { leave: 'Leave', od: 'On duty' };
export const LEAVE_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export interface LeaveListItem {
  id: Id;
  requestNo: string;
  student: string;
  kind: LeaveKind;
  reason: string;
  fromDate: IsoDateString;
  toDate: IsoDateString;
  /** Backend-provided day count — never computed on the client. */
  days: number;
  status: LeaveStatus;
}

export interface LeaveDetail {
  id: Id;
  requestNo: string;
  studentId: Id;
  student: string;
  registerNo: string;
  batch: string;
  kind: LeaveKind;
  reason: string;
  description: string;
  fromDate: IsoDateString;
  toDate: IsoDateString;
  days: number;
  appliedOn: IsoDateString;
  status: LeaveStatus;
  /** Actions the backend currently permits. */
  availableActions: LeaveAction[];
  decidedBy: string | null;
  decisionNote: string | null;
}
