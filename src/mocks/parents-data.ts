import type { ParentDetail, ParentListItem, ParentRelation } from '@/features/parents/types';
import type { ListQuery, Paginated } from '@/shared/types';

/** Parents mock (§ Phase 2). In-memory for the session. */
interface ParentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  relation: ParentRelation;
  students: { id: string; name: string; course: string }[];
  note: string | null;
}

function buildStore(): ParentRecord[] {
  return [
    { id: 'par-201', name: 'Balan Muthu', email: 'balan.muthu@example.com', phone: '+91 90000 10001', relation: 'father', students: [{ id: 'stu-001', name: 'Nithya Balan', course: 'Bachelor of Fine Arts' }], note: null },
    { id: 'par-202', name: 'Latha Rahman', email: 'latha.rahman@example.com', phone: '+91 90000 10002', relation: 'mother', students: [{ id: 'stu-014', name: 'Aisha Rahman', course: 'Photography' }], note: null },
    { id: 'par-203', name: 'Suresh Verma', email: 'suresh.verma@example.com', phone: '+91 90000 10003', relation: 'father', students: [{ id: 'stu-021', name: 'Rahul Verma', course: 'Visual Communication & Design' }], note: null },
    { id: 'par-204', name: 'Anita Krishnan', email: 'anita.krishnan@example.com', phone: '+91 90000 10004', relation: 'mother', students: [{ id: 'stu-018', name: 'Neha Krishnan', course: 'Bachelor of Fine Arts' }], note: 'Primary contact for fee matters.' },
    { id: 'par-205', name: 'Ramesh Menon', email: 'ramesh.menon@example.com', phone: '+91 90000 10005', relation: 'guardian', students: [{ id: 'stu-024', name: 'Kabir Menon', course: 'Visual Communication & Design' }], note: null },
    { id: 'par-206', name: 'Geeta Iyer', email: 'geeta.iyer@example.com', phone: '+91 90000 10006', relation: 'mother', students: [{ id: 'stu-009', name: 'Priya Iyer', course: 'Bachelor of Fine Arts' }, { id: 'stu-031', name: 'Arjun Iyer', course: 'Animation & Motion Design' }], note: 'Two children enrolled.' },
  ];
}

const store = buildStore();

function toListItem(r: ParentRecord): ParentListItem {
  return { id: r.id, name: r.name, email: r.email, phone: r.phone, relation: r.relation, studentCount: r.students.length };
}
function toDetail(r: ParentRecord): ParentDetail {
  return { id: r.id, name: r.name, email: r.email, phone: r.phone, relation: r.relation, students: r.students.map((s) => ({ ...s })), note: r.note };
}

export function listParents(query: ListQuery): Paginated<ParentListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;
  const rows = store.map(toListItem).filter((r) => !search || r.name.toLowerCase().includes(search) || r.email.toLowerCase().includes(search));
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}
export function getParent(id: string): ParentDetail | null {
  const r = store.find((p) => p.id === id);
  return r ? toDetail(r) : null;
}

/**
 * The Student ↔ Parent link: returns the parent-directory id whose linked
 * students include `studentId`, or null. Lets the student profile deep-link to
 * a real parent record without duplicating parent data.
 */
export function findParentIdForStudent(studentId: string): string | null {
  const parent = store.find((p) => p.students.some((s) => s.id === studentId));
  return parent?.id ?? null;
}
