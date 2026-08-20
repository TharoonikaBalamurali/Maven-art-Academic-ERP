import { apiClient } from '@/lib/api';
import type { RequestOptions } from '@/shared/types';
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
import { portalContract } from './portal.contract';

/** The selected-child scope, sent with every scoped portal request (§8). */
function scope(childId?: string | null): PortalScopeQuery | undefined {
  return childId ? { student: childId } : undefined;
}

export const portalService = {
  children(options?: RequestOptions): Promise<PortalChildren> {
    return apiClient.call(portalContract.children, { options });
  },
  overview(childId?: string | null, options?: RequestOptions): Promise<PortalOverview> {
    return apiClient.call(portalContract.overview, { query: scope(childId), options });
  },
  profile(childId?: string | null, options?: RequestOptions): Promise<PortalProfile> {
    return apiClient.call(portalContract.profile, { query: scope(childId), options });
  },
  course(childId?: string | null, options?: RequestOptions): Promise<PortalCourse> {
    return apiClient.call(portalContract.course, { query: scope(childId), options });
  },
  timetable(childId?: string | null, options?: RequestOptions): Promise<PortalTimetable> {
    return apiClient.call(portalContract.timetable, { query: scope(childId), options });
  },
  attendance(childId?: string | null, options?: RequestOptions): Promise<PortalAttendance> {
    return apiClient.call(portalContract.attendance, { query: scope(childId), options });
  },
  progress(childId?: string | null, options?: RequestOptions): Promise<PortalProgress> {
    return apiClient.call(portalContract.progress, { query: scope(childId), options });
  },
  fees(childId?: string | null, options?: RequestOptions): Promise<PortalFees> {
    return apiClient.call(portalContract.fees, { query: scope(childId), options });
  },
  payments(childId?: string | null, options?: RequestOptions): Promise<PortalPayments> {
    return apiClient.call(portalContract.payments, { query: scope(childId), options });
  },
  certificates(childId?: string | null, options?: RequestOptions): Promise<PortalCertificates> {
    return apiClient.call(portalContract.certificates, { query: scope(childId), options });
  },
  createPayOrder(amount: number, childId?: string | null, options?: RequestOptions): Promise<PortalPayOrder> {
    return apiClient.call(portalContract.createPayOrder, { body: { amount, student: childId ?? undefined }, options });
  },
  verifyPayment(input: PortalPayVerifyInput, options?: RequestOptions): Promise<PortalPayResult> {
    return apiClient.call(portalContract.verifyPayment, { body: input, options });
  },
};
