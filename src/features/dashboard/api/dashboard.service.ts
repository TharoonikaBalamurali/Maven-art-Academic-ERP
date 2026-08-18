import { apiClient } from '@/lib/api';
import type { RequestOptions } from '@/shared/types';
import type { DashboardSummary } from '../types';
import { dashboardContract } from './dashboard.contract';

/** The only module that talks to the dashboard endpoint. */
export const dashboardService = {
  summary(options?: RequestOptions): Promise<DashboardSummary> {
    return apiClient.call(dashboardContract.summary, { options });
  },
};
