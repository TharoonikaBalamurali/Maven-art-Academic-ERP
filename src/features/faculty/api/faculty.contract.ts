import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { FacultyDetail, FacultyListItem } from '../types';

/** Faculty contract (§3.1). TBD — BACKEND CONTRACT: provisional paths. */
export const facultyContract = {
  list: endpoint<void, Paginated<FacultyListItem>, ListQuery>({
    method: 'GET',
    path: '/faculty',
    auth: true,
    permission: 'faculty.view',
  }),
  get: endpoint<void, FacultyDetail>({
    method: 'GET',
    path: '/faculty/:facultyId',
    auth: true,
    permission: 'faculty.view',
  }),
} as const;
