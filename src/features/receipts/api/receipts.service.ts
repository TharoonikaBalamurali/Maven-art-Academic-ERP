import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { ReceiptDetail, ReceiptListItem } from '../types';
import { receiptsContract } from './receipts.contract';

export const receiptsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<ReceiptListItem>> {
    return apiClient.call(receiptsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(receiptId: Id, options?: RequestOptions): Promise<ReceiptDetail> {
    return apiClient.call(receiptsContract.get, { params: { receiptId }, options });
  },
};
