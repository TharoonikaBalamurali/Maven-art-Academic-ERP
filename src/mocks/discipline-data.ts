import type { DisciplineDetail, DisciplineListItem, DisciplineSeverity, DisciplineStatus } from '@/features/discipline/types';
import type { ListQuery, Paginated } from '@/shared/types';

/** Discipline mock (§ student affairs). Confidential; in-memory for the session. */
interface CaseRecord {
  id: string;
  incidentNo: string;
  studentId: string;
  student: string;
  registerNo: string;
  category: string;
  date: string;
  time: string;
  location: string;
  description: string;
  reportedBy: string;
  actionTaken: string;
  resolution: string;
  followUpDate: string | null;
  remarks: string;
  severity: DisciplineSeverity;
  status: DisciplineStatus;
}

function buildStore(): CaseRecord[] {
  return [
    { id: 'dis-301', incidentNo: 'INC/2026/0301', studentId: 'stu-014', student: 'Aisha Rahman', registerNo: 'MAA20260014', category: 'Attendance', date: '2026-08-14', time: '09:30', location: 'Studio 2', description: 'Repeated late arrival to the morning studio session.', reportedBy: 'Suresh Iyer', actionTaken: 'Verbal warning issued; guardian informed.', resolution: '', followUpDate: '2026-08-28', remarks: 'Monitor for two weeks.', severity: 'low', status: 'open' },
    { id: 'dis-302', incidentNo: 'INC/2026/0302', studentId: 'stu-021', student: 'Rahul Verma', registerNo: 'MAA20260021', category: 'Property damage', date: '2026-08-11', time: '14:05', location: 'Design Lab', description: 'Damage to a shared drawing board during the afternoon session.', reportedBy: 'Meera Nair', actionTaken: 'Referred to the discipline committee.', resolution: '', followUpDate: '2026-08-25', remarks: '', severity: 'medium', status: 'under_review' },
    { id: 'dis-303', incidentNo: 'INC/2026/0303', studentId: 'stu-031', student: 'Arjun Iyer', registerNo: 'MAA20260031', category: 'Academic integrity', date: '2026-08-08', time: '11:20', location: 'Room 104', description: 'Suspected plagiarism in a submitted assignment.', reportedBy: 'Priya Venkatesh', actionTaken: 'Assignment withheld pending review.', resolution: '', followUpDate: '2026-08-22', remarks: 'Committee decision required.', severity: 'high', status: 'action_required' },
    { id: 'dis-304', incidentNo: 'INC/2026/0304', studentId: 'stu-009', student: 'Priya Iyer', registerNo: 'MAA20260009', category: 'Conduct', date: '2026-07-30', time: '15:45', location: 'Ceramics', description: 'Disruption during a practical session.', reportedBy: 'Rahul Deshpande', actionTaken: 'Counselling session completed.', resolution: 'Apology issued; no further action.', followUpDate: null, remarks: 'Closed.', severity: 'low', status: 'resolved' },
  ];
}

const store = buildStore();

function toListItem(r: CaseRecord): DisciplineListItem {
  return { id: r.id, incidentNo: r.incidentNo, student: r.student, category: r.category, date: r.date, severity: r.severity, status: r.status };
}

export function listDiscipline(query: ListQuery): Paginated<DisciplineListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const status = String(query.filters?.status ?? '');
  const severity = String(query.filters?.severity ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows = store.map(toListItem).filter((r) => {
    if (search && !r.student.toLowerCase().includes(search) && !r.incidentNo.toLowerCase().includes(search) && !r.category.toLowerCase().includes(search)) return false;
    if (status && r.status !== status) return false;
    if (severity && r.severity !== severity) return false;
    return true;
  }).sort((a, b) => (sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getDisciplineCase(id: string): DisciplineDetail | null {
  const r = store.find((c) => c.id === id);
  return r ? { ...r } : null;
}

/** Dashboard rollup — counts only, never case detail (§31). */
export function disciplineCounts() {
  return {
    open: store.filter((c) => c.status === 'open').length,
    underReview: store.filter((c) => c.status === 'under_review').length,
    actionRequired: store.filter((c) => c.status === 'action_required').length,
    resolved: store.filter((c) => c.status === 'resolved').length,
  };
}
