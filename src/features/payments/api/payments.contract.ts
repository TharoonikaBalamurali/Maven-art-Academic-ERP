import { endpoint } from '@/lib/api';
import type { ListQuery, Paginated } from '@/shared/types';
import type { PaymentDetail, PaymentListItem, RecordPaymentInput } from '../types';

/**
 * Payments contract (§22). Recording a payment requires `payments.create`; the
 * backend records the transaction, updates balances and returns the stored
 * payment. Reading requires `payments.view`.
 *
 * TBD — BACKEND CONTRACT: provisional paths and payload.
 */
export const paymentsContract = {
  list: endpoint<void, Paginated<PaymentListItem>, ListQuery>({
    method: 'GET',
    path: '/payments',
    auth: true,
    permission: 'payments.view',
  }),
  get: endpoint<void, PaymentDetail>({
    method: 'GET',
    path: '/payments/:paymentId',
    auth: true,
    permission: 'payments.view',
  }),
  record: endpoint<RecordPaymentInput, PaymentDetail>({
    method: 'POST',
    path: '/payments',
    auth: true,
    permission: 'payments.create',
  }),
} as const;
