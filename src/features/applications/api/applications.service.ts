import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { ApplicationAction, ApplicationDetail, ApplicationListItem } from '../types';
import { applicationsContract } from './applications.contract';

export const applicationsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<ApplicationListItem>> {
    return apiClient.call(applicationsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(applicationId: Id, options?: RequestOptions): Promise<ApplicationDetail> {
    return apiClient.call(applicationsContract.get, { params: { applicationId }, options });
  },
  /** Runs a transition the backend advertised in `availableActions` (§16). */
  transition(
    applicationId: Id,
    action: ApplicationAction,
    note?: string,
    options?: RequestOptions,
  ): Promise<ApplicationDetail> {
    const params = { applicationId };
    switch (action) {
      case 'submit':
        return apiClient.call(applicationsContract.submit, { params, options });
      case 'start_review':
        return apiClient.call(applicationsContract.startReview, { params, options });
      case 'approve':
        return apiClient.call(applicationsContract.approve, { params, body: { note }, options });
      case 'reject':
        return apiClient.call(applicationsContract.reject, { params, body: { note }, options });
      default:
        return apiClient.call(applicationsContract.get, { params, options });
    }
  },
};
