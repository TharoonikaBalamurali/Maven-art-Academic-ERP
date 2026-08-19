import type { PortalOverview, PortalProfile } from '@/features/portal/types';

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
