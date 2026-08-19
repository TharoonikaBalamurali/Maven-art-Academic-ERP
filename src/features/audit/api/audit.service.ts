import { apiClient, toListParams } from '@/lib/api';
import type { Id, ListQuery, Paginated, RequestOptions } from '@/shared/types';
import type { AuditDetail, AuditListItem } from '../types';
import { auditContract } from './audit.contract';

export const auditService = {
  list(query: ListQuery, options?: RequestOptions): Promise<Paginated<AuditListItem>> {
    return apiClient.call(auditContract.list, { query: toListParams(query) as ListQuery, options });
  },
  get(auditId: Id, options?: RequestOptions): Promise<AuditDetail> {
    return apiClient.call(auditContract.get, { params: { auditId }, options });
  },
};
