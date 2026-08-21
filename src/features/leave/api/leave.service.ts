import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { LeaveAction, LeaveDetail, LeaveListItem } from '../types';
import { leaveContract } from './leave.contract';

export const leaveService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<LeaveListItem>> {
    return apiClient.call(leaveContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(requestId: Id, options?: RequestOptions): Promise<LeaveDetail> {
    return apiClient.call(leaveContract.get, { params: { requestId }, options });
  },
  /** Runs a decision the backend advertised in `availableActions`. */
  decide(requestId: Id, action: LeaveAction, note?: string, options?: RequestOptions): Promise<LeaveDetail> {
    const params = { requestId };
    return action === 'approve'
      ? apiClient.call(leaveContract.approve, { params, body: { note }, options })
      : apiClient.call(leaveContract.reject, { params, body: { note }, options });
  },
};
