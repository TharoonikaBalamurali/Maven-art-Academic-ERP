import type { ProgressDetail, ProgressListItem, ProgressStatus } from '@/features/progress/types';
import type { ListQuery, Paginated } from '@/shared/types';

/**
 * Academic progress mock (§26).
 *
 * The grade and result are stored as the backend's computed values — the mock
 * never derives a grade from score/maxScore. This mirrors the academic
 * invariant that the frontend displays results the backend computes. In-memory
 * for the session.
 */

interface ProgressRecord {
  id: string;
  student: string;
  course: string;
  batch: string;
  assessment: string;
  assessmentType: string;
  score: number | null;
  maxScore: number;
  grade: string | null;
  result: string | null;
  status: ProgressStatus;
  assessedOn: string | null;
  faculty: string;
  remarks: string | null;
}

function buildStore(): ProgressRecord[] {
  return [
    { id: 'prg-801', student: 'Aisha Rahman', course: 'Photography', batch: 'PH-2026-A', assessment: 'Composition — Midterm', assessmentType: 'Practical', score: 82, maxScore: 100, grade: 'A', result: 'Pass', status: 'graded', assessedOn: '2026-08-10', faculty: 'Meera Nair', remarks: 'Strong framing; refine exposure control.' },
    { id: 'prg-802', student: 'Rahul Verma', course: 'Visual Communication & Design', batch: 'VCD-2026-B', assessment: 'Typography — Assignment 2', assessmentType: 'Portfolio', score: 74, maxScore: 100, grade: 'B+', result: 'Pass', status: 'graded', assessedOn: '2026-08-08', faculty: 'Suresh Iyer', remarks: null },
    { id: 'prg-803', student: 'Neha Krishnan', course: 'Bachelor of Fine Arts', batch: 'BFA-2026-A', assessment: 'Foundation Drawing — Midterm', assessmentType: 'Studio', score: 91, maxScore: 100, grade: 'A+', result: 'Pass', status: 'graded', assessedOn: '2026-08-12', faculty: 'Suresh Iyer', remarks: 'Exceptional line quality.' },
    { id: 'prg-804', student: 'Kabir Menon', course: 'Visual Communication & Design', batch: 'VCD-2026-B', assessment: 'Brand Identity — Final', assessmentType: 'Project', score: null, maxScore: 100, grade: null, result: null, status: 'pending', assessedOn: null, faculty: 'Meera Nair', remarks: null },
    { id: 'prg-805', student: 'Sameer Joshi', course: 'Animation & Motion Design', batch: 'AMD-2026-A', assessment: 'Rigging — Midterm', assessmentType: 'Practical', score: null, maxScore: 100, grade: null, result: null, status: 'absent', assessedOn: '2026-08-05', faculty: 'Rahul Deshpande', remarks: 'Absent; re-assessment scheduled.' },
    { id: 'prg-806', student: 'Priya Iyer', course: 'Bachelor of Fine Arts', batch: 'BFA-2025-A', assessment: 'Art History — Final', assessmentType: 'Written', score: 58, maxScore: 100, grade: 'C', result: 'Pass', status: 'graded', assessedOn: '2025-05-30', faculty: 'Priya Venkatesh', remarks: null },
  ];
}

const store = buildStore();

function toListItem(record: ProgressRecord): ProgressListItem {
  return {
    id: record.id,
    student: record.student,
    assessment: record.assessment,
    course: record.course,
    score: record.score,
    maxScore: record.maxScore,
    grade: record.grade,
    status: record.status,
  };
}

function toDetail(record: ProgressRecord): ProgressDetail {
  return {
    id: record.id,
    student: record.student,
    course: record.course,
    batch: record.batch,
    assessment: record.assessment,
    assessmentType: record.assessmentType,
    score: record.score,
    maxScore: record.maxScore,
    grade: record.grade,
    result: record.result,
    status: record.status,
    assessedOn: record.assessedOn,
    faculty: record.faculty,
    remarks: record.remarks,
  };
}

export function listProgress(query: ListQuery): Paginated<ProgressListItem> {
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
        !row.assessment.toLowerCase().includes(search) &&
        !row.course.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (status && row.status !== status) return false;
      return true;
    })
    .sort((a, b) => (sortDir === 'asc' ? a.student.localeCompare(b.student) : b.student.localeCompare(a.student)));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getProgress(id: string): ProgressDetail | null {
  const record = store.find((p) => p.id === id);
  return record ? toDetail(record) : null;
}
