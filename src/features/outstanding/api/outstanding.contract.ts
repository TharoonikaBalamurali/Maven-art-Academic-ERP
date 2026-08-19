import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { OutstandingDetail, OutstandingListItem } from '../types';

/**
 * Outstanding fees contract (§23) — read only. The backend computes every
 * outstanding figure; there is no client-side aggregation.
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const outstandingContract = {
  list: endpoint<void, Paginated<OutstandingListItem>, ListQuery>({
    method: 'GET',
    path: '/outstanding',
    auth: true,
    permission: 'outstanding.view',
  }),
  get: endpoint<void, OutstandingDetail>({
    method: 'GET',
    path: '/outstanding/:outstandingId',
    auth: true,
    permission: 'outstanding.view',
  }),
} as const;
