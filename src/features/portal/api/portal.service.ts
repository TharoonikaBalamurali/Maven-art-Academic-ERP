import { apiClient } from '@/lib/api';
import type { RequestOptions } from '@/shared/types';
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
import { portalContract } from './portal.contract';

export const portalService = {
  overview(options?: RequestOptions): Promise<PortalOverview> { return apiClient.call(portalContract.overview, { options }); },
  profile(options?: RequestOptions): Promise<PortalProfile> { return apiClient.call(portalContract.profile, { options }); },
  course(options?: RequestOptions): Promise<PortalCourse> { return apiClient.call(portalContract.course, { options }); },
  timetable(options?: RequestOptions): Promise<PortalTimetable> { return apiClient.call(portalContract.timetable, { options }); },
  attendance(options?: RequestOptions): Promise<PortalAttendance> { return apiClient.call(portalContract.attendance, { options }); },
  progress(options?: RequestOptions): Promise<PortalProgress> { return apiClient.call(portalContract.progress, { options }); },
  fees(options?: RequestOptions): Promise<PortalFees> { return apiClient.call(portalContract.fees, { options }); },
  payments(options?: RequestOptions): Promise<PortalPayments> { return apiClient.call(portalContract.payments, { options }); },
  certificates(options?: RequestOptions): Promise<PortalCertificates> { return apiClient.call(portalContract.certificates, { options }); },
};
