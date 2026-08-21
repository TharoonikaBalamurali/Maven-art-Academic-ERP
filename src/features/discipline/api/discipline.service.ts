import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { DisciplineDetail, DisciplineListItem } from '../types';
import { disciplineContract } from './discipline.contract';

export const disciplineService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<DisciplineListItem>> {
    return apiClient.call(disciplineContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(caseId: Id, options?: RequestOptions): Promise<DisciplineDetail> {
    return apiClient.call(disciplineContract.get, { params: { caseId }, options });
  },
};
