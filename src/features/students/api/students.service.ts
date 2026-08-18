import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type {
  StudentDetail,
  StudentFilterOptions,
  StudentInput,
  StudentListItem,
} from '../types';
import { studentsContract } from './students.contract';

export const studentsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<StudentListItem>> {
    return apiClient.call(studentsContract.list, {
      query: toListParams(query) as ListQuery,
      options,
    });
  },

  filterOptions(options?: RequestOptions): Promise<StudentFilterOptions> {
    return apiClient.call(studentsContract.filterOptions, { options });
  },

  get(studentId: Id, options?: RequestOptions): Promise<StudentDetail> {
    return apiClient.call(studentsContract.get, { params: { studentId }, options });
  },

  create(input: StudentInput, options?: RequestOptions): Promise<StudentDetail> {
    return apiClient.call(studentsContract.create, { body: input, options });
  },

  update(studentId: Id, input: StudentInput, options?: RequestOptions): Promise<StudentDetail> {
    return apiClient.call(studentsContract.update, { params: { studentId }, body: input, options });
  },
};
