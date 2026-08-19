import { endpoint } from '@/lib/api';
import type {
  PortalAttendance,
  PortalCertificates,
  PortalCourse,
  PortalFees,
  PortalOverview,
  PortalPayments,
  PortalProfile,
  PortalProgress,
  PortalTimetable,
} from '../types';

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
  fees: endpoint<void, PortalFees>({ method: 'GET', path: '/portal/fees', auth: true, permission: 'portal.fees.view' }),
  payments: endpoint<void, PortalPayments>({ method: 'GET', path: '/portal/payments', auth: true, permission: 'portal.payments.view' }),
  certificates: endpoint<void, PortalCertificates>({ method: 'GET', path: '/portal/certificates', auth: true, permission: 'portal.certificates.view' }),
} as const;
