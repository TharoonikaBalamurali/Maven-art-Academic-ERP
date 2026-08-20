import type {
  PortalAttendance,
  PortalCertificates,
  PortalChildren,
  PortalCourse,
  PortalFees,
  PortalOverview,
  PortalPaymentChannel,
  PortalPayments,
  PortalPayOrder,
  PortalPayResult,
  PortalProfile,
  PortalProgress,
  PortalTimetable,
} from '@/features/portal/types';

/**
 * Portal mock (§7, §8).
 *
 * The backend scopes portal data to the caller — for a student, their own
 * record; for a parent, the SELECTED linked child. Each child is a full bundle;
 * the scoped endpoints resolve the requested child (falling back to the first)
 * and return its figures. Amounts, attendance and grades are the backend's
 * values. In-memory for the session.
 *
 * TBD — BACKEND CONTRACT: the selected-child is carried here as a `student`
 * query param; the real contract may use a header, and the backend enforces
 * that the parent may actually read that child (§8).
 */
interface ChildBundle {
  id: string;
  overview: PortalOverview;
  profile: PortalProfile;
  course: PortalCourse;
  timetable: PortalTimetable;
  attendance: PortalAttendance;
  progress: PortalProgress;
  fees: PortalFees;
  payments: PortalPayments;
  certificates: PortalCertificates;
}

