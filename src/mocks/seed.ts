/**
 * Realistic institutional seed data for the mock backend.
 *
 * Maven Art Academic is an art academy, so this data is art-education shaped:
 * fine-art and design programmes, studio batches, and believable names
 * consistent with the sign-in accounts in `fixtures.ts`.
 *
 * IMPORTANT — this is demonstration data, not authoritative institutional data.
 * It exists so the mock API can return realistic responses (as the directive's
 * "Mock API Development" section requires) and is deleted at integration time.
 * The UI reads every figure below **through the API layer**, never by importing
 * this file directly — so `VITE_API_MODE=http` reads the real backend with no
 * component change. Only the mock router (`mock-router.ts`) imports this.
 */

export interface SeedCourse {
  id: string;
  code: string;
  name: string;
}

export interface SeedBatch {
  id: string;
  name: string;
  courseId: string;
  section: string;
  facultyId: string;
  studentCount: number;
  active: boolean;
}

export interface SeedStudent {
  id: string;
  registerNo: string;
  name: string;
  courseId: string;
  batchId: string;
  section: string;
  status: 'active' | 'on_leave' | 'graduated';
}

export interface SeedClass {
  id: string;
  batchId: string;
  subject: string;
  room: string;
  /** 24h "HH:MM". */
  start: string;
  end: string;
  facultyId: string;
}

export const SEED_COURSES: readonly SeedCourse[] = [
  { id: 'crs-bfa', code: 'BFA', name: 'Bachelor of Fine Arts' },
  { id: 'crs-vcd', code: 'VCD', name: 'Visual Communication & Design' },
  { id: 'crs-anim', code: 'ANIM', name: 'Animation & Motion Design' },
  { id: 'crs-scul', code: 'SCUL', name: 'Sculpture & Ceramics' },
  { id: 'crs-photo', code: 'PHOT', name: 'Photography' },
];

export const SEED_FACULTY = [
  { id: 'u-faculty', name: 'Suresh Iyer' },
  { id: 'fac-002', name: 'Meera Nair' },
  { id: 'fac-003', name: 'Rahul Deshpande' },
  { id: 'fac-004', name: 'Priya Venkatesh' },
] as const;

export const SEED_BATCHES: readonly SeedBatch[] = [
  { id: 'bat-bfa-1a', name: 'BFA Year 1 · A', courseId: 'crs-bfa', section: 'A', facultyId: 'u-faculty', studentCount: 32, active: true },
  { id: 'bat-bfa-2a', name: 'BFA Year 2 · A', courseId: 'crs-bfa', section: 'A', facultyId: 'u-faculty', studentCount: 28, active: true },
  { id: 'bat-vcd-1a', name: 'VCD Year 1 · A', courseId: 'crs-vcd', section: 'A', facultyId: 'fac-002', studentCount: 30, active: true },
  { id: 'bat-anim-1a', name: 'Animation Year 1 · A', courseId: 'crs-anim', section: 'A', facultyId: 'fac-003', studentCount: 26, active: true },
  { id: 'bat-scul-1a', name: 'Sculpture Year 1 · A', courseId: 'crs-scul', section: 'A', facultyId: 'fac-004', studentCount: 18, active: true },
  { id: 'bat-photo-1a', name: 'Photography Year 1 · A', courseId: 'crs-photo', section: 'A', facultyId: 'fac-002', studentCount: 22, active: false },
];

/** Batches taught by the demo faculty account (Suresh Iyer). */
export const FACULTY_ACCOUNT_ID = 'u-faculty';

const STUDENT_NAMES = [
  'Nithya Balan', 'Arjun Menon', 'Kavya Reddy', 'Farhan Sheikh', 'Ananya Pillai',
  'Vikram Rao', 'Sneha Kulkarni', 'Imran Qureshi', 'Divya Nambiar', 'Karthik Subramanian',
  'Riya Chandra', 'Aditya Bose', 'Lakshmi Iyer', 'Zoya Khan', 'Rohan Gupta',
  'Meghna Das', 'Sanjay Varma', 'Tara Krishnan', 'Nikhil Joseph', 'Pooja Shetty',
  'Ishaan Verma', 'Aisha Rahman', 'Manoj Pillai', 'Sruthi Warrier', 'Dev Anand',
  'Reema Sen', 'Harish Nair', 'Fatima Sheikh', 'Gaurav Malhotra', 'Ishita Roy',
  'Vivek Menon', 'Anjali Deshmukh', 'Kabir Singh', 'Neha Kapoor', 'Suhas Kamath',
  'Ritu Agarwal', 'Aravind Krishnan', 'Sana Mirza', 'Deepak Raju', 'Preeti Nanda',
  'Yash Thakur', 'Leela Menon', 'Omar Farooq', 'Charita Reddy', 'Nandini Ghosh',
  'Rahul Pillai', 'Bhavya Shah', 'Tanvi Joshi', 'Aryan Nair', 'Keerthana Rao',
];

