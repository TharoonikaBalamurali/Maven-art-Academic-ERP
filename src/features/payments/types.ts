import type { Id, IsoDateString, KnownOr } from '@/shared/types';

/**
 * Payment types (§22).
 *
 * A payment is a recorded transaction against a student's fees. The amount and
 * status are backend-authoritative; recording a payment NEVER lets the frontend
 * decide the resulting balance — the backend records the transaction, updates
 * the balance and returns the stored payment (finance invariant).
 *
 * TBD — BACKEND CONTRACT: method/status names, currency (INR) and the record
 * payload are provisional.
 */
export type PaymentMethod = KnownOr<'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque'>;
export type PaymentStatus = KnownOr<'recorded' | 'pending' | 'failed' | 'refunded'>;

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  recorded: 'Recorded',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
};

export interface PaymentListItem {
  id: Id;
  student: string;
  /** Backend-provided amount — never computed on the client. */
  amount: number;
  method: PaymentMethod;
  paidAt: IsoDateString | null;
  status: PaymentStatus;
}

export interface PaymentDetail {
  id: Id;
  student: string;
  feeAssignmentId: Id | null;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: IsoDateString | null;
  status: PaymentStatus;
  /** Set once the backend issues a receipt (§24). */
  receiptId: Id | null;
  note: string | null;
}

/** What the accounts user submits to record a payment (§22). */
export interface RecordPaymentInput {
  student: string;
  feeAssignmentId?: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
}
