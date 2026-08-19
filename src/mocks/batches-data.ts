import type { BatchDetail, BatchListItem } from '@/features/batches/types';
import type { ListQuery, Paginated } from '@/shared/types';
import {
  courseCode,
  courseName,
  facultyName,
  SEED_BATCHES,
  SEED_CLASSES_TODAY,
  SEED_STUDENTS,
} from './seed';

/** Server-driven batch list and relational detail (§19). */

function rosterSize(batchId: string): number {
  return SEED_STUDENTS.filter((s) => s.batchId === batchId).length;
}

function toListItem(batch: (typeof SEED_BATCHES)[number]): BatchListItem {
  return {
    id: batch.id,
    name: batch.name,
    courseId: batch.courseId,
    course: courseName(batch.courseId),
    courseCode: courseCode(batch.courseId),
    section: batch.section,
    facultyId: batch.facultyId,
    faculty: facultyName(batch.facultyId),
    // Derived from the actual roster so the list and detail agree.
    studentCount: rosterSize(batch.id),
    active: batch.active,
  };
}

function compare(a: BatchListItem, b: BatchListItem, sortBy: string): number {
  switch (sortBy) {
    case 'course':
      return a.course.localeCompare(b.course);
    case 'faculty':
      return a.faculty.localeCompare(b.faculty);
    case 'students':
      return a.studentCount - b.studentCount;
    case 'name':
    default:
      return a.name.localeCompare(b.name);
  }
}

export function listBatches(query: ListQuery): Paginated<BatchListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const course = String(query.filters?.course ?? '');
  const status = String(query.filters?.status ?? '');
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir === 'desc' ? 'desc' : 'asc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  let rows = SEED_BATCHES.map(toListItem).filter((row) => {
    if (search && !row.name.toLowerCase().includes(search) && !row.faculty.toLowerCase().includes(search)) {
      return false;
    }
    if (course && row.courseId !== course) return false;
    if (status === 'active' && !row.active) return false;
    if (status === 'inactive' && row.active) return false;
    return true;
  });

  rows = rows.sort((a, b) => {
    const result = compare(a, b, sortBy);
    return sortDir === 'asc' ? result : -result;
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getBatchDetail(id: string): BatchDetail | null {
  const batch = SEED_BATCHES.find((b) => b.id === id);
  if (!batch) return null;

  return {
    id: batch.id,
    name: batch.name,
    section: batch.section,
    active: batch.active,
    course: { id: batch.courseId, code: courseCode(batch.courseId), name: courseName(batch.courseId) },
    faculty: { id: batch.facultyId, name: facultyName(batch.facultyId) },
    studentCount: rosterSize(batch.id),
    schedule: SEED_CLASSES_TODAY.filter((c) => c.batchId === batch.id).map((c) => ({
      id: c.id,
      subject: c.subject,
      room: c.room,
      start: c.start,
      end: c.end,
      facultyId: c.facultyId,
      faculty: facultyName(c.facultyId),
    })),
    students: SEED_STUDENTS.filter((s) => s.batchId === batch.id).map((s) => ({
      id: s.id,
      registerNo: s.registerNo,
      name: s.name,
      status: s.status,
    })),
  };
}
