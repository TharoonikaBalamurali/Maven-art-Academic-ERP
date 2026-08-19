import type {
  PortalAttendance,
  PortalCourse,
  PortalOverview,
  PortalProfile,
  PortalProgress,
  PortalTimetable,
} from '@/features/portal/types';

/**
 * Portal mock (§7, §8).
 *
 * The backend scopes portal data to the caller. In this mock a single canonical
 * student snapshot (Nithya Balan) stands in for "me" — for a student that is
 * their own record, for a parent it is the selected linked child (§8). Amounts,
 * attendance and grades are the backend's figures. In-memory for the session.
 */
const STUDENT = {
  name: 'Nithya Balan',
  registerNo: 'MAA20260001',
  course: 'Bachelor of Fine Arts',
  batch: 'BFA Year 1 · A',
};

export function portalOverview(): PortalOverview {
  return {
    student: { ...STUDENT },
    attendance: { percentage: 92, present: 118, total: 128 },
    fees: { outstanding: 98000, status: 'partial' },
    nextClass: { subject: 'Foundation Drawing', day: 'Monday', time: '09:00 – 10:30', room: 'Studio 2' },
    latestGrade: { assessment: 'Foundation Drawing — Midterm', grade: 'A+' },
  };
}

export function portalProfile(): PortalProfile {
  return {
    name: STUDENT.name,
    registerNo: STUDENT.registerNo,
    email: 'nithya.balan@example.com',
    phone: '+91 90000 20001',
    dateOfBirth: '2007-03-14',
    address: '48 Besant Nagar, Chennai 600090',
    course: STUDENT.course,
    batch: STUDENT.batch,
    admittedOn: '2026-06-15',
    guardianName: 'Balan Muthu',
    guardianPhone: '+91 90000 10001',
  };
}


export function portalCourse(): PortalCourse {
  return {
    course: STUDENT.course,
    code: 'BFA',
    batch: STUDENT.batch,
    facultyName: 'Suresh Iyer',
    startedOn: '2026-06-15',
    subjects: [
      { name: 'Foundation Drawing', faculty: 'Suresh Iyer' },
      { name: 'Colour & Composition', faculty: 'Meera Nair' },
      { name: 'Art History', faculty: 'Priya Venkatesh' },
      { name: 'Sculpture Basics', faculty: 'Rahul Deshpande' },
    ],
  };
}

export function portalTimetable(): PortalTimetable {
  return {
    week: [
      { day: 'Monday', sessions: [
        { subject: 'Foundation Drawing', time: '09:00 – 10:30', room: 'Studio 2', faculty: 'Suresh Iyer' },
        { subject: 'Art History', time: '11:00 – 12:00', room: 'Room 4', faculty: 'Priya Venkatesh' },
      ] },
      { day: 'Tuesday', sessions: [
        { subject: 'Colour & Composition', time: '09:00 – 11:00', room: 'Studio 1', faculty: 'Meera Nair' },
      ] },
      { day: 'Wednesday', sessions: [
        { subject: 'Foundation Drawing', time: '09:00 – 10:30', room: 'Studio 2', faculty: 'Suresh Iyer' },
        { subject: 'Sculpture Basics', time: '13:00 – 15:00', room: 'Workshop', faculty: 'Rahul Deshpande' },
      ] },
      { day: 'Thursday', sessions: [
        { subject: 'Colour & Composition', time: '09:00 – 11:00', room: 'Studio 1', faculty: 'Meera Nair' },
      ] },
      { day: 'Friday', sessions: [
        { subject: 'Art History', time: '10:00 – 11:00', room: 'Room 4', faculty: 'Priya Venkatesh' },
        { subject: 'Sculpture Basics', time: '13:00 – 15:00', room: 'Workshop', faculty: 'Rahul Deshpande' },
      ] },
      { day: 'Saturday', sessions: [] },
    ],
  };
}

export function portalAttendance(): PortalAttendance {
  return {
    percentage: 92,
    present: 118,
    total: 128,
    recent: [
      { date: '2026-08-19', subject: 'Foundation Drawing', status: 'present' },
      { date: '2026-08-18', subject: 'Colour & Composition', status: 'present' },
      { date: '2026-08-16', subject: 'Sculpture Basics', status: 'late' },
      { date: '2026-08-15', subject: 'Art History', status: 'absent' },
      { date: '2026-08-14', subject: 'Foundation Drawing', status: 'present' },
    ],
  };
}

export function portalProgress(): PortalProgress {
  return {
    records: [
      { id: 'prg-803', assessment: 'Foundation Drawing — Midterm', type: 'Studio', score: 91, maxScore: 100, grade: 'A+', result: 'Pass', status: 'graded', date: '2026-08-12' },
      { id: 'prg-810', assessment: 'Colour & Composition — Assignment 1', type: 'Portfolio', score: 78, maxScore: 100, grade: 'B+', result: 'Pass', status: 'graded', date: '2026-07-28' },
      { id: 'prg-811', assessment: 'Art History — Quiz 1', type: 'Written', score: 64, maxScore: 100, grade: 'B', result: 'Pass', status: 'graded', date: '2026-07-20' },
      { id: 'prg-812', assessment: 'Sculpture Basics — Project', type: 'Project', score: null, maxScore: 100, grade: null, result: null, status: 'pending', date: null },
    ],
  };
}
