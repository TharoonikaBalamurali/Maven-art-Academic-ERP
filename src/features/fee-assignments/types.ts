import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Fee assignment types (§20).
 *
 * A fee assignment applies a fee structure to a student. The assigned amount,
 * paid amount and balance are ALL authoritative and come from the backend. The
 * frontend never computes a balance (assigned − paid) or any other figure — it
 * displays exactly what the backend reports (finance invariant).
 *
 * TBD — BACKEND CONTRACT: status names, currency (INR) and due dates are
 * provisional.
 */
export type FeeAssignmentStatus = KnownOr<'pending' | 'partial' | 'paid' | 'overdue'>;

export const FEE_ASSIGNMENT_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  partial: 'Partly paid',
  paid: 'Paid',
  overdue: 'Overdue',
};

export interface FeeAssignmentListItem {
  id: Id;
  student: string;
  feeStructureName: string;
  /** Backend-provided amounts — never computed on the client. */
  assignedAmount: number;
  balance: number;
  status: FeeAssignmentStatus;
}

export interface FeeAssignmentDetail {
  id: Id;
  student: string;
  feeStructureId: Id;
  feeStructureName: string;
  courseName: string;
  /** All three are backend-authoritative; the client never derives one from the others. */
  assignedAmount: number;
  paidAmount: number;
  balance: number;
  status: FeeAssignmentStatus;
  assignedAt: IsoDateString | null;
  dueDate: IsoDateString | null;
  note: string | null;
}
