import { apiClient } from '@/lib/api';
import type { RequestOptions } from '@/shared/types';
import type { PortalOverview, PortalProfile } from '../types';
import { portalContract } from './portal.contract';

export const portalService = {
  overview(options?: RequestOptions): Promise<PortalOverview> {
    return apiClient.call(portalContract.overview, { options });
  },
  profile(options?: RequestOptions): Promise<PortalProfile> {
    return apiClient.call(portalContract.profile, { options });
  },
};
