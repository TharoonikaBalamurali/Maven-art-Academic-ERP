import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { FeeAssignmentDetail, FeeAssignmentListItem } from '../types';
import { feeAssignmentsContract } from './fee-assignments.contract';

export const feeAssignmentsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<FeeAssignmentListItem>> {
    return apiClient.call(feeAssignmentsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(feeAssignmentId: Id, options?: RequestOptions): Promise<FeeAssignmentDetail> {
    return apiClient.call(feeAssignmentsContract.get, { params: { feeAssignmentId }, options });
  },
};
