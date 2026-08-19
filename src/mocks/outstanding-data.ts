import type {
  OutstandingDetail,
  OutstandingListItem,
  OutstandingSeverity,
} from '@/features/outstanding/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Outstanding fees mock (§23).
 *
 * Every figure — outstanding total, overdue amount, severity — is stored as the
 * backend's computed value. The mock never aggregates balances or derives a
 * severity; it reports what the backend holds. This mirrors the finance
 * invariant. In-memory for the session.
 */

interface OutstandingRecord {
  id: string;
  student: string;
  course: string;
  feeAssignmentId: string;
  assignedTotal: number;
  paidTotal: number;
  outstandingAmount: number;
  overdueAmount: number;
  oldestDueDate: string | null;
  asOf: string | null;
  severity: OutstandingSeverity;
  note: string | null;
}

const AS_OF = '2026-08-19';

function buildStore(): OutstandingRecord[] {
  return [
    {
      id: 'out-506',
      student: 'Sameer Joshi',
      course: 'Animation & Motion Design',
      feeAssignmentId: 'fa-506',
      assignedTotal: 175000,
      paidTotal: 25000,
      outstandingAmount: 150000,
      overdueAmount: 150000,
      oldestDueDate: '2026-08-01',
      asOf: AS_OF,
      severity: 'overdue',
      note: 'Second installment overdue since 01 Aug 2026.',
    },
    {
      id: 'out-503',
      student: 'Neha Krishnan',
      course: 'Bachelor of Fine Arts',
      feeAssignmentId: 'fa-503',
      assignedTotal: 158000,
      paidTotal: 0,
      outstandingAmount: 158000,
      overdueAmount: 0,
      oldestDueDate: '2026-09-15',
      asOf: AS_OF,
      severity: 'due',
      note: null,
    },
    {
      id: 'out-502',
      student: 'Rahul Verma',
      course: 'Visual Communication & Design',
      feeAssignmentId: 'fa-502',
      assignedTotal: 153000,
      paidTotal: 51000,
      outstandingAmount: 102000,
      overdueAmount: 0,
      oldestDueDate: '2026-09-30',
      asOf: AS_OF,
      severity: 'due',
      note: null,
    },
    {
      id: 'out-504',
      student: 'Kabir Menon',
      course: 'Visual Communication & Design',
      feeAssignmentId: 'fa-504',
      assignedTotal: 153000,
      paidTotal: 76500,
      outstandingAmount: 76500,
      overdueAmount: 76500,
      oldestDueDate: '2026-09-15',
      asOf: AS_OF,
      severity: 'overdue',
      note: null,
    },
  ];
}

const store = buildStore();

function toListItem(record: OutstandingRecord): OutstandingListItem {
  return {
    id: record.id,
    student: record.student,
    course: record.course,
    outstandingAmount: record.outstandingAmount,
    overdueAmount: record.overdueAmount,
    severity: record.severity,
  };
}

function toDetail(record: OutstandingRecord): OutstandingDetail {
  return {
    id: record.id,
    student: record.student,
    course: record.course,
    feeAssignmentId: record.feeAssignmentId,
    assignedTotal: record.assignedTotal,
    paidTotal: record.paidTotal,
    outstandingAmount: record.outstandingAmount,
    overdueAmount: record.overdueAmount,
    oldestDueDate: record.oldestDueDate,
    asOf: record.asOf,
    severity: record.severity,
    note: record.note,
  };
}

export function listOutstanding(query: ListQuery): Paginated<OutstandingListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const severity = String(query.filters?.severity ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (search && !row.student.toLowerCase().includes(search) && !row.course.toLowerCase().includes(search)) {
        return false;
      }
      if (severity && row.severity !== severity) return false;
      return true;
    })
    .sort((a, b) => (sortDir === 'asc' ? a.outstandingAmount - b.outstandingAmount : b.outstandingAmount - a.outstandingAmount));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getOutstanding(id: string): OutstandingDetail | null {
  const record = store.find((o) => o.id === id);
  return record ? toDetail(record) : null;
}
