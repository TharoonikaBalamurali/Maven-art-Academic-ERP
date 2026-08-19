import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { CourseDetail, CourseListItem } from '../types';

/** Courses contract (§19). TBD — BACKEND CONTRACT: provisional paths. */
export const coursesContract = {
  list: endpoint<void, Paginated<CourseListItem>, ListQuery>({
    method: 'GET',
    path: '/courses',
    auth: true,
    permission: 'courses.view',
  }),
  get: endpoint<void, CourseDetail>({
    method: 'GET',
    path: '/courses/:courseId',
    auth: true,
    permission: 'courses.view',
  }),
} as const;
