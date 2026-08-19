import type { CourseDetail, CourseListItem } from '@/features/courses/types';
import type { ListQuery, Paginated } from '@/shared/types';
import { facultyName, SEED_BATCHES, SEED_COURSES, SEED_STUDENTS } from './seed';

/** Course list and detail (§19), derived from the seed. */

function batchesOf(courseId: string) {
  return SEED_BATCHES.filter((b) => b.courseId === courseId);
}

function studentsOf(courseId: string): number {
  const batchIds = new Set(batchesOf(courseId).map((b) => b.id));
  return SEED_STUDENTS.filter((s) => batchIds.has(s.batchId)).length;
}

function toListItem(course: (typeof SEED_COURSES)[number]): CourseListItem {
  return {
    id: course.id,
    code: course.code,
    name: course.name,
    batchCount: batchesOf(course.id).length,
    studentCount: studentsOf(course.id),
  };
}

function compare(a: CourseListItem, b: CourseListItem, sortBy: string): number {
  switch (sortBy) {
    case 'code':
      return a.code.localeCompare(b.code);
    case 'batches':
      return a.batchCount - b.batchCount;
    case 'students':
      return a.studentCount - b.studentCount;
    case 'name':
    default:
      return a.name.localeCompare(b.name);
  }
}

export function listCourses(query: ListQuery): Paginated<CourseListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir === 'desc' ? 'desc' : 'asc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  let rows = SEED_COURSES.map(toListItem).filter(
    (row) => !search || row.name.toLowerCase().includes(search) || row.code.toLowerCase().includes(search),
  );
  rows = rows.sort((a, b) => (sortDir === 'asc' ? compare(a, b, sortBy) : -compare(a, b, sortBy)));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getCourseDetail(id: string): CourseDetail | null {
  const course = SEED_COURSES.find((c) => c.id === id);
  if (!course) return null;

  return {
    id: course.id,
    code: course.code,
    name: course.name,
    batchCount: batchesOf(course.id).length,
    studentCount: studentsOf(course.id),
    batches: batchesOf(course.id).map((b) => ({
      id: b.id,
      name: b.name,
      section: b.section,
      faculty: facultyName(b.facultyId),
      studentCount: SEED_STUDENTS.filter((s) => s.batchId === b.id).length,
      active: b.active,
    })),
  };
}