export const SEED_STUDENTS: readonly SeedStudent[] = STUDENT_NAMES.map((name, index) => {
  const batch = SEED_BATCHES[index % SEED_BATCHES.length]!;
  const statuses: SeedStudent['status'][] = ['active', 'active', 'active', 'on_leave', 'active'];
  return {
    id: `stu-${String(index + 1).padStart(3, '0')}`,
    registerNo: `MAA${2026}${String(index + 1).padStart(4, '0')}`,
    name,
    courseId: batch.courseId,
    batchId: batch.id,
    section: batch.section,
    status: statuses[index % statuses.length] ?? 'active',
  };
});

export const TOTAL_ENROLLED = SEED_BATCHES.filter((b) => b.active).reduce(
  (sum, b) => sum + b.studentCount,
  0,
);

/** Today's timetable, referenced by both the Admin and Faculty dashboards. */
export const SEED_CLASSES_TODAY: readonly SeedClass[] = [
  { id: 'cls-1', batchId: 'bat-bfa-1a', subject: 'Life Drawing', room: 'Studio 2', start: '09:00', end: '10:30', facultyId: 'u-faculty' },
  { id: 'cls-2', batchId: 'bat-vcd-1a', subject: 'Typography', room: 'Design Lab', start: '09:00', end: '10:30', facultyId: 'fac-002' },
  { id: 'cls-3', batchId: 'bat-bfa-2a', subject: 'Colour Theory', room: 'Studio 1', start: '11:00', end: '12:30', facultyId: 'u-faculty' },
  { id: 'cls-4', batchId: 'bat-anim-1a', subject: 'Storyboarding', room: 'Media Lab', start: '11:00', end: '12:30', facultyId: 'fac-003' },
  { id: 'cls-5', batchId: 'bat-scul-1a', subject: 'Clay Modelling', room: 'Ceramics', start: '13:30', end: '15:00', facultyId: 'fac-004' },
  { id: 'cls-6', batchId: 'bat-bfa-1a', subject: 'Art History', room: 'Room 104', start: '15:15', end: '16:15', facultyId: 'u-faculty' },
];

export function batchName(id: string): string {
  return SEED_BATCHES.find((b) => b.id === id)?.name ?? id;
}

/**
 * Weekly timetable (§20). The backend owns scheduling; this is the published
 * schedule the frontend merely lays out. Rooms are drawn from a fixed set.
 */
export interface SeedTimetableSlot {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  batchId: string;
  subject: string;
  room: string;
  start: string;
  end: string;
  facultyId: string;
}

export const SEED_ROOMS = ['Studio 1', 'Studio 2', 'Design Lab', 'Media Lab', 'Ceramics', 'Room 104'];

export const SEED_TIMETABLE: readonly SeedTimetableSlot[] = [
  // Monday
  { id: 'tt-01', day: 'Mon', batchId: 'bat-bfa-1a', subject: 'Life Drawing', room: 'Studio 2', start: '09:00', end: '10:30', facultyId: 'u-faculty' },
  { id: 'tt-02', day: 'Mon', batchId: 'bat-vcd-1a', subject: 'Typography', room: 'Design Lab', start: '09:00', end: '10:30', facultyId: 'fac-002' },
  { id: 'tt-03', day: 'Mon', batchId: 'bat-bfa-2a', subject: 'Colour Theory', room: 'Studio 1', start: '11:00', end: '12:30', facultyId: 'u-faculty' },
  { id: 'tt-04', day: 'Mon', batchId: 'bat-anim-1a', subject: 'Storyboarding', room: 'Media Lab', start: '13:30', end: '15:00', facultyId: 'fac-003' },
  // Tuesday
  { id: 'tt-05', day: 'Tue', batchId: 'bat-scul-1a', subject: 'Clay Modelling', room: 'Ceramics', start: '09:00', end: '11:00', facultyId: 'fac-004' },
  { id: 'tt-06', day: 'Tue', batchId: 'bat-bfa-1a', subject: 'Art History', room: 'Room 104', start: '11:15', end: '12:15', facultyId: 'u-faculty' },
  { id: 'tt-07', day: 'Tue', batchId: 'bat-vcd-1a', subject: 'Brand Identity', room: 'Design Lab', start: '13:30', end: '15:00', facultyId: 'fac-002' },
  // Wednesday
  { id: 'tt-08', day: 'Wed', batchId: 'bat-bfa-1a', subject: 'Life Drawing', room: 'Studio 2', start: '09:00', end: '10:30', facultyId: 'u-faculty' },
  { id: 'tt-09', day: 'Wed', batchId: 'bat-anim-1a', subject: 'Character Design', room: 'Media Lab', start: '11:00', end: '12:30', facultyId: 'fac-003' },
  { id: 'tt-10', day: 'Wed', batchId: 'bat-bfa-2a', subject: 'Printmaking', room: 'Studio 1', start: '13:30', end: '15:30', facultyId: 'u-faculty' },
  // Thursday
  { id: 'tt-11', day: 'Thu', batchId: 'bat-vcd-1a', subject: 'Typography', room: 'Design Lab', start: '09:00', end: '10:30', facultyId: 'fac-002' },
  { id: 'tt-12', day: 'Thu', batchId: 'bat-scul-1a', subject: 'Mould Making', room: 'Ceramics', start: '11:00', end: '13:00', facultyId: 'fac-004' },
  { id: 'tt-13', day: 'Thu', batchId: 'bat-bfa-1a', subject: 'Colour Theory', room: 'Studio 2', start: '14:00', end: '15:30', facultyId: 'u-faculty' },
  // Friday
  { id: 'tt-14', day: 'Fri', batchId: 'bat-anim-1a', subject: 'Animation Principles', room: 'Media Lab', start: '09:00', end: '11:00', facultyId: 'fac-003' },
  { id: 'tt-15', day: 'Fri', batchId: 'bat-bfa-2a', subject: 'Portfolio Review', room: 'Studio 1', start: '11:15', end: '12:45', facultyId: 'u-faculty' },
  { id: 'tt-16', day: 'Fri', batchId: 'bat-vcd-1a', subject: 'Editorial Design', room: 'Design Lab', start: '13:30', end: '15:00', facultyId: 'fac-002' },
];

