import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { CourseDetail, CourseListItem } from '../types';
import { coursesContract } from './courses.contract';

export const coursesService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<CourseListItem>> {
    return apiClient.call(coursesContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(courseId: Id, options?: RequestOptions): Promise<CourseDetail> {
    return apiClient.call(coursesContract.get, { params: { courseId }, options });
  },
};
