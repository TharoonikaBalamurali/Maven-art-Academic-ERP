import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { ArchivedBatchDetail, ArchivedBatchListItem, ArchivedStudentDetail, ClosedStudentRecord } from '../types';

/**
 * Archive contract (§ archive) — read only. History is written by closing an
 * admission or completing a batch; it is never edited here.
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const archiveContract = {
  batches: endpoint<void, Paginated<ArchivedBatchListItem>, ListQuery>({
    method: 'GET', path: '/archive/batches', auth: true, permission: 'batches.view',
  }),
  batch: endpoint<void, ArchivedBatchDetail>({
    method: 'GET', path: '/archive/batches/:batchId', auth: true, permission: 'batches.view',
  }),
  /** One passed-out student's full leaving record. */
  student: endpoint<void, ArchivedStudentDetail>({
    method: 'GET', path: '/archive/students/:studentId', auth: true, permission: 'students.view',
  }),
  /** Closed student records, independent of whether their batch has passed out. */
  students: endpoint<void, Paginated<ClosedStudentRecord>, ListQuery>({
    method: 'GET', path: '/archive/students', auth: true, permission: 'students.view',
  }),
} as const;