const NITHYA: ChildBundle = {
  id: 'stu-001',
  overview: {
    student: { name: 'Nithya Balan', registerNo: 'MAA20260001', course: 'Bachelor of Fine Arts', batch: 'BFA Year 1 · A' },
    attendance: { percentage: 92, present: 118, total: 128 },
    fees: { assigned: 158000, paid: 60000, outstanding: 98000, status: 'partial' },
    nextClass: { subject: 'Foundation Drawing', day: 'Monday', time: '09:00 – 10:30', room: 'Studio 2' },
    latestGrade: { assessment: 'Foundation Drawing — Midterm', grade: 'A+' },
    pendingTasks: 3,
    todaySchedule: [
      { id: 'ts-1', subject: 'Foundation Drawing', time: '09:00 – 10:30', room: 'Studio 2', status: 'done' },
      { id: 'ts-2', subject: 'Art History', time: '11:00 – 12:00', room: 'Room 4', status: 'now' },
      { id: 'ts-3', subject: 'Colour & Composition', time: '13:00 – 15:00', room: 'Studio 1', status: 'upcoming' },
    ],
    upcomingActivities: [
      { id: 'ua-1', title: 'Art History — Quiz', date: '2026-08-22', meta: 'Room 4 · 11:00 AM' },
      { id: 'ua-2', title: 'Parent–teacher meeting', date: '2026-08-24', meta: 'Virtual · 4:00 PM' },
      { id: 'ua-3', title: 'Foundation Drawing — Final', date: '2026-08-28', meta: 'Studio 2 · 10:00 AM' },
      { id: 'ua-4', title: 'Fee installment 2 due', date: '2026-09-15', meta: '₹50,000' },
    ],
    reminders: [
      { id: 'rm-1', label: 'Next class', detail: 'Art History · Room 4', to: '/portal/timetable' },
      { id: 'rm-2', label: 'Fee due', detail: '₹50,000 due 15 Sep', to: '/portal/fees' },
      { id: 'rm-3', label: 'New grade published', detail: 'Foundation Drawing — Midterm', to: '/portal/progress' },
    ],
    recentGrades: [
      { id: 'prg-803', assessment: 'Foundation Drawing — Midterm', grade: 'A+' },
      { id: 'prg-810', assessment: 'Colour & Composition — Assignment 1', grade: 'B+' },
      { id: 'prg-811', assessment: 'Art History — Quiz 1', grade: 'B' },
    ],
  },
  profile: {
    name: 'Nithya Balan', registerNo: 'MAA20260001', email: 'nithya.balan@example.com', phone: '+91 90000 20001',
    dateOfBirth: '2007-03-14', address: '48 Besant Nagar, Chennai 600090', course: 'Bachelor of Fine Arts',
    batch: 'BFA Year 1 · A', admittedOn: '2026-06-15', guardianName: 'Balan Muthu', guardianPhone: '+91 90000 10001',
  },
  course: {
    course: 'Bachelor of Fine Arts', code: 'BFA', batch: 'BFA Year 1 · A', facultyName: 'Suresh Iyer', startedOn: '2026-06-15',
    subjects: [
      { name: 'Foundation Drawing', faculty: 'Suresh Iyer' },
      { name: 'Colour & Composition', faculty: 'Meera Nair' },
      { name: 'Art History', faculty: 'Priya Venkatesh' },
      { name: 'Sculpture Basics', faculty: 'Rahul Deshpande' },
    ],
  },
  timetable: {
    week: [
      { day: 'Monday', sessions: [
        { subject: 'Foundation Drawing', time: '09:00 – 10:30', room: 'Studio 2', faculty: 'Suresh Iyer' },
        { subject: 'Art History', time: '11:00 – 12:00', room: 'Room 4', faculty: 'Priya Venkatesh' },
      ] },
      { day: 'Tuesday', sessions: [{ subject: 'Colour & Composition', time: '09:00 – 11:00', room: 'Studio 1', faculty: 'Meera Nair' }] },
      { day: 'Wednesday', sessions: [
        { subject: 'Foundation Drawing', time: '09:00 – 10:30', room: 'Studio 2', faculty: 'Suresh Iyer' },
        { subject: 'Sculpture Basics', time: '13:00 – 15:00', room: 'Workshop', faculty: 'Rahul Deshpande' },
      ] },
      { day: 'Thursday', sessions: [{ subject: 'Colour & Composition', time: '09:00 – 11:00', room: 'Studio 1', faculty: 'Meera Nair' }] },
      { day: 'Friday', sessions: [
        { subject: 'Art History', time: '10:00 – 11:00', room: 'Room 4', faculty: 'Priya Venkatesh' },
        { subject: 'Sculpture Basics', time: '13:00 – 15:00', room: 'Workshop', faculty: 'Rahul Deshpande' },
      ] },
      { day: 'Saturday', sessions: [] },
    ],
  },
  attendance: {
    percentage: 92, present: 118, total: 128,
    recent: [
      { date: '2026-08-19', subject: 'Foundation Drawing', status: 'present' },
      { date: '2026-08-18', subject: 'Colour & Composition', status: 'present' },
      { date: '2026-08-16', subject: 'Sculpture Basics', status: 'late' },
      { date: '2026-08-15', subject: 'Art History', status: 'absent' },
      { date: '2026-08-14', subject: 'Foundation Drawing', status: 'present' },
    ],
  },
  progress: {
    records: [
      { id: 'prg-803', assessment: 'Foundation Drawing — Midterm', type: 'Studio', score: 91, maxScore: 100, grade: 'A+', result: 'Pass', status: 'graded', date: '2026-08-12' },
      { id: 'prg-810', assessment: 'Colour & Composition — Assignment 1', type: 'Portfolio', score: 78, maxScore: 100, grade: 'B+', result: 'Pass', status: 'graded', date: '2026-07-28' },
      { id: 'prg-811', assessment: 'Art History — Quiz 1', type: 'Written', score: 64, maxScore: 100, grade: 'B', result: 'Pass', status: 'graded', date: '2026-07-20' },
      { id: 'prg-812', assessment: 'Sculpture Basics — Project', type: 'Project', score: null, maxScore: 100, grade: null, result: null, status: 'pending', date: null },
    ],
  },
  fees: {
    assigned: 158000, paid: 60000, outstanding: 98000, status: 'partial',
    installments: [
      { label: 'Installment 1 of 3', amount: 60000, dueDate: '2026-07-15', status: 'paid' },
      { label: 'Installment 2 of 3', amount: 50000, dueDate: '2026-09-15', status: 'due' },
      { label: 'Installment 3 of 3', amount: 48000, dueDate: '2026-11-15', status: 'upcoming' },
    ],
  },
  payments: { records: [{ id: 'pay-960', amount: 60000, method: 'upi', date: '2026-07-12', receiptNo: 'MA/2026/0960', status: 'recorded' }] },
  certificates: {
    records: [
      { id: 'cert-403', certificateNo: 'MA/CERT/2026/0403', type: 'merit', issuedAt: '2026-08-13', status: 'issued' },
      { id: 'cert-420', certificateNo: 'MA/CERT/2026/0420', type: 'bonafide', issuedAt: '2026-08-02', status: 'issued' },
    ],
  },
};

