import type {
  StudentDetail,
  StudentFilterOptions,
  StudentListItem,
} from '@/features/students/types';
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

// --- Student detail (§14.1) -------------------------------------------------
// Believable, deterministic per-student data so the record reads like a real
// ERP. Demonstration data; a real backend owns all of this.

const CITIES = ['Chennai', 'Coimbatore', 'Madurai', 'Bengaluru', 'Kochi', 'Hyderabad'];
const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-'];
const GRADES = ['A+', 'A', 'B+', 'B', 'A'];
const SUBJECTS = ['Life Drawing', 'Colour Theory', 'Typography', 'Storyboarding', 'Clay Modelling'];

function seedIndex(id: string): number {
  const match = /(\d+)$/.exec(id);
  return match ? Number(match[1]) : 1;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
}

function feeStatus(index: number): 'paid' | 'partial' | 'overdue' {
  const mod = index % 3;
  return mod === 0 ? 'paid' : mod === 1 ? 'partial' : 'overdue';
}

export function getStudentDetail(id: string): StudentDetail | null {
  const student = SEED_STUDENTS.find((s) => s.id === id);
  if (!student) return null;

  const index = seedIndex(id);
  const surname = student.name.split(' ').slice(-1)[0] ?? 'Kumar';
  const year = ['1st Year', '2nd Year', '3rd Year'][index % 3] ?? '1st Year';

  const feeTotal = 90000 + (index % 4) * 15000;
  const status = feeStatus(index);
  const paid = status === 'paid' ? feeTotal : status === 'partial' ? Math.round(feeTotal * 0.6) : Math.round(feeTotal * 0.3);

  const attendancePercent = 74 + (index * 7) % 24;
  const attendanceTotal = 60;

  return {
    id: student.id,
    registerNo: student.registerNo,
    name: student.name,
    status: student.status,
    course: courseName(student.courseId),
    courseCode: courseCode(student.courseId),
    batch: batchName(student.batchId),
    section: student.section,

    personal: {
      dateOfBirth: `${2004 + (index % 3)}-0${(index % 9) + 1}-${String((index % 27) + 1).padStart(2, '0')}`,
      email: `${slug(student.name)}@student.mavenart.test`,
      phone: `+91 9${String(80000000 + index * 12345).slice(0, 9)}`,
      address: `${(index % 40) + 1}, Gallery Road, ${CITIES[index % CITIES.length]}`,
      bloodGroup: BLOOD_GROUPS[index % BLOOD_GROUPS.length] ?? 'O+',
      admissionDate: `${2024 + (index % 2)}-07-15`,
    },
    academic: {
      course: courseName(student.courseId),
      courseCode: courseCode(student.courseId),
      batch: batchName(student.batchId),
      section: student.section,
      year,
      enrollmentStatus: student.status === 'graduated' ? 'Completed' : 'Enrolled',
    },
    parents: [
      {
        id: `par-${student.id}-f`,
        name: `Mr. ${['Ramesh', 'Suresh', 'Anil', 'Vijay', 'Prakash'][index % 5]} ${surname}`,
        relation: 'Father',
        phone: `+91 9${String(70000000 + index * 54321).slice(0, 9)}`,
        email: `parent.${slug(surname)}@mavenart.test`,
      },
      {
        id: `par-${student.id}-m`,
        name: `Mrs. ${['Latha', 'Uma', 'Radha', 'Geetha', 'Shanti'][index % 5]} ${surname}`,
        relation: 'Mother',
        phone: `+91 9${String(60000000 + index * 13579).slice(0, 9)}`,
        email: `parent.${slug(surname)}.m@mavenart.test`,
      },
    ],
    enrollment: {
      course: courseName(student.courseId),
      batch: batchName(student.batchId),
      status: student.status === 'graduated' ? 'Completed' : 'Active',
      startDate: `${2024 + (index % 2)}-08-01`,
      endDate: student.status === 'graduated' ? `${2027 + (index % 2)}-05-31` : null,
    },
    summary: {
      attendance: {
        percent: attendancePercent,
        present: Math.round((attendancePercent / 100) * attendanceTotal),
        total: attendanceTotal,
      },
      fees: { total: feeTotal, paid, pending: feeTotal - paid, status },
      progress:
        index % 5 === 4
          ? null
          : { lastSubject: SUBJECTS[index % SUBJECTS.length] ?? 'Life Drawing', grade: GRADES[index % GRADES.length] ?? 'A' },
      certificates: { count: index % 4 },
    },
  };
}
