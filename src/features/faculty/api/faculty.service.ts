import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { FacultyDetail, FacultyListItem } from '../types';
import { facultyContract } from './faculty.contract';

export const facultyService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<FacultyListItem>> {
    return apiClient.call(facultyContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(facultyId: Id, options?: RequestOptions): Promise<FacultyDetail> {
    return apiClient.call(facultyContract.get, { params: { facultyId }, options });
  },
};
