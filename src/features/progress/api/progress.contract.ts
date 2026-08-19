import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { ProgressDetail, ProgressListItem } from '../types';

/**
 * Academic progress contract (§26) — read views. Grades and results are
 * computed by the backend; score entry (progress.update) is a separate unit.
 *
 * TBD — BACKEND CONTRACT: provisional paths; a score-entry endpoint is pending.
 */
export const progressContract = {
  list: endpoint<void, Paginated<ProgressListItem>, ListQuery>({
    method: 'GET',
    path: '/progress',
    auth: true,
    permission: 'progress.view',
  }),
  get: endpoint<void, ProgressDetail>({
    method: 'GET',
    path: '/progress/:progressId',
    auth: true,
    permission: 'progress.view',
  }),
} as const;
