import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { EnrollmentDetail, EnrollmentListItem } from '../types';
import { enrollmentsContract } from './enrollments.contract';

export const enrollmentsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<EnrollmentListItem>> {
    return apiClient.call(enrollmentsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(enrollmentId: Id, options?: RequestOptions): Promise<EnrollmentDetail> {
    return apiClient.call(enrollmentsContract.get, { params: { enrollmentId }, options });
  },
};
