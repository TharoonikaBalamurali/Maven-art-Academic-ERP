import { endpoint } from '@/lib/api';
import type { AttendanceClass, AttendanceRoster, AttendanceSubmission } from '../types';

/**
 * Attendance contract (§21).
 *
 * `todaysClasses` returns only the classes the authenticated user is scheduled
 * for — the backend does the scoping, so there is no way for the UI to request
 * an arbitrary batch. `submit` is re-authorized by the backend (§6): a faculty
 * member submitting for a class they are not assigned to is rejected.
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const attendanceContract = {
  todaysClasses: endpoint<void, AttendanceClass[]>({
    method: 'GET',
    path: '/attendance/classes',
    auth: true,
    permission: 'attendance.view',
  }),
  roster: endpoint<void, AttendanceRoster>({
    method: 'GET',
    path: '/attendance/classes/:classId',
    auth: true,
    permission: 'attendance.view',
  }),
  submit: endpoint<AttendanceSubmission, AttendanceRoster>({
    method: 'POST',
    path: '/attendance/classes/:classId',
    auth: true,
    permission: 'attendance.mark',
  }),
} as const;
