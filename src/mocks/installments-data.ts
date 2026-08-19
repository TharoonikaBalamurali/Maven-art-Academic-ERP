import type {
  InstallmentDetail,
  InstallmentListItem,
  InstallmentStatus,
} from '@/features/installments/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Installments mock (§21).
 *
 * Each installment's amount and status are stored explicitly as the backend's
 * authoritative figures — the mock never derives a schedule or status. This
 * mirrors the finance invariant. In-memory for the session.
 */

interface InstallmentRecord {
  id: string;
  student: string;
  feeAssignmentId: string;
  feeStructureName: string;
  sequence: number;
  totalCount: number;
  amount: number;
  dueDate: string | null;
  paidDate: string | null;
  status: InstallmentStatus;
  note: string | null;
}

function make(
  id: string,
  student: string,
  feeAssignmentId: string,
  feeStructureName: string,
  sequence: number,
  totalCount: number,
  amount: number,
  dueDate: string,
  paidDate: string | null,
  status: InstallmentStatus,
): InstallmentRecord {
  return { id, student, feeAssignmentId, feeStructureName, sequence, totalCount, amount, dueDate, paidDate, status, note: null };
}

function buildStore(): InstallmentRecord[] {
  return [
    // fa-502 — Rahul Verma, VCD (partly paid): 3 × 51,000
    make('inst-611', 'Rahul Verma', 'fa-502', 'VCD — Year 1 (2026–27)', 1, 3, 51000, '2026-07-31', '2026-07-25', 'paid'),
    make('inst-612', 'Rahul Verma', 'fa-502', 'VCD — Year 1 (2026–27)', 2, 3, 51000, '2026-09-30', null, 'due'),
    make('inst-613', 'Rahul Verma', 'fa-502', 'VCD — Year 1 (2026–27)', 3, 3, 51000, '2026-11-30', null, 'upcoming'),
    // fa-503 — Neha Krishnan, BFA (pending): 3 × varying
    make('inst-614', 'Neha Krishnan', 'fa-503', 'BFA — Year 1 (2026–27)', 1, 3, 60000, '2026-09-15', null, 'due'),
    make('inst-615', 'Neha Krishnan', 'fa-503', 'BFA — Year 1 (2026–27)', 2, 3, 50000, '2026-11-15', null, 'upcoming'),
    make('inst-616', 'Neha Krishnan', 'fa-503', 'BFA — Year 1 (2026–27)', 3, 3, 48000, '2027-01-15', null, 'upcoming'),
    // fa-506 — Sameer Joshi, Animation (overdue): 2 installments
    make('inst-617', 'Sameer Joshi', 'fa-506', 'Animation — Year 1 (2026–27)', 1, 2, 25000, '2026-07-01', '2026-07-01', 'paid'),
    make('inst-618', 'Sameer Joshi', 'fa-506', 'Animation — Year 1 (2026–27)', 2, 2, 150000, '2026-08-01', null, 'overdue'),
  ];
}

const store = buildStore();

function labelFor(record: InstallmentRecord): string {
  return `Installment ${record.sequence} of ${record.totalCount}`;
}

function toListItem(record: InstallmentRecord): InstallmentListItem {
  return {
    id: record.id,
    student: record.student,
    label: labelFor(record),
    amount: record.amount,
    dueDate: record.dueDate,
    status: record.status,
  };
}

function toDetail(record: InstallmentRecord): InstallmentDetail {
  return {
    id: record.id,
    student: record.student,
    feeAssignmentId: record.feeAssignmentId,
    feeStructureName: record.feeStructureName,
    label: labelFor(record),
    sequence: record.sequence,
    totalCount: record.totalCount,
    amount: record.amount,
    dueDate: record.dueDate,
    paidDate: record.paidDate,
    status: record.status,
    note: record.note,
  };
}

export function listInstallments(query: ListQuery): Paginated<InstallmentListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const status = String(query.filters?.status ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (search && !row.student.toLowerCase().includes(search)) return false;
      if (status && row.status !== status) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a.dueDate ?? '';
      const bv = b.dueDate ?? '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getInstallment(id: string): InstallmentDetail | null {
  const record = store.find((i) => i.id === id);
  return record ? toDetail(record) : null;
}
