import type { ArchivedBatchDetail, ArchivedBatchListItem, ArchivedOutcome, ClosedStudentRecord } from '@/features/archive/types';
import type { ListQuery, Paginated } from '@/shared/types';
import { closedStudents } from './students-data';
import { batchName, courseCode, courseName, facultyName, SEED_BATCHES } from './seed';

/**
 * Institutional archive (§ archive).
 *
 * Passed-out batches, plus the closed student records belonging to each. Closed
 * students come from the live student store, so closing an admission is
 * reflected in the archive immediately — the two can never disagree.
 */

/** Batches that have passed out. Seeded history; a real backend records this. */
interface PassedBatch {
  id: string;
  name: string;
  courseId: string;
  section: string;
  academicYear: string;
  startedOn: string;
  completedOn: string;
  facultyId: string;
  /** Students who passed out with the batch (historical roster size). */
  graduated: number;
}

const PASSED_BATCHES: PassedBatch[] = [
  { id: 'bat-bfa-2023a', name: 'BFA Year 3 · A (2023)', courseId: 'crs-bfa', section: 'A', academicYear: '2022–23', startedOn: '2020-07-15', completedOn: '2023-05-31', facultyId: 'u-faculty', graduated: 28 },
  { id: 'bat-vcd-2023a', name: 'VCD Year 3 · A (2023)', courseId: 'crs-vcd', section: 'A', academicYear: '2022–23', startedOn: '2020-07-15', completedOn: '2023-05-31', facultyId: 'fac-002', graduated: 24 },
  { id: 'bat-anim-2024a', name: 'Animation Year 3 · A (2024)', courseId: 'crs-anim', section: 'A', academicYear: '2023–24', startedOn: '2021-07-15', completedOn: '2024-05-31', facultyId: 'fac-003', graduated: 19 },
  { id: 'bat-photo-2024a', name: 'Photography Year 2 · A (2024)', courseId: 'crs-photo', section: 'A', academicYear: '2023–24', startedOn: '2022-07-15', completedOn: '2024-05-31', facultyId: 'fac-002', graduated: 16 },
];

/** Closed students grouped onto the batch they were enrolled in. */
function closedFor(batchId: string) {
  return closedStudents()
    .filter((s) => s.batchId === batchId)
    .map((s) => ({
      id: s.id,
      name: s.name,
      registerNo: s.registerNo,
      admissionNo: s.admissionNo,
      outcome: (s.closure.type === 'completion' ? 'completed' : s.closure.type === 'transfer' ? 'transferred' : 'withdrawn') as ArchivedOutcome,
      effectiveDate: s.closure.effectiveDate,
      tcNumber: s.closure.tcNumber,
      destination: s.closure.destination,
    }));
}

function toListItem(b: PassedBatch): ArchivedBatchListItem {
  const closed = closedFor(b.id);
  return {
    id: b.id,
    name: b.name,
    course: courseName(b.courseId),
    courseCode: courseCode(b.courseId),
    section: b.section,
    academicYear: b.academicYear,
    completedOn: b.completedOn,
    // Historical graduates plus anyone closed against this batch.
    totalStudents: b.graduated + closed.length,
    completed: b.graduated + closed.filter((s) => s.outcome === 'completed').length,
    transferred: closed.filter((s) => s.outcome === 'transferred').length,
    withdrawn: closed.filter((s) => s.outcome === 'withdrawn').length,
  };
}

export function listArchivedBatches(query: ListQuery): Paginated<ArchivedBatchListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const year = String(query.filters?.academicYear ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  // Any live batch that is no longer active also belongs in the archive.
  const inactive = SEED_BATCHES.filter((b) => !b.active).map<PassedBatch>((b) => ({
    id: b.id, name: b.name, courseId: b.courseId, section: b.section,
    academicYear: '2025–26', startedOn: '2024-07-15', completedOn: '2026-05-31',
    facultyId: b.facultyId, graduated: b.studentCount,
  }));

  const rows = [...PASSED_BATCHES, ...inactive].map(toListItem).filter((r) => {
    if (search && !r.name.toLowerCase().includes(search) && !r.course.toLowerCase().includes(search)) return false;
    if (year && r.academicYear !== year) return false;
    return true;
  }).sort((a, b) => {
    const av = a.completedOn ?? '';
    const bv = b.completedOn ?? '';
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getArchivedBatch(id: string): ArchivedBatchDetail | null {
  const seeded = PASSED_BATCHES.find((b) => b.id === id);
  const live = SEED_BATCHES.find((b) => b.id === id && !b.active);
  if (!seeded && !live) return null;

  const base: PassedBatch = seeded ?? {
    id: live!.id, name: live!.name, courseId: live!.courseId, section: live!.section,
    academicYear: '2025–26', startedOn: '2024-07-15', completedOn: '2026-05-31',
    facultyId: live!.facultyId, graduated: live!.studentCount,
  };

  return {
    ...toListItem(base),
    facultyName: facultyName(base.facultyId),
    startedOn: base.startedOn,
    students: closedFor(base.id),
  };
}


/**
 * Every closed student record, regardless of whether its batch has passed out —
 * a student who withdraws mid-course must still be findable in the archive.
 */
export function listClosedStudents(query: ListQuery): Paginated<ClosedStudentRecord> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const outcome = String(query.filters?.outcome ?? '');
  const sortDir = query.sortDir === 'asc' ? 'asc' : 'desc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  const rows: ClosedStudentRecord[] = closedStudents()
    .map((s) => ({
      id: s.id,
      name: s.name,
      registerNo: s.registerNo,
      admissionNo: s.admissionNo,
      outcome: (s.closure.type === 'completion' ? 'completed' : s.closure.type === 'transfer' ? 'transferred' : 'withdrawn') as ArchivedOutcome,
      effectiveDate: s.closure.effectiveDate,
      tcNumber: s.closure.tcNumber,
      destination: s.closure.destination,
      course: courseName(s.courseId),
      batch: batchName(s.batchId),
      section: s.section,
      reason: s.closure.reason,
      closedOn: s.closure.closedOn,
    }))
    .filter((r) => {
      if (search && !r.name.toLowerCase().includes(search) && !r.registerNo.toLowerCase().includes(search) && !r.admissionNo.toLowerCase().includes(search)) return false;
      if (outcome && r.outcome !== outcome) return false;
      return true;
    })
    .sort((a, b) => (sortDir === 'asc' ? a.effectiveDate.localeCompare(b.effectiveDate) : b.effectiveDate.localeCompare(a.effectiveDate)));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}
