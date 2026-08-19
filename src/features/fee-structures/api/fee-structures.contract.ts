import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { FeeStructureDetail, FeeStructureListItem } from '../types';

/**
 * Fee structures contract (§19) — read views. Create/update are owned by the
 * backend; amounts and totals are always backend-authoritative.
 *
 * TBD — BACKEND CONTRACT: provisional paths; create/update endpoints pending.
 */
export const feeStructuresContract = {
  list: endpoint<void, Paginated<FeeStructureListItem>, ListQuery>({
    method: 'GET',
    path: '/fee-structures',
    auth: true,
    permission: 'fee_structures.view',
  }),
  get: endpoint<void, FeeStructureDetail>({
    method: 'GET',
    path: '/fee-structures/:feeStructureId',
    auth: true,
    permission: 'fee_structures.view',
  }),
} as const;
