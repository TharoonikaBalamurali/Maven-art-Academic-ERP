import type {
  StudentDetail,
  StudentFilterOptions,
  StudentInput,
  StudentListItem,
  StudentStatus,
} from '@/features/students/types';
import type { FieldErrors, ListQuery, Paginated } from '@/shared/types';
import {
  courseCode,
  courseName,
  batchName,
  SEED_BATCHES,
  SEED_COURSES,
  SEED_STUDENTS,
} from './seed';

/**
 * In-memory students store for the mock backend.
 *
 * Behaves like a real data store within the session: the list, detail, create
 * and update endpoints all read and write this one array, so creating or
 * editing a student is reflected everywhere immediately. Demonstration data,
 * reset on reload; a real backend persists. Only the mock router imports this.
 */

const CITIES = ['Chennai', 'Coimbatore', 'Madurai', 'Bengaluru', 'Kochi', 'Hyderabad'];
const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-'];
const GRADES = ['A+', 'A', 'B+', 'B', 'A'];
const SUBJECTS = ['Life Drawing', 'Colour Theory', 'Typography', 'Storyboarding', 'Clay Modelling'];

interface StudentRecord {
  id: string;
  registerNo: string;
  name: string;
  courseId: string;
  batchId: string;
  section: string;
  status: StudentStatus;
  dateOfBirth: string;
  email: string;
  phone: string;
  bloodGroup: string;
  address: string;
  admissionDate: string;
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
}

/** Stable non-negative hash of an id, so generated data is consistent per student. */
function hash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function seedPersonal(index: number, name: string): Omit<StudentRecord, 'id' | 'registerNo' | 'name' | 'courseId' | 'batchId' | 'section' | 'status'> {
  return {
    dateOfBirth: `${2004 + (index % 3)}-0${(index % 9) + 1}-${String((index % 27) + 1).padStart(2, '0')}`,
    email: `${slug(name)}@student.mavenart.test`,
    phone: `+91 9${String(80000000 + index * 12345).slice(0, 9)}`,
    bloodGroup: BLOOD_GROUPS[index % BLOOD_GROUPS.length] ?? 'O+',
    address: `${(index % 40) + 1}, Gallery Road, ${CITIES[index % CITIES.length]}`,
    admissionDate: `${2024 + (index % 2)}-07-15`,
  };
}

const studentStore: StudentRecord[] = SEED_STUDENTS.map((student, index) => ({
  id: student.id,
  registerNo: student.registerNo,
  name: student.name,
  courseId: student.courseId,
  batchId: student.batchId,
  section: student.section,
  status: student.status,
  ...seedPersonal(index + 1, student.name),
}));

let nextRegisterSeq = studentStore.length + 1;

function toListItem(record: StudentRecord): StudentListItem {
  return {
    id: record.id,
    registerNo: record.registerNo,
    name: record.name,
    courseId: record.courseId,
    course: courseName(record.courseId),
    courseCode: courseCode(record.courseId),
    batchId: record.batchId,
    batch: batchName(record.batchId),
    section: record.section,
    status: record.status,
  };
}