const ARJUN: ChildBundle = {
  id: 'stu-050',
  overview: {
    student: { name: 'Arjun Balan', registerNo: 'MAA20260050', course: 'Photography', batch: 'PH Year 1 · A' },
    attendance: { percentage: 84, present: 96, total: 114 },
    fees: { assigned: 130000, paid: 130000, outstanding: 0, status: 'paid' },
    nextClass: { subject: 'Studio Lighting', day: 'Tuesday', time: '10:00 – 12:00', room: 'Photo Lab' },
    latestGrade: { assessment: 'Composition — Midterm', grade: 'B+' },
    pendingTasks: 1,
    todaySchedule: [
      { id: 'ts-a1', subject: 'Composition', time: '09:00 – 11:00', room: 'Photo Lab', status: 'done' },
      { id: 'ts-a2', subject: 'Studio Lighting', time: '12:00 – 14:00', room: 'Photo Lab', status: 'now' },
      { id: 'ts-a3', subject: 'Digital Post-production', time: '15:00 – 17:00', room: 'Computer Lab', status: 'upcoming' },
    ],
    upcomingActivities: [
      { id: 'ua-a1', title: 'Portfolio review', date: '2026-08-26', meta: 'Studio · 2:00 PM' },
      { id: 'ua-a2', title: 'Composition — Final', date: '2026-08-30', meta: 'Photo Lab · 10:00 AM' },
    ],
    reminders: [
      { id: 'rm-a1', label: 'Next class', detail: 'Studio Lighting · Photo Lab', to: '/portal/timetable' },
      { id: 'rm-a2', label: 'Fees cleared', detail: 'No dues outstanding', to: '/portal/fees' },
    ],
    recentGrades: [
      { id: 'prg-901', assessment: 'Composition — Midterm', grade: 'B+' },
      { id: 'prg-902', assessment: 'Studio Lighting — Assignment 1', grade: 'A' },
    ],
  },
  profile: {
    name: 'Arjun Balan', registerNo: 'MAA20260050', email: 'arjun.balan@example.com', phone: '+91 90000 20050',
    dateOfBirth: '2005-11-02', address: '48 Besant Nagar, Chennai 600090', course: 'Photography',
    batch: 'PH Year 1 · A', admittedOn: '2026-06-15', guardianName: 'Balan Muthu', guardianPhone: '+91 90000 10001',
  },
  course: {
    course: 'Photography', code: 'PHOT', batch: 'PH Year 1 · A', facultyName: 'Meera Nair', startedOn: '2026-06-15',
    subjects: [
      { name: 'Studio Lighting', faculty: 'Meera Nair' },
      { name: 'Composition', faculty: 'Meera Nair' },
      { name: 'Digital Post-production', faculty: 'Rahul Deshpande' },
    ],
  },
  timetable: {
    week: [
      { day: 'Monday', sessions: [{ subject: 'Composition', time: '09:00 – 11:00', room: 'Photo Lab', faculty: 'Meera Nair' }] },
      { day: 'Tuesday', sessions: [{ subject: 'Studio Lighting', time: '10:00 – 12:00', room: 'Photo Lab', faculty: 'Meera Nair' }] },
      { day: 'Wednesday', sessions: [{ subject: 'Digital Post-production', time: '13:00 – 15:00', room: 'Computer Lab', faculty: 'Rahul Deshpande' }] },
      { day: 'Thursday', sessions: [] },
      { day: 'Friday', sessions: [{ subject: 'Composition', time: '09:00 – 11:00', room: 'Photo Lab', faculty: 'Meera Nair' }] },
      { day: 'Saturday', sessions: [] },
    ],
  },
  attendance: {
    percentage: 84, present: 96, total: 114,
    recent: [
      { date: '2026-08-19', subject: 'Composition', status: 'present' },
      { date: '2026-08-18', subject: 'Studio Lighting', status: 'absent' },
      { date: '2026-08-17', subject: 'Digital Post-production', status: 'present' },
      { date: '2026-08-14', subject: 'Composition', status: 'present' },
    ],
  },
  progress: {
    records: [
      { id: 'prg-901', assessment: 'Composition — Midterm', type: 'Practical', score: 76, maxScore: 100, grade: 'B+', result: 'Pass', status: 'graded', date: '2026-08-10' },
      { id: 'prg-902', assessment: 'Studio Lighting — Assignment 1', type: 'Portfolio', score: 82, maxScore: 100, grade: 'A', result: 'Pass', status: 'graded', date: '2026-07-25' },
    ],
  },
  fees: {
    assigned: 130000, paid: 130000, outstanding: 0, status: 'paid',
    installments: [
      { label: 'Installment 1 of 2', amount: 65000, dueDate: '2026-07-15', status: 'paid' },
      { label: 'Installment 2 of 2', amount: 65000, dueDate: '2026-09-15', status: 'paid' },
    ],
  },
  payments: {
    records: [
      { id: 'pay-970', amount: 65000, method: 'bank_transfer', date: '2026-09-10', receiptNo: 'MA/2026/0971', status: 'recorded' },
      { id: 'pay-965', amount: 65000, method: 'bank_transfer', date: '2026-07-10', receiptNo: 'MA/2026/0965', status: 'recorded' },
    ],
  },
  certificates: { records: [{ id: 'cert-431', certificateNo: 'MA/CERT/2026/0431', type: 'bonafide', issuedAt: '2026-08-05', status: 'issued' }] },
};

