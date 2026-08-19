import type { ReceiptDetail, ReceiptListItem } from '@/features/receipts/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Receipts mock (§24).
 *
 * Receipts mirror the recorded payments that carry a `receiptId` (§22). The
 * receipt number and amount are the backend's record; the frontend never
 * generates a receipt. In-memory for the session.
 */

interface ReceiptRecord {
  id: string;
  receiptNo: string;
  student: string;
  paymentId: string;
  feeAssignmentId: string | null;
  amount: number;
  method: string;
  issuedAt: string | null;
  note: string | null;
}

function buildStore(): ReceiptRecord[] {
  return [
    { id: 'rcpt-701', receiptNo: 'MA/2026/0701', student: 'Aisha Rahman', paymentId: 'pay-901', feeAssignmentId: 'fa-501', amount: 130000, method: 'bank_transfer', issuedAt: '2026-08-06', note: null },
    { id: 'rcpt-702', receiptNo: 'MA/2026/0702', student: 'Rahul Verma', paymentId: 'pay-902', feeAssignmentId: 'fa-502', amount: 51000, method: 'upi', issuedAt: '2026-07-25', note: null },
    { id: 'rcpt-703', receiptNo: 'MA/2026/0703', student: 'Kabir Menon', paymentId: 'pay-903', feeAssignmentId: 'fa-504', amount: 76500, method: 'card', issuedAt: '2026-08-11', note: null },
    { id: 'rcpt-704', receiptNo: 'MA/2026/0704', student: 'Sameer Joshi', paymentId: 'pay-904', feeAssignmentId: 'fa-506', amount: 25000, method: 'cash', issuedAt: '2026-07-01', note: null },
    { id: 'rcpt-705', receiptNo: 'MA/2025/0705', student: 'Priya Iyer', paymentId: 'pay-905', feeAssignmentId: 'fa-505', amount: 146000, method: 'cheque', issuedAt: '2025-06-15', note: null },
  ];
}

const store = buildStore();

function toListItem(record: ReceiptRecord): ReceiptListItem {
  return {
    id: record.id,
    receiptNo: record.receiptNo,
    student: record.student,
    amount: record.amount,
    issuedAt: record.issuedAt,
  };
}

function toDetail(record: ReceiptRecord): ReceiptDetail {
  return {
    id: record.id,
    receiptNo: record.receiptNo,
    student: record.student,
    paymentId: record.paymentId,
    feeAssignmentId: record.feeAssignmentId,
    amount: record.amount,
    method: record.method,
    issuedAt: record.issuedAt,
    note: record.note,
  };
}

export function listReceipts(query: ListQuery): Paginated<ReceiptListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (search && !row.student.toLowerCase().includes(search) && !row.receiptNo.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const av = a.issuedAt ?? '';
      const bv = b.issuedAt ?? '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getReceipt(id: string): ReceiptDetail | null {
  const record = store.find((r) => r.id === id);
  return record ? toDetail(record) : null;
}
