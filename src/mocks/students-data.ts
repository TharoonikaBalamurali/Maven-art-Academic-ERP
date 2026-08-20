import type {
  Gender,
  StudentAddress,
  StudentDetail,
  StudentFilterOptions,
  StudentInput,
  StudentListItem,
  StudentMedical,
  StudentSibling,
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
import { findParentIdForStudent } from './parents-data';

/**
 * In-memory students store for the mock backend.
 *
 * Behaves like a real data store within the session: the list, detail, create,
 * update and photo endpoints all read and write this one array, so a change is
 * reflected everywhere immediately. Demonstration data, reset on reload; a real
 * backend persists. Only the mock router imports this.
 */

const CITIES = ['Chennai', 'Coimbatore', 'Madurai', 'Bengaluru', 'Kochi', 'Hyderabad'];
const DISTRICTS = ['Chennai', 'Coimbatore', 'Madurai', 'Bengaluru Urban', 'Ernakulam', 'Hyderabad'];
const STATES = ['Tamil Nadu', 'Tamil Nadu', 'Tamil Nadu', 'Karnataka', 'Kerala', 'Telangana'];
const AREAS = ['Besant Nagar', 'R.S. Puram', 'Anna Nagar', 'Indiranagar', 'Panampilly Nagar', 'Banjara Hills'];
const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-'];
const GRADES = ['A+', 'A', 'B+', 'B', 'A'];
const SUBJECTS = ['Life Drawing', 'Colour Theory', 'Typography', 'Storyboarding', 'Clay Modelling'];
const FATHER_NAMES = ['Ramesh', 'Suresh', 'Anil', 'Vijay', 'Prakash'];
const MOTHER_NAMES = ['Latha', 'Uma', 'Radha', 'Geetha', 'Shanti'];
const OCCUPATIONS = ['Architect', 'Doctor', 'Business owner', 'Teacher', 'Engineer'];
const SIBLING_NAMES = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Vivaan', 'Anika'];
const SCHOOLS = ['Maven Art Academy', 'St. Xavier’s School', 'DAV Public School', 'National College'];

interface StudentRecord {
  id: string;
  registerNo: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  gender: Gender | '';
  photoUrl: string | null;
  courseId: string;
  batchId: string;
  section: string;
  status: StudentStatus;
  dateOfBirth: string;
  email: string;
  phone: string;
  alternatePhone: string;
  bloodGroup: string;
  address: StudentAddress;
  admissionDate: string;
  joiningDate: string;
  medical: StudentMedical;
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

function ageFrom(dateOfBirth: string): number | null {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

function nameParts(full: string): { firstName: string; middleName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? '', middleName: '', lastName: '' };
  return {
    firstName: parts[0] ?? '',
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1] ?? '',
  };
}

function seedRecord(student: (typeof SEED_STUDENTS)[number], index: number): StudentRecord {
  const i = index + 1;
  const g = i % 6;
  const gender: Gender = i % 2 === 0 ? 'female' : 'male';
  return {
    id: student.id,
    registerNo: student.registerNo,
    admissionNo: `ADM/2026/${String(1000 + i)}`,
    rollNo: `${courseCode(student.courseId)}-${student.section}-${String((i % 40) + 1).padStart(2, '0')}`,
    name: student.name,
    gender,
    photoUrl: null,
    courseId: student.courseId,
    batchId: student.batchId,
    section: student.section,
    status: student.status,
    dateOfBirth: `${2004 + (i % 3)}-0${(i % 9) + 1}-${String((i % 27) + 1).padStart(2, '0')}`,
    email: `${slug(student.name)}@student.mavenart.test`,
    phone: `+91 9${String(80000000 + i * 12345).slice(0, 9)}`,
    alternatePhone: i % 3 === 0 ? `+91 9${String(70000000 + i * 321).slice(0, 9)}` : '',
    bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length] ?? 'O+',
    address: {
      line1: `${(i % 40) + 1}, Gallery Road`,
      line2: i % 4 === 0 ? 'Near Art District' : '',
      area: AREAS[g] ?? 'Besant Nagar',
      city: CITIES[g] ?? 'Chennai',
      district: DISTRICTS[g] ?? 'Chennai',
      state: STATES[g] ?? 'Tamil Nadu',
      country: 'India',
      postalCode: `6000${String((i % 90) + 10)}`,
    },
    admissionDate: `${2024 + (i % 2)}-07-15`,
    joiningDate: `${2024 + (i % 2)}-07-20`,
    medical: {
      foodAllergies: i % 5 === 0 ? 'Peanuts' : '',
      otherAllergies: i % 7 === 0 ? 'Pollen' : '',
      accessibility: i % 11 === 0 ? 'Requires seating near the front' : '',
      emergencyContact: `+91 9${String(90000000 + i * 77).slice(0, 9)}`,
      notes: '',
    },
  };
}

