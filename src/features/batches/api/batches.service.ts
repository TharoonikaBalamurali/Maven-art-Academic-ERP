import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { BatchDetail, BatchListItem } from '../types';
import { batchesContract } from './batches.contract';

export const batchesService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<BatchListItem>> {
    return apiClient.call(batchesContract.list, { query: toListParams(query) as ListQuery, options });
  },

  get(batchId: Id, options?: RequestOptions): Promise<BatchDetail> {
    return apiClient.call(batchesContract.get, { params: { batchId }, options });
  },
};
