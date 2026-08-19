import type { Id, IsoDateString } from '@/shared/types';

/**
 * Receipt types (§24).
 *
 * A receipt is ISSUED BY THE BACKEND when a payment is recorded (§22). The
 * frontend surfaces receipts read-only and never generates one — the receipt
 * number, amount and any downloadable document come from the backend
 * (finance/document invariant).
 *
 * TBD — BACKEND CONTRACT: receipt-number format, currency (INR) and the
 * document download endpoint are provisional.
 */
export interface ReceiptListItem {
  id: Id;
  receiptNo: string;
  student: string;
  /** Backend-recorded amount — never computed on the client. */
  amount: number;
  issuedAt: IsoDateString | null;
}

export interface ReceiptDetail {
  id: Id;
  receiptNo: string;
  student: string;
  paymentId: Id;
  feeAssignmentId: Id | null;
  amount: number;
  method: string;
  issuedAt: IsoDateString | null;
  note: string | null;
}
