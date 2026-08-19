import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { FeeStructureDetail, FeeStructureListItem } from '../types';
import { feeStructuresContract } from './fee-structures.contract';

export const feeStructuresService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<FeeStructureListItem>> {
    return apiClient.call(feeStructuresContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(feeStructureId: Id, options?: RequestOptions): Promise<FeeStructureDetail> {
    return apiClient.call(feeStructuresContract.get, { params: { feeStructureId }, options });
  },
};
