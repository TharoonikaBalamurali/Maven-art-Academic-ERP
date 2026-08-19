import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { PaymentDetail, PaymentListItem, RecordPaymentInput } from '../types';
import { paymentsContract } from './payments.contract';

export const paymentsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<PaymentListItem>> {
    return apiClient.call(paymentsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(paymentId: Id, options?: RequestOptions): Promise<PaymentDetail> {
    return apiClient.call(paymentsContract.get, { params: { paymentId }, options });
  },
  /** Records a payment; the backend returns the stored transaction (§22). */
  record(input: RecordPaymentInput, options?: RequestOptions): Promise<PaymentDetail> {
    return apiClient.call(paymentsContract.record, { body: input, options });
  },
};