// --- List -------------------------------------------------------------------

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

  let rows = studentStore.map(toListItem).filter((row) => {
    if (search && !row.name.toLowerCase().includes(search) && !row.registerNo.toLowerCase().includes(search)) {
      return false;
    }
    if (course && row.courseId !== course) return false;
    if (status && row.status !== status) return false;
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

export function studentFilterOptions(): StudentFilterOptions {
  const usedCourseIds = new Set(studentStore.map((s) => s.courseId));
  return {
    courses: SEED_COURSES.filter((c) => usedCourseIds.has(c.id)).map((c) => ({ id: c.id, name: c.name })),
    batches: SEED_BATCHES.map((b) => ({ id: b.id, name: b.name, courseId: b.courseId })),
    sections: ['A', 'B', 'C'],
    statuses: [
      { value: 'active', label: 'Active' },
      { value: 'on_leave', label: 'On leave' },
      { value: 'graduated', label: 'Graduated' },
    ],
  };
}

// --- Detail -----------------------------------------------------------------

export function getStudentDetail(id: string): StudentDetail | null {
  const record = studentStore.find((s) => s.id === id);
  if (!record) return null;

  const h = hash(id);
  const surname = record.name.split(' ').slice(-1)[0] ?? 'Kumar';
  const year = ['1st Year', '2nd Year', '3rd Year'][h % 3] ?? '1st Year';

  const feeTotal = 90000 + (h % 4) * 15000;
  const feeMod = h % 3;
  const status: 'paid' | 'partial' | 'overdue' = feeMod === 0 ? 'paid' : feeMod === 1 ? 'partial' : 'overdue';
  const paid = status === 'paid' ? feeTotal : status === 'partial' ? Math.round(feeTotal * 0.6) : Math.round(feeTotal * 0.3);

  const attendancePercent = 74 + (h % 24);
  const attendanceTotal = 60;

  return {
    id: record.id,
    registerNo: record.registerNo,
    name: record.name,
    status: record.status,
    courseId: record.courseId,
    course: courseName(record.courseId),
    courseCode: courseCode(record.courseId),
    batchId: record.batchId,
    batch: batchName(record.batchId),
    section: record.section,

    personal: {
      dateOfBirth: record.dateOfBirth,
      email: record.email,
      phone: record.phone,
      address: record.address,
      bloodGroup: record.bloodGroup,
      admissionDate: record.admissionDate,
    },
    academic: {
      course: courseName(record.courseId),
      courseCode: courseCode(record.courseId),
      batch: batchName(record.batchId),
      section: record.section,
      year,
      enrollmentStatus: record.status === 'graduated' ? 'Completed' : 'Enrolled',
    },
    parents: [
      {
        id: `par-${record.id}-f`,
        name: `Mr. ${['Ramesh', 'Suresh', 'Anil', 'Vijay', 'Prakash'][h % 5]} ${surname}`,
        relation: 'Father',
        phone: `+91 9${String(70000000 + (h % 9999999)).slice(0, 9)}`,
        email: `parent.${slug(surname)}@mavenart.test`,
      },
      {
        id: `par-${record.id}-m`,
        name: `Mrs. ${['Latha', 'Uma', 'Radha', 'Geetha', 'Shanti'][h % 5]} ${surname}`,
        relation: 'Mother',
        phone: `+91 9${String(60000000 + (h % 9999999)).slice(0, 9)}`,
        email: `parent.${slug(surname)}.m@mavenart.test`,
      },
    ],
    enrollment: {
      course: courseName(record.courseId),
      batch: batchName(record.batchId),
      status: record.status === 'graduated' ? 'Completed' : 'Active',
      startDate: record.admissionDate,
      endDate: record.status === 'graduated' ? `${2027 + (h % 2)}-05-31` : null,
    },
    summary: {
      attendance: {
        percent: attendancePercent,
        present: Math.round((attendancePercent / 100) * attendanceTotal),
        total: attendanceTotal,
      },
      fees: { total: feeTotal, paid, pending: feeTotal - paid, status },
      progress:
        h % 5 === 4 ? null : { lastSubject: SUBJECTS[h % SUBJECTS.length] ?? 'Life Drawing', grade: GRADES[h % GRADES.length] ?? 'A' },
      certificates: { count: h % 4 },
    },
  };
}

// --- Write (create / update) ------------------------------------------------

const KNOWN_COURSE_IDS = new Set(SEED_COURSES.map((c) => c.id));
const KNOWN_BATCH_IDS = new Set(SEED_BATCHES.map((b) => b.id));
const KNOWN_STATUSES = new Set(['active', 'on_leave', 'graduated']);

/**
 * Server-side validation (§30): the backend re-checks everything the client
 * checked, and owns rules the client cannot (uniqueness). Returns field errors
 * keyed for react-hook-form; empty means valid.
 */
function validate(input: StudentInput, selfId?: string): FieldErrors {
  const errors: FieldErrors = {};
  const required: [keyof StudentInput, string][] = [
    ['name', 'Name is required.'],
    ['dateOfBirth', 'Date of birth is required.'],
    ['email', 'Email is required.'],
    ['phone', 'Phone is required.'],
    ['courseId', 'Course is required.'],
    ['batchId', 'Batch is required.'],
    ['section', 'Section is required.'],
    ['status', 'Status is required.'],
  ];
  for (const [field, message] of required) {
    if (!String(input[field] ?? '').trim()) errors[field] = [message];
  }

  if (input.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email)) {
    errors.email = ['Enter a valid email address.'];
  }
  if (input.courseId && !KNOWN_COURSE_IDS.has(input.courseId)) errors.courseId = ['Unknown course.'];
  if (input.batchId && !KNOWN_BATCH_IDS.has(input.batchId)) errors.batchId = ['Unknown batch.'];
  if (input.status && !KNOWN_STATUSES.has(input.status)) errors.status = ['Unknown status.'];

  // Uniqueness — a rule only the backend can enforce.
  if (input.email && !errors.email) {
    const clash = studentStore.some(
      (s) => s.email.toLowerCase() === input.email.trim().toLowerCase() && s.id !== selfId,
    );
    if (clash) errors.email = ['A student with this email already exists.'];
  }

  return errors;
}

export interface StudentWriteResult {
  ok: boolean;
  fieldErrors?: FieldErrors;
  detail?: StudentDetail;
}

function applyInput(record: StudentRecord, input: StudentInput): void {
  record.name = input.name.trim();
  record.dateOfBirth = input.dateOfBirth;
  record.email = input.email.trim();
  record.phone = input.phone.trim();
  record.bloodGroup = input.bloodGroup.trim();
  record.address = input.address.trim();
  record.courseId = input.courseId;
  record.batchId = input.batchId;
  record.section = input.section;
  record.status = input.status;
}

export function createStudent(input: StudentInput): StudentWriteResult {
  const fieldErrors = validate(input);
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  const seq = nextRegisterSeq;
  nextRegisterSeq += 1;
  const id = `stu-${String(1000 + seq)}`;
  const record: StudentRecord = {
    id,
    registerNo: `MAA2026${String(seq).padStart(4, '0')}`,
    name: input.name.trim(),
    courseId: input.courseId,
    batchId: input.batchId,
    section: input.section,
    status: input.status,
    dateOfBirth: input.dateOfBirth,
    email: input.email.trim(),
    phone: input.phone.trim(),
    bloodGroup: input.bloodGroup.trim(),
    address: input.address.trim(),
    admissionDate: new Date().toISOString().slice(0, 10),
  };
  // New students appear at the top of the list.
  studentStore.unshift(record);
  return { ok: true, detail: getStudentDetail(id) ?? undefined };
}

export function updateStudent(id: string, input: StudentInput): StudentWriteResult | null {
  const record = studentStore.find((s) => s.id === id);
  if (!record) return null;

  const fieldErrors = validate(input, id);
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  applyInput(record, input);
  return { ok: true, detail: getStudentDetail(id) ?? undefined };
}