const CHILDREN: ChildBundle[] = [NITHYA, ARJUN];

function resolve(childId?: string): ChildBundle {
  return CHILDREN.find((c) => c.id === childId) ?? CHILDREN[0]!;
}

export function portalChildren(): PortalChildren {
  return {
    children: CHILDREN.map((c) => ({
      id: c.id,
      name: c.overview.student.name,
      course: c.overview.student.course,
      batch: c.overview.student.batch,
    })),
  };
}

export function portalOverview(childId?: string): PortalOverview { return resolve(childId).overview; }
export function portalProfile(childId?: string): PortalProfile { return resolve(childId).profile; }
export function portalCourse(childId?: string): PortalCourse { return resolve(childId).course; }
export function portalTimetable(childId?: string): PortalTimetable { return resolve(childId).timetable; }
export function portalAttendance(childId?: string): PortalAttendance { return resolve(childId).attendance; }
export function portalProgress(childId?: string): PortalProgress { return resolve(childId).progress; }
export function portalFees(childId?: string): PortalFees { return resolve(childId).fees; }
export function portalPayments(childId?: string): PortalPayments { return resolve(childId).payments; }
export function portalCertificates(childId?: string): PortalCertificates { return resolve(childId).certificates; }

/* ------------------------------------------------------------------ */
/* Online fee payment (§ online fee payment).                         */
/* ------------------------------------------------------------------ */

let paySeq = 980;
let receiptSeq = 981;
const CHANNEL_LABEL: Record<string, string> = { card: 'card', upi: 'upi', netbanking: 'netbanking' };

/**
 * Creates a "Razorpay order". A real backend calls Razorpay with its secret key;
 * the mock returns an order shape with an EMPTY `keyId`, which signals the client
 * to run the sandbox flow (no real charge). Amount is echoed in paise.
 */
export function createPortalOrder(amountRupees: number): PortalPayOrder {
  const orderId = `order_${Date.now()}_${paySeq}`;
  paySeq += 1;
  return { orderId, amount: Math.round(amountRupees * 100), currency: 'INR', keyId: '' };
}

/**
 * Records a verified payment against the child and reduces the balance. A real
 * backend verifies the Razorpay signature first; the mock accepts the sandbox
 * signature and updates the in-session fee state so every fee view reflects it.
 */
export function payChildFees(childId: string | undefined, amountRupees: number, method: PortalPaymentChannel): PortalPayResult {
  const bundle = resolve(childId);
  const amount = Math.max(0, Math.round(amountRupees));

  const paid = bundle.fees.paid + amount;
  const outstanding = Math.max(0, bundle.fees.outstanding - amount);
  const status = outstanding <= 0 ? 'paid' : 'partial';

  bundle.fees = { ...bundle.fees, paid, outstanding, status };
  const ovFees = bundle.overview.fees ?? { assigned: bundle.fees.assigned, paid, outstanding, status };
  bundle.overview = { ...bundle.overview, fees: { ...ovFees, paid, outstanding, status } };

  const receiptNo = `MA/2026/0${receiptSeq}`;
  const paymentId = `pay-${paySeq}`;
  paySeq += 1;
  receiptSeq += 1;

  bundle.payments = {
    records: [
      { id: paymentId, amount, method: CHANNEL_LABEL[method] ?? method, date: new Date().toISOString().slice(0, 10), receiptNo, status: 'recorded' },
      ...bundle.payments.records,
    ],
  };

  return { paymentId, receiptNo, status: 'recorded', fees: bundle.fees };
}
