import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { ParentDetail, ParentListItem } from '../types';
import { parentsContract } from './parents.contract';

export const parentsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<ParentListItem>> {
    return apiClient.call(parentsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(parentId: Id, options?: RequestOptions): Promise<ParentDetail> {
    return apiClient.call(parentsContract.get, { params: { parentId }, options });
  },
};
