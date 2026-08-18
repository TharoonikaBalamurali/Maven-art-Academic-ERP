import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type {
  StudentDetail,
  StudentFilterOptions,
  StudentInput,
  StudentListItem,
} from '../types';

/**
 * Students contract (§14.1).
 *
 * TBD — BACKEND CONTRACT: provisional paths and query names. The list is
 * server-driven — search, filter, sort and pagination are all query parameters,
 * never client-side (§31, §32).
 */
export const studentsContract = {
  list: endpoint<void, Paginated<StudentListItem>, ListQuery>({
    method: 'GET',
    path: '/students',
    auth: true,
    permission: 'students.view',
  }),
  /** Options for the Course/Status filter controls. */
  filterOptions: endpoint<void, StudentFilterOptions>({
    method: 'GET',
    path: '/students/filter-options',
    auth: true,
    permission: 'students.view',
  }),
  /** Full record for the details page (§14.1). */
  get: endpoint<void, StudentDetail>({
    method: 'GET',
    path: '/students/:studentId',
    auth: true,
    permission: 'students.view',
  }),
  create: endpoint<StudentInput, StudentDetail>({
    method: 'POST',
    path: '/students',
    auth: true,
    permission: 'students.create',
  }),
  update: endpoint<StudentInput, StudentDetail>({
    method: 'PUT',
    path: '/students/:studentId',
    auth: true,
    permission: 'students.update',
  }),
} as const;
