import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { InstallmentDetail, InstallmentListItem } from '../types';
import { installmentsContract } from './installments.contract';

export const installmentsService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<InstallmentListItem>> {
    return apiClient.call(installmentsContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(installmentId: Id, options?: RequestOptions): Promise<InstallmentDetail> {
    return apiClient.call(installmentsContract.get, { params: { installmentId }, options });
  },
};
