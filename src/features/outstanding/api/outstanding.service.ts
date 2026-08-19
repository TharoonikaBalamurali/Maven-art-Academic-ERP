import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { OutstandingDetail, OutstandingListItem } from '../types';
import { outstandingContract } from './outstanding.contract';

export const outstandingService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<OutstandingListItem>> {
    return apiClient.call(outstandingContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(outstandingId: Id, options?: RequestOptions): Promise<OutstandingDetail> {
    return apiClient.call(outstandingContract.get, { params: { outstandingId }, options });
  },
};
