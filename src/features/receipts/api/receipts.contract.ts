import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { ReceiptDetail, ReceiptListItem } from '../types';

/**
 * Receipts contract (§24) — read only. Receipts are issued by the backend when
 * a payment is recorded; the frontend never generates one.
 *
 * TBD — BACKEND CONTRACT: provisional paths; a document-download endpoint is
 * pending.
 */
export const receiptsContract = {
  list: endpoint<void, Paginated<ReceiptListItem>, ListQuery>({
    method: 'GET',
    path: '/receipts',
    auth: true,
    permission: 'receipts.view',
  }),
  get: endpoint<void, ReceiptDetail>({
    method: 'GET',
    path: '/receipts/:receiptId',
    auth: true,
    permission: 'receipts.view',
  }),
} as const;
