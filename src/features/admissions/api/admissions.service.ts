import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { AdmissionAction, AdmissionDetail, AdmissionListItem } from '../types';
import { admissionsContract } from './admissions.contract';

export const admissionsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<AdmissionListItem>> {
    return apiClient.call(admissionsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(admissionId: Id, options?: RequestOptions): Promise<AdmissionDetail> {
    return apiClient.call(admissionsContract.get, { params: { admissionId }, options });
  },
  /** Runs a transition the backend advertised in `availableActions` (§17). */
  transition(
    admissionId: Id,
    action: AdmissionAction,
    note?: string,
    options?: RequestOptions,
  ): Promise<AdmissionDetail> {
    const params = { admissionId };
    switch (action) {
      case 'confirm':
        return apiClient.call(admissionsContract.confirm, { params, body: { note }, options });
      case 'enroll':
        return apiClient.call(admissionsContract.enroll, { params, body: { note }, options });
      case 'cancel':
        return apiClient.call(admissionsContract.cancel, { params, body: { note }, options });
      default:
        return apiClient.call(admissionsContract.get, { params, options });
    }
  },
};
