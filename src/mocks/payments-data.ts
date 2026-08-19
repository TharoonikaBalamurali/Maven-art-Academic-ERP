import type {
  PaymentDetail,
  PaymentListItem,
  PaymentMethod,
  PaymentStatus,
  RecordPaymentInput,
} from '@/features/payments/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Payments mock (§22).
 *
 * Recording a payment is a backend operation: the mock stores the transaction,
 * assigns it a receipt and returns the stored record with status `recorded`.
 * The frontend supplies the amount of the transaction being recorded, but the
 * resulting balance is never decided on the client. In-memory for the session.
 */

interface PaymentRecord {
  id: string;
  student: string;
  feeAssignmentId: string | null;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string | null;
  status: PaymentStatus;
  receiptId: string | null;
  note: string | null;
}

function buildStore(): PaymentRecord[] {
  return [
    { id: 'pay-901', student: 'Aisha Rahman', feeAssignmentId: 'fa-501', amount: 130000, method: 'bank_transfer', reference: 'NEFT-6631', paidAt: '2026-08-06', status: 'recorded', receiptId: 'rcpt-701', note: null },
    { id: 'pay-902', student: 'Rahul Verma', feeAssignmentId: 'fa-502', amount: 51000, method: 'upi', reference: 'UPI-8842', paidAt: '2026-07-25', status: 'recorded', receiptId: 'rcpt-702', note: null },
    { id: 'pay-903', student: 'Kabir Menon', feeAssignmentId: 'fa-504', amount: 76500, method: 'card', reference: 'CARD-2201', paidAt: '2026-08-11', status: 'recorded', receiptId: 'rcpt-703', note: null },
    { id: 'pay-904', student: 'Sameer Joshi', feeAssignmentId: 'fa-506', amount: 25000, method: 'cash', reference: null, paidAt: '2026-07-01', status: 'recorded', receiptId: 'rcpt-704', note: null },
    { id: 'pay-905', student: 'Priya Iyer', feeAssignmentId: 'fa-505', amount: 146000, method: 'cheque', reference: 'CHQ-5590', paidAt: '2025-06-15', status: 'recorded', receiptId: 'rcpt-705', note: null },
    { id: 'pay-906', student: 'Meera Pillai', feeAssignmentId: null, amount: 5000, method: 'upi', reference: 'UPI-9001', paidAt: '2026-08-12', status: 'pending', receiptId: null, note: 'Registration deposit; confirmation awaited.' },
  ];
}

let store = buildStore();
let paymentSeq = 907;
let receiptSeq = 706;

export function resetPayments(): void {
  store = buildStore();
  paymentSeq = 907;
  receiptSeq = 706;
}

function toListItem(record: PaymentRecord): PaymentListItem {
  return {
    id: record.id,
    student: record.student,
    amount: record.amount,
    method: record.method,
    paidAt: record.paidAt,
    status: record.status,
  };
}

function toDetail(record: PaymentRecord): PaymentDetail {
  return {
    id: record.id,
    student: record.student,
    feeAssignmentId: record.feeAssignmentId,
    amount: record.amount,
    method: record.method,
    reference: record.reference,
    paidAt: record.paidAt,
    status: record.status,
    receiptId: record.receiptId,
    note: record.note,
  };
}

export function listPayments(query: ListQuery): Paginated<PaymentListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const method = String(query.filters?.method ?? '');
  const status = String(query.filters?.status ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (search && !row.student.toLowerCase().includes(search)) return false;
      if (method && row.method !== method) return false;
      if (status && row.status !== status) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a.paidAt ?? '';
      const bv = b.paidAt ?? '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getPayment(id: string): PaymentDetail | null {
  const record = store.find((p) => p.id === id);
  return record ? toDetail(record) : null;
}

/**
 * Records a payment. The backend owns the record: it assigns the id, marks it
 * `recorded` and issues a receipt. The client's submitted amount is the value
 * of the transaction, not a computed balance.
 */
export function recordPayment(input: RecordPaymentInput): PaymentDetail {
  const id = `pay-${paymentSeq}`;
  const receiptId = `rcpt-${receiptSeq}`;
  paymentSeq += 1;
  receiptSeq += 1;
  const record: PaymentRecord = {
    id,
    student: input.student.trim(),
    feeAssignmentId: input.feeAssignmentId?.trim() || null,
    amount: input.amount,
    method: input.method,
    reference: input.reference?.trim() || null,
    paidAt: input.paidAt,
    status: 'recorded',
    receiptId,
    note: null,
  };
  store.unshift(record);
  return toDetail(record);
}
