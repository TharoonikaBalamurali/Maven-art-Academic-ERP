import { endpoint } from '@/lib/api';
import type { PortalAttendance, PortalCourse, PortalOverview, PortalProfile, PortalProgress, PortalTimetable } from '../types';

/**
 * Portal contract (§7, §37) — the authenticated student's own data. The backend
 * scopes every response to the caller (and the selected child for a parent, §8).
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const portalContract = {
  overview: endpoint<void, PortalOverview>({ method: 'GET', path: '/portal/overview', auth: true, permission: 'portal.dashboard.view' }),
  profile: endpoint<void, PortalProfile>({ method: 'GET', path: '/portal/profile', auth: true, permission: 'portal.profile.view' }),
  course: endpoint<void, PortalCourse>({ method: 'GET', path: '/portal/course', auth: true, permission: 'portal.academic.view' }),
  timetable: endpoint<void, PortalTimetable>({ method: 'GET', path: '/portal/timetable', auth: true, permission: 'portal.timetable.view' }),
  attendance: endpoint<void, PortalAttendance>({ method: 'GET', path: '/portal/attendance', auth: true, permission: 'portal.attendance.view' }),
  progress: endpoint<void, PortalProgress>({ method: 'GET', path: '/portal/progress', auth: true, permission: 'portal.progress.view' }),
} as const;
