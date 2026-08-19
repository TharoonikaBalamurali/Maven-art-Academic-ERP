import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { InstallmentDetail, InstallmentListItem } from '../types';

/**
 * Installments contract (§21) — read views. The schedule and each installment's
 * status are owned by the backend.
 *
 * TBD — BACKEND CONTRACT: provisional paths.
 */
export const installmentsContract = {
  list: endpoint<void, Paginated<InstallmentListItem>, ListQuery>({
    method: 'GET',
    path: '/installments',
    auth: true,
    permission: 'installments.view',
  }),
  get: endpoint<void, InstallmentDetail>({
    method: 'GET',
    path: '/installments/:installmentId',
    auth: true,
    permission: 'installments.view',
  }),
} as const;
