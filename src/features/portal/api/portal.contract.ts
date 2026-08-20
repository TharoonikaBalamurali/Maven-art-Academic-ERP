import { endpoint } from '@/lib/api';
import type {
  PortalAttendance,
  PortalCertificates,
  PortalChildren,
  PortalCourse,
  PortalFees,
  PortalOverview,
  PortalPayments,
  PortalPayOrder,
  PortalPayResult,
  PortalPayVerifyInput,
  PortalProfile,
  PortalProgress,
  PortalScopeQuery,
  PortalTimetable,
} from '../types';

/**
 * Portal contract (§7, §8, §37) — the authenticated student's own data. The
 * backend scopes every response to the caller; a parent additionally selects a
 * linked child, carried here as the `student` query param (§8). The backend
 * still enforces that the parent may read that child.
 *
 * TBD — BACKEND CONTRACT: provisional paths; the child scope may become a header.
 */
export const portalContract = {
  children: endpoint<void, PortalChildren>({ method: 'GET', path: '/portal/children', auth: true, permission: 'portal.children.view' }),
  overview: endpoint<void, PortalOverview, PortalScopeQuery>({ method: 'GET', path: '/portal/overview', auth: true, permission: 'portal.dashboard.view' }),
  profile: endpoint<void, PortalProfile, PortalScopeQuery>({ method: 'GET', path: '/portal/profile', auth: true, permission: 'portal.profile.view' }),
  course: endpoint<void, PortalCourse, PortalScopeQuery>({ method: 'GET', path: '/portal/course', auth: true, permission: 'portal.academic.view' }),
  timetable: endpoint<void, PortalTimetable, PortalScopeQuery>({ method: 'GET', path: '/portal/timetable', auth: true, permission: 'portal.timetable.view' }),
  attendance: endpoint<void, PortalAttendance, PortalScopeQuery>({ method: 'GET', path: '/portal/attendance', auth: true, permission: 'portal.attendance.view' }),
  progress: endpoint<void, PortalProgress, PortalScopeQuery>({ method: 'GET', path: '/portal/progress', auth: true, permission: 'portal.progress.view' }),
  fees: endpoint<void, PortalFees, PortalScopeQuery>({ method: 'GET', path: '/portal/fees', auth: true, permission: 'portal.fees.view' }),
  payments: endpoint<void, PortalPayments, PortalScopeQuery>({ method: 'GET', path: '/portal/payments', auth: true, permission: 'portal.payments.view' }),
  certificates: endpoint<void, PortalCertificates, PortalScopeQuery>({ method: 'GET', path: '/portal/certificates', auth: true, permission: 'portal.certificates.view' }),

  /**
   * Online fee payment (Razorpay). `createOrder` asks the backend to open a
   * Razorpay order (server-side, with the secret key); `verifyPayment` hands the
   * gateway's response back for signature verification and recording. The client
   * never verifies a payment or decides the resulting balance itself.
   */
  createPayOrder: endpoint<{ amount: number; student?: string }, PortalPayOrder>({ method: 'POST', path: '/portal/payments/order', auth: true, permission: 'portal.fees.view' }),
  verifyPayment: endpoint<PortalPayVerifyInput, PortalPayResult>({ method: 'POST', path: '/portal/payments/verify', auth: true, permission: 'portal.fees.view' }),
} as const;
