import type {
  FeeAssignmentDetail,
  FeeAssignmentListItem,
  FeeAssignmentStatus,
} from '@/features/fee-assignments/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Fee assignments mock (§20).
 *
 * `assignedAmount`, `paidAmount` and `balance` are each stored explicitly as
 * the backend's authoritative figures. The mock never derives the balance from
 * assigned − paid; it reports what the backend holds. This mirrors the finance
 * invariant that the frontend never computes an authoritative amount. In-memory
 * for the session.
 */

interface FeeAssignmentRecord {
  id: string;
  student: string;
  feeStructureId: string;
  feeStructureName: string;
  courseName: string;
  assignedAmount: number;
  paidAmount: number;
  balance: number;
  status: FeeAssignmentStatus;
  assignedAt: string | null;
  dueDate: string | null;
  note: string | null;
}

function buildStore(): FeeAssignmentRecord[] {
  return [
    {
      id: 'fa-501',
      student: 'Aisha Rahman',
      feeStructureId: 'fs-photo-2026',
      feeStructureName: 'Photography — Year 1 (2026–27)',
      courseName: 'Photography',
      assignedAmount: 130000,
      paidAmount: 130000,
      balance: 0,
      status: 'paid',
      assignedAt: '2026-08-06',
      dueDate: '2026-09-30',
      note: null,
    },
    {
      id: 'fa-502',
      student: 'Rahul Verma',
      feeStructureId: 'fs-vcd-2026',
      feeStructureName: 'VCD — Year 1 (2026–27)',
      courseName: 'Visual Communication & Design',
      assignedAmount: 153000,
      paidAmount: 51000,
      balance: 102000,
      status: 'partial',
      assignedAt: '2026-07-20',
      dueDate: '2026-09-30',
      note: 'First installment received.',
    },
    {
      id: 'fa-503',
      student: 'Neha Krishnan',
      feeStructureId: 'fs-bfa-2026',
      feeStructureName: 'BFA — Year 1 (2026–27)',
      courseName: 'Bachelor of Fine Arts',
      assignedAmount: 158000,
      paidAmount: 0,
      balance: 158000,
      status: 'pending',
      assignedAt: '2026-08-14',
      dueDate: '2026-09-30',
      note: null,
    },
    {
      id: 'fa-504',
      student: 'Kabir Menon',
      feeStructureId: 'fs-vcd-2026',
      feeStructureName: 'VCD — Year 1 (2026–27)',
      courseName: 'Visual Communication & Design',
      assignedAmount: 153000,
      paidAmount: 76500,
      balance: 76500,
      status: 'partial',
      assignedAt: '2026-08-10',
      dueDate: '2026-09-15',
      note: null,
    },
    {
      id: 'fa-505',
      student: 'Priya Iyer',
      feeStructureId: 'fs-bfa-2025',
      feeStructureName: 'BFA — Year 1 (2025–26)',
      courseName: 'Bachelor of Fine Arts',
      assignedAmount: 146000,
      paidAmount: 146000,
      balance: 0,
      status: 'paid',
      assignedAt: '2025-06-15',
      dueDate: '2025-09-30',
      note: null,
    },
    {
      id: 'fa-506',
      student: 'Sameer Joshi',
      feeStructureId: 'fs-anim-2026',
      feeStructureName: 'Animation — Year 1 (2026–27)',
      courseName: 'Animation & Motion Design',
      assignedAmount: 175000,
      paidAmount: 25000,
      balance: 150000,
      status: 'overdue',
      assignedAt: '2026-07-01',
      dueDate: '2026-08-01',
      note: 'Second installment overdue.',
    },
  ];
}

const store = buildStore();

function toListItem(record: FeeAssignmentRecord): FeeAssignmentListItem {
  return {
    id: record.id,
    student: record.student,
    feeStructureName: record.feeStructureName,
    assignedAmount: record.assignedAmount,
    balance: record.balance,
    status: record.status,
  };
}

function toDetail(record: FeeAssignmentRecord): FeeAssignmentDetail {
  return {
    id: record.id,
    student: record.student,
    feeStructureId: record.feeStructureId,
    feeStructureName: record.feeStructureName,
    courseName: record.courseName,
    assignedAmount: record.assignedAmount,
    paidAmount: record.paidAmount,
    balance: record.balance,
    status: record.status,
    assignedAt: record.assignedAt,
    dueDate: record.dueDate,
    note: record.note,
  };
}

export function listFeeAssignments(query: ListQuery): Paginated<FeeAssignmentListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const status = String(query.filters?.status ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store
    .map(toListItem)
    .filter((row) => {
      if (
        search &&
        !row.student.toLowerCase().includes(search) &&
        !row.feeStructureName.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (status && row.status !== status) return false;
      return true;
    })
    .sort((a, b) => (sortDir === 'asc' ? a.balance - b.balance : b.balance - a.balance));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getFeeAssignment(id: string): FeeAssignmentDetail | null {
  const record = store.find((f) => f.id === id);
  return record ? toDetail(record) : null;
}
