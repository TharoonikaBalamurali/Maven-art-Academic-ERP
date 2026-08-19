import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { ProgressDetail, ProgressListItem } from '../types';
import { progressContract } from './progress.contract';

export const progressService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<ProgressListItem>> {
    return apiClient.call(progressContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(progressId: Id, options?: RequestOptions): Promise<ProgressDetail> {
    return apiClient.call(progressContract.get, { params: { progressId }, options });
  },
};
