import type { LeaveAction, LeaveDetail, LeaveKind, LeaveListItem, LeaveStatus } from '@/features/leave/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Leave / OD mock (§ student affairs).
 *
 * The status machine lives here: only a pending request may be approved or
 * rejected, and the record advertises `availableActions` per status. An illegal
 * transition is a 409. In-memory for the session.
 */
interface RequestRecord {
  id: string;
  requestNo: string;
  studentId: string;
  student: string;
  registerNo: string;
  batch: string;
  kind: LeaveKind;
  reason: string;
  description: string;
  fromDate: string;
  toDate: string;
  days: number;
  appliedOn: string;
  status: LeaveStatus;
  decidedBy: string | null;
  decisionNote: string | null;
}

function buildStore(): RequestRecord[] {
  return [
    { id: 'lv-401', requestNo: 'LV/2026/0401', studentId: 'stu-001', student: 'Nithya Balan', registerNo: 'MAA20260001', batch: 'BFA Year 1 · A', kind: 'leave', reason: 'Medical', description: 'Fever; advised two days of rest.', fromDate: '2026-08-21', toDate: '2026-08-22', days: 2, appliedOn: '2026-08-20', status: 'pending', decidedBy: null, decisionNote: null },
    { id: 'lv-402', requestNo: 'LV/2026/0402', studentId: 'stu-014', student: 'Aisha Rahman', registerNo: 'MAA20260014', batch: 'PH Year 1 · A', kind: 'od', reason: 'Inter-college exhibition', description: 'Representing the academy at a photography exhibition.', fromDate: '2026-08-26', toDate: '2026-08-27', days: 2, appliedOn: '2026-08-18', status: 'pending', decidedBy: null, decisionNote: null },
    { id: 'lv-403', requestNo: 'LV/2026/0403', studentId: 'stu-021', student: 'Rahul Verma', registerNo: 'MAA20260021', batch: 'VCD Year 1 · B', kind: 'leave', reason: 'Family function', description: 'Sibling’s wedding.', fromDate: '2026-08-14', toDate: '2026-08-16', days: 3, appliedOn: '2026-08-08', status: 'approved', decidedBy: 'Aarthi Ramesh', decisionNote: 'Approved; submit missed work.' },
    { id: 'lv-404', requestNo: 'LV/2026/0404', studentId: 'stu-031', student: 'Arjun Iyer', registerNo: 'MAA20260031', batch: 'AMD Year 1 · A', kind: 'od', reason: 'Workshop', description: 'External animation workshop.', fromDate: '2026-08-05', toDate: '2026-08-05', days: 1, appliedOn: '2026-08-01', status: 'rejected', decidedBy: 'Aarthi Ramesh', decisionNote: 'Clashes with a scheduled assessment.' },
    { id: 'lv-405', requestNo: 'LV/2026/0405', studentId: 'stu-009', student: 'Priya Iyer', registerNo: 'MAA20260009', batch: 'BFA Year 2 · A', kind: 'leave', reason: 'Medical', description: 'Scheduled procedure.', fromDate: '2026-09-02', toDate: '2026-09-04', days: 3, appliedOn: '2026-08-19', status: 'pending', decidedBy: null, decisionNote: null },
  ];
}

const store = buildStore();

/** The state machine — the sole source of which actions a status permits. */
function availableActions(status: LeaveStatus): LeaveAction[] {
  return status === 'pending' ? ['approve', 'reject'] : [];
}

function toListItem(r: RequestRecord): LeaveListItem {
  return { id: r.id, requestNo: r.requestNo, student: r.student, kind: r.kind, reason: r.reason, fromDate: r.fromDate, toDate: r.toDate, days: r.days, status: r.status };
}

function toDetail(r: RequestRecord): LeaveDetail {
  return { ...r, availableActions: availableActions(r.status) };
}

export function listLeave(query: ListQuery): Paginated<LeaveListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const status = String(query.filters?.status ?? '');
  const kind = String(query.filters?.kind ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store.map(toListItem).filter((r) => {
    if (search && !r.student.toLowerCase().includes(search) && !r.requestNo.toLowerCase().includes(search) && !r.reason.toLowerCase().includes(search)) return false;
    if (status && r.status !== status) return false;
    if (kind && r.kind !== kind) return false;
    return true;
  }).sort((a, b) => (sortDir === 'asc' ? a.fromDate.localeCompare(b.fromDate) : b.fromDate.localeCompare(a.fromDate)));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getLeaveRequest(id: string): LeaveDetail | null {
  const r = store.find((x) => x.id === id);
  return r ? toDetail(r) : null;
}

export type LeaveResult = { kind: 'ok'; detail: LeaveDetail } | { kind: 'not_found' } | { kind: 'conflict' };

export function decideLeave(id: string, action: LeaveAction, decidedBy: string, note?: string): LeaveResult {
  const r = store.find((x) => x.id === id);
  if (!r) return { kind: 'not_found' };
  if (!availableActions(r.status).includes(action)) return { kind: 'conflict' };

  r.status = action === 'approve' ? 'approved' : 'rejected';
  r.decidedBy = decidedBy;
  r.decisionNote = note?.trim() || null;
  return { kind: 'ok', detail: toDetail(r) };
}

/** Dashboard rollup — pending counts by kind. */
export function leaveCounts() {
  return {
    leavePending: store.filter((r) => r.kind === 'leave' && r.status === 'pending').length,
    odPending: store.filter((r) => r.kind === 'od' && r.status === 'pending').length,
  };
}