export function courseName(id: string): string {
  return SEED_COURSES.find((c) => c.id === id)?.name ?? id;
}

export function courseCode(id: string): string {
  return SEED_COURSES.find((c) => c.id === id)?.code ?? id;
}

export function facultyName(id: string): string {
  return SEED_FACULTY.find((f) => f.id === id)?.name ?? id;
}

// --- Admissions pipeline (Enquiry → Application → Admission) ----------------

export const SEED_ENQUIRIES = [
  { id: 'enq-041', name: 'Ishita Malhotra', programme: 'Bachelor of Fine Arts', receivedAt: '2026-08-16', stage: 'new' },
  { id: 'enq-040', name: 'Dev Patel', programme: 'Animation & Motion Design', receivedAt: '2026-08-15', stage: 'contacted' },
  { id: 'enq-039', name: 'Sara Thomas', programme: 'Photography', receivedAt: '2026-08-15', stage: 'new' },
  { id: 'enq-038', name: 'Aryan Kapoor', programme: 'Visual Communication & Design', receivedAt: '2026-08-14', stage: 'contacted' },
] as const;

export const PENDING_ENQUIRIES = 7;
export const PENDING_APPLICATIONS = 4;

export const SEED_RECENT_ADMISSIONS = [
  { id: 'adm-118', name: 'Neha Krishnan', programme: 'Bachelor of Fine Arts', admittedAt: '2026-08-14' },
  { id: 'adm-117', name: 'Yusuf Ali', programme: 'Sculpture & Ceramics', admittedAt: '2026-08-13' },
  { id: 'adm-116', name: 'Ritika Sharma', programme: 'Visual Communication & Design', admittedAt: '2026-08-12' },
] as const;

// --- Finance (amounts in whole INR — demonstration figures) -----------------

export const FINANCE = {
  todaysCollection: 184500,
  monthlyCollection: 2760000,
  outstandingTotal: 1425000,
  pendingPaymentsCount: 12,
} as const;

export const SEED_TRANSACTIONS = [
  { id: 'rcpt-2291', student: 'Arjun Menon', registerNo: 'MAA20260002', amount: 45000, method: 'UPI', at: '2026-08-18T10:24:00.000Z' },
  { id: 'rcpt-2290', student: 'Kavya Reddy', registerNo: 'MAA20260003', amount: 30000, method: 'Card', at: '2026-08-18T09:58:00.000Z' },
  { id: 'rcpt-2289', student: 'Divya Nambiar', registerNo: 'MAA20260009', amount: 60000, method: 'Bank Transfer', at: '2026-08-18T09:12:00.000Z' },
  { id: 'rcpt-2288', student: 'Rohan Gupta', registerNo: 'MAA20260015', amount: 22500, method: 'UPI', at: '2026-08-18T08:47:00.000Z' },
  { id: 'rcpt-2287', student: 'Tara Krishnan', registerNo: 'MAA20260018', amount: 27000, method: 'Cash', at: '2026-08-17T16:30:00.000Z' },
] as const;

export const SEED_UPCOMING_INSTALLMENTS = [
  { id: 'inst-501', student: 'Farhan Sheikh', registerNo: 'MAA20260004', amount: 45000, dueOn: '2026-08-25' },
  { id: 'inst-502', student: 'Ananya Pillai', registerNo: 'MAA20260005', amount: 45000, dueOn: '2026-08-28' },
  { id: 'inst-503', student: 'Vikram Rao', registerNo: 'MAA20260006', amount: 30000, dueOn: '2026-08-31' },
] as const;

// --- Attendance (percentages are demonstration figures) ---------------------

export const TODAYS_ATTENDANCE_PCT = 92;

export const SEED_RECENT_ATTENDANCE = [
  { id: 'att-1', batchId: 'bat-bfa-1a', subject: 'Life Drawing', date: '2026-08-17', present: 30, total: 32 },
  { id: 'att-2', batchId: 'bat-bfa-2a', subject: 'Colour Theory', date: '2026-08-17', present: 26, total: 28 },
] as const;