const studentStore: StudentRecord[] = SEED_STUDENTS.map((student, index) => seedRecord(student, index));

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

function seedSiblings(id: string, surname: string): StudentSibling[] {
  const h = hash(id);
  const count = h % 3; // 0, 1 or 2 siblings
  return Array.from({ length: count }, (_, k) => {
    const idx = (h + k) % SIBLING_NAMES.length;
    return {
      id: `sib-${id}-${k}`,
      name: `${SIBLING_NAMES[idx]} ${surname}`,
      relation: (h + k) % 2 === 0 ? 'Brother' : 'Sister',
      dateOfBirth: `${2008 + ((h + k) % 6)}-0${((h + k) % 9) + 1}-15`,
      institution: SCHOOLS[(h + k) % SCHOOLS.length] ?? 'Maven Art Academy',
      className: `Grade ${((h + k) % 10) + 2}`,
    };
  });
}

export function getStudentDetail(id: string): StudentDetail | null {
  const record = studentStore.find((s) => s.id === id);
  if (!record) return null;

  const h = hash(id);
  const surname = record.name.split(' ').slice(-1)[0] ?? 'Kumar';
  const { firstName, middleName, lastName } = nameParts(record.name);
  const year = ['1st Year', '2nd Year', '3rd Year'][h % 3] ?? '1st Year';

  const feeTotal = 90000 + (h % 4) * 15000;
  const feeMod = h % 3;
  const status: 'paid' | 'partial' | 'overdue' = feeMod === 0 ? 'paid' : feeMod === 1 ? 'partial' : 'overdue';
  const paid = status === 'paid' ? feeTotal : status === 'partial' ? Math.round(feeTotal * 0.6) : Math.round(feeTotal * 0.3);

  const attendancePercent = 74 + (h % 24);
  const attendanceTotal = 60;

  const directoryParentId = findParentIdForStudent(id);
  const residential = `${record.address.line1}, ${record.address.area}, ${record.address.city}`;

  return {
    id: record.id,
    registerNo: record.registerNo,
    admissionNo: record.admissionNo,
    rollNo: record.rollNo,
    name: record.name,
    photoUrl: record.photoUrl,
    status: record.status,
    joiningDate: record.joiningDate,
    courseId: record.courseId,
    course: courseName(record.courseId),
    courseCode: courseCode(record.courseId),
    batchId: record.batchId,
    batch: batchName(record.batchId),
    section: record.section,

    personal: {
      firstName,
      middleName,
      lastName,
      dateOfBirth: record.dateOfBirth,
      age: ageFrom(record.dateOfBirth),
      gender: record.gender,
      email: record.email,
      phone: record.phone,
      alternatePhone: record.alternatePhone,
      address: { ...record.address },
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
        parentId: directoryParentId,
        name: `Mr. ${FATHER_NAMES[h % 5]} ${surname}`,
        relation: 'Father',
        phone: `+91 9${String(70000000 + (h % 9999999)).slice(0, 9)}`,
        alternatePhone: `+91 9${String(60000000 + (h % 9999999)).slice(0, 9)}`,
        email: `parent.${slug(surname)}@mavenart.test`,
        occupation: OCCUPATIONS[h % OCCUPATIONS.length] ?? 'Business owner',
        professionalAddress: `${(h % 30) + 1}, Commerce Towers, ${record.address.city}`,
        residentialAddress: residential,
        isEmergencyContact: true,
        guardianStatus: 'Primary guardian',
      },
      {
        id: `par-${record.id}-m`,
        parentId: null,
        name: `Mrs. ${MOTHER_NAMES[h % 5]} ${surname}`,
        relation: 'Mother',
        phone: `+91 9${String(60000000 + (h % 9999999)).slice(0, 9)}`,
        alternatePhone: '',
        email: `parent.${slug(surname)}.m@mavenart.test`,
        occupation: OCCUPATIONS[(h + 2) % OCCUPATIONS.length] ?? 'Teacher',
        professionalAddress: '',
        residentialAddress: residential,
        isEmergencyContact: false,
        guardianStatus: 'Guardian',
      },
    ],
    siblings: seedSiblings(id, surname),
    medical: { ...record.medical },
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

// --- Write (create / update / photo) ----------------------------------------

const KNOWN_COURSE_IDS = new Set(SEED_COURSES.map((c) => c.id));
const KNOWN_BATCH_IDS = new Set(SEED_BATCHES.map((b) => b.id));
const KNOWN_STATUSES = new Set(['active', 'on_leave', 'graduated']);
const KNOWN_GENDERS = new Set(['male', 'female', 'other']);

/**
 * Server-side validation (§30): the backend re-checks everything the client
 * checked, and owns rules the client cannot (uniqueness). Returns field errors
 * keyed for react-hook-form; empty means valid.
 */
function validate(input: StudentInput, selfId?: string): FieldErrors {
  const errors: FieldErrors = {};
  const required: [keyof StudentInput, string][] = [
    ['name', 'Name is required.'],
    ['gender', 'Gender is required.'],
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
  if (input.gender && !KNOWN_GENDERS.has(input.gender)) errors.gender = ['Unknown gender.'];
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

function normalizeAddress(a: Partial<StudentAddress> | undefined): StudentAddress {
  return {
    line1: a?.line1?.trim() ?? '',
    line2: a?.line2?.trim() ?? '',
    area: a?.area?.trim() ?? '',
    city: a?.city?.trim() ?? '',
    district: a?.district?.trim() ?? '',
    state: a?.state?.trim() ?? '',
    country: a?.country?.trim() || 'India',
    postalCode: a?.postalCode?.trim() ?? '',
  };
}

function normalizeMedical(m: Partial<StudentMedical> | undefined): StudentMedical {
  return {
    foodAllergies: m?.foodAllergies?.trim() ?? '',
    otherAllergies: m?.otherAllergies?.trim() ?? '',
    accessibility: m?.accessibility?.trim() ?? '',
    emergencyContact: m?.emergencyContact?.trim() ?? '',
    notes: m?.notes?.trim() ?? '',
  };
}

function applyInput(record: StudentRecord, input: StudentInput): void {
  record.name = input.name.trim();
  record.gender = input.gender;
  record.dateOfBirth = input.dateOfBirth;
  record.email = input.email.trim();
  record.phone = input.phone.trim();
  record.alternatePhone = input.alternatePhone?.trim() ?? '';
  record.bloodGroup = input.bloodGroup.trim();
  record.address = normalizeAddress(input.address);
  record.medical = normalizeMedical(input.medical);
  record.courseId = input.courseId;
  record.batchId = input.batchId;
  record.section = input.section;
  record.status = input.status;
  if (input.rollNo?.trim()) record.rollNo = input.rollNo.trim();
  if (input.admissionNo?.trim()) record.admissionNo = input.admissionNo.trim();
}

export function createStudent(input: StudentInput): StudentWriteResult {
  const fieldErrors = validate(input);
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  const seq = nextRegisterSeq;
  nextRegisterSeq += 1;
  const id = `stu-${String(1000 + seq)}`;
  const today = new Date().toISOString().slice(0, 10);
  const record: StudentRecord = {
    id,
    registerNo: `MAA2026${String(seq).padStart(4, '0')}`,
    admissionNo: input.admissionNo?.trim() || `ADM/2026/${String(1000 + seq)}`,
    rollNo: input.rollNo?.trim() || `${courseCode(input.courseId)}-${input.section}-${String(seq).padStart(2, '0')}`,
    name: input.name.trim(),
    gender: input.gender,
    photoUrl: null,
    courseId: input.courseId,
    batchId: input.batchId,
    section: input.section,
    status: input.status,
    dateOfBirth: input.dateOfBirth,
    email: input.email.trim(),
    phone: input.phone.trim(),
    alternatePhone: input.alternatePhone?.trim() ?? '',
    bloodGroup: input.bloodGroup.trim(),
    address: normalizeAddress(input.address),
    admissionDate: today,
    joiningDate: today,
    medical: normalizeMedical(input.medical),
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

/**
 * Sets or clears the student's profile photo. A real backend stores the file
 * and returns its URL; the mock accepts a data URI (or null) and echoes it back
 * on the detail record. Basic type/size are enforced client-side before upload.
 */
export function updateStudentPhoto(id: string, photo: string | null): StudentDetail | null {
  const record = studentStore.find((s) => s.id === id);
  if (!record) return null;
  record.photoUrl = photo;
  return getStudentDetail(id);
}
