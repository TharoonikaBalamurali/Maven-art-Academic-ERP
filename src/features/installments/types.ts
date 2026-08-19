import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Installment types (§21).
 *
 * An installment is one scheduled part-payment of a fee assignment. Its amount
 * and status are backend-authoritative; the frontend displays them and never
 * computes a schedule, a running balance or a status (finance invariant).
 *
 * TBD — BACKEND CONTRACT: status names, currency (INR) and scheduling rules are
 * provisional.
 */
export type InstallmentStatus = KnownOr<'paid' | 'due' | 'upcoming' | 'overdue'>;

export const INSTALLMENT_STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  due: 'Due',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
};

export interface InstallmentListItem {
  id: Id;
  student: string;
  label: string;
  /** Backend-provided amount — never computed on the client. */
  amount: number;
  dueDate: IsoDateString | null;
  status: InstallmentStatus;
}

export interface InstallmentDetail {
  id: Id;
  student: string;
  feeAssignmentId: Id;
  feeStructureName: string;
  label: string;
  sequence: number;
  totalCount: number;
  amount: number;
  dueDate: IsoDateString | null;
  paidDate: IsoDateString | null;
  status: InstallmentStatus;
  note: string | null;
}
