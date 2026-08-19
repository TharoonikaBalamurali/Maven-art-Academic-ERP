import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { FeeAssignmentDetail, FeeAssignmentListItem } from '../types';

/**
 * Fee assignments contract (§20) — read views. Create is owned by the backend;
 * amounts and balances are always backend-authoritative.
 *
 * TBD — BACKEND CONTRACT: provisional paths; create endpoint pending.
 */
export const feeAssignmentsContract = {
  list: endpoint<void, Paginated<FeeAssignmentListItem>, ListQuery>({
    method: 'GET',
    path: '/fee-assignments',
    auth: true,
    permission: 'fee_assignments.view',
  }),
  get: endpoint<void, FeeAssignmentDetail>({
    method: 'GET',
    path: '/fee-assignments/:feeAssignmentId',
    auth: true,
    permission: 'fee_assignments.view',
  }),
} as const;
