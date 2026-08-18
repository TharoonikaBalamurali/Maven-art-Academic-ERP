import type { StudentFilterOptions, StudentListItem } from '@/features/students/types';
import type { ListQuery, Paginated } from '@/shared/types';
import {
  courseCode,
  courseName,
  batchName,
  SEED_BATCHES,
  SEED_COURSES,
  SEED_STUDENTS,
} from './seed';

/**
 * Serves the students list the way a real backend would: server-side search,
 * filtering, sorting and pagination over the seeded roster. The browser never
 * receives the whole roster to filter locally (§31).
 */

const ROWS: readonly StudentListItem[] = SEED_STUDENTS.map((student) => ({
  id: student.id,
  registerNo: student.registerNo,
  name: student.name,
  courseId: student.courseId,
  course: courseName(student.courseId),
  courseCode: courseCode(student.courseId),
  batchId: student.batchId,
  batch: batchName(student.batchId),
  section: student.section,
  status: student.status,
}));

function compare(a: StudentListItem, b: StudentListItem, sortBy: string): number {
  switch (sortBy) {
    case 'name':
      return a.name.localeCompare(b.name);
    case 'course':
      return a.course.localeCompare(b.course);
    case 'batch':
      return a.batch.localeCompare(b.batch);
    case 'status':
      return a.status.localeCompare(b.status);
    case 'registerNo':
    default:
      return a.registerNo.localeCompare(b.registerNo);
  }
}

export function listStudents(query: ListQuery): Paginated<StudentListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const course = String(query.filters?.course ?? '');
  const status = String(query.filters?.status ?? '');
  const sortBy = query.sortBy ?? 'registerNo';
  const sortDir = query.sortDir === 'desc' ? 'desc' : 'asc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  let rows = ROWS.filter((row) => {
    if (search && !row.name.toLowerCase().includes(search) && !row.registerNo.toLowerCase().includes(search)) {
      return false;
    }
    if (course && row.courseId !== course) return false;
    if (status && row.status !== status) return false;
    return true;
  });

  rows = [...rows].sort((a, b) => {
    const result = compare(a, b, sortBy);
    return sortDir === 'asc' ? result : -result;
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function studentFilterOptions(): StudentFilterOptions {
  // Only courses that actually have students enrolled appear in the filter.
  const usedCourseIds = new Set(SEED_STUDENTS.map((s) => s.courseId));
  return {
    courses: SEED_COURSES.filter((c) => usedCourseIds.has(c.id)).map((c) => ({ id: c.id, name: c.name })),
    statuses: [
      { value: 'active', label: 'Active' },
      { value: 'on_leave', label: 'On leave' },
      { value: 'graduated', label: 'Graduated' },
    ],
  };
}

/** Referenced only to keep batch data close to the students mock. */
export const STUDENT_BATCHES = SEED_BATCHES;
