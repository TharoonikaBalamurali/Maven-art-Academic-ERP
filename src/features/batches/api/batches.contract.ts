import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { BatchDetail, BatchListItem } from '../types';

/**
 * Batches contract (§19). Server-driven list; detail composes the related
 * course, faculty, schedule and roster.
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const batchesContract = {
  list: endpoint<void, Paginated<BatchListItem>, ListQuery>({
    method: 'GET',
    path: '/batches',
    auth: true,
    permission: 'batches.view',
  }),
  get: endpoint<void, BatchDetail>({
    method: 'GET',
    path: '/batches/:batchId',
    auth: true,
    permission: 'batches.view',
  }),
} as const;
