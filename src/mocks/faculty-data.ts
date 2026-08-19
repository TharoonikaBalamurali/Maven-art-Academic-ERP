import type { FacultyDetail, FacultyListItem } from '@/features/faculty/types';
import type { ListQuery, Paginated } from '@/shared/types';
import {
  courseName,
  SEED_BATCHES,
  SEED_FACULTY,
  SEED_STUDENTS,
  SEED_TIMETABLE,
} from './seed';

/** Management view of faculty (§3.1), derived from the seed. */

function email(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@faculty.mavenart.test`;
}

function batchesOf(facultyId: string) {
  return SEED_BATCHES.filter((b) => b.facultyId === facultyId);
}

function studentsOf(facultyId: string): number {
  const batchIds = new Set(batchesOf(facultyId).map((b) => b.id));
  return SEED_STUDENTS.filter((s) => batchIds.has(s.batchId)).length;
}

function toListItem(member: (typeof SEED_FACULTY)[number]): FacultyListItem {
  return {
    id: member.id,
    name: member.name,
    email: email(member.name),
    batchCount: batchesOf(member.id).length,
    studentCount: studentsOf(member.id),
  };
}

function compare(a: FacultyListItem, b: FacultyListItem, sortBy: string): number {
  switch (sortBy) {
    case 'batches':
      return a.batchCount - b.batchCount;
    case 'students':
      return a.studentCount - b.studentCount;
    case 'name':
    default:
      return a.name.localeCompare(b.name);
  }
}

export function listFaculty(query: ListQuery): Paginated<FacultyListItem> {
  const search = String(query.search ?? '').trim().toLowerCase();
  const sortBy = query.sortBy ?? 'name';
  const sortDir = query.sortDir === 'desc' ? 'desc' : 'asc';
  const page = Number(query.page ?? 1) || 1;
  const limit = Number(query.limit ?? 10) || 10;

  let rows = SEED_FACULTY.map(toListItem).filter(
    (row) => !search || row.name.toLowerCase().includes(search) || row.email.toLowerCase().includes(search),
  );
  rows = rows.sort((a, b) => (sortDir === 'asc' ? compare(a, b, sortBy) : -compare(a, b, sortBy)));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return { data: rows.slice(start, start + limit), page: safePage, limit, total, totalPages };
}

export function getFacultyDetail(id: string): FacultyDetail | null {
  const member = SEED_FACULTY.find((f) => f.id === id);
  if (!member) return null;

  const batches = batchesOf(id);
  const subjects = [...new Set(SEED_TIMETABLE.filter((s) => s.facultyId === id).map((s) => s.subject))];

  return {
    id: member.id,
    name: member.name,
    email: email(member.name),
    batchCount: batches.length,
    studentCount: studentsOf(id),
    subjects,
    batches: batches.map((b) => ({
      id: b.id,
      name: b.name,
      course: courseName(b.courseId),
      studentCount: SEED_STUDENTS.filter((s) => s.batchId === b.id).length,
    })),
  };
}
